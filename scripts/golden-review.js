'use strict';

const {createHash} = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {compareCorpus, writeCorpusReports} = require('./compare-corpus');
const {sortJsonKeys} = require('./compare-artifacts');

const REVIEW_QUERY = `query($owner:String!, $repo:String!, $number:Int!, $cursor:String) {
  repository(owner:$owner, name:$repo) {
    pullRequest(number:$number) {
      state headRefOid baseRefOid reviewDecision
      reviews(first:100, after:$cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          databaseId state body submittedAt url commit { oid }
          author { login __typename }
          onBehalfOf(first:100) {
            pageInfo { hasNextPage }
            nodes { slug organization { login } }
          }
        }
      }
    }
  }
}`;
const MACHINE_USERS = new Set(['diplodoc-bot', 'yc-ui-bot', 'github-actions', 'dependabot']);

/**
 * Bind acceptance to the complete comparison, not a reusable label or version range.
 * @param {Object} result Raw corpus comparison.
 * @param {Object} binding Repository, PR and exact base/head SHAs.
 * @returns {Object} Immutable review request and its command.
 */
function reviewRequest(result, binding) {
    if (
        !/^[\w.-]+\/[\w.-]+$/.test(binding.repository) ||
        !Number.isSafeInteger(binding.pr) ||
        binding.pr < 1 ||
        ![binding.base, binding.head].every((sha) => /^[a-f0-9]{40}$/.test(sha || ''))
    ) {
        throw new Error('Invalid golden comparison binding');
    }
    const digest = createHash('sha256')
        .update(JSON.stringify(sortJsonKeys({version: 1, ...binding, result})))
        .digest('hex');
    return {...binding, digest, command: `/golden-approve sha256:${digest}`};
}

/**
 * The repository currently has one global owner rule; reject unsupported policies.
 * @param {string} source Trusted CODEOWNERS file.
 * @returns {string[]} Owner identities.
 */
function globalCodeowners(source) {
    const rules = source
        .split(/\r?\n/)
        .map((line) => line.split('#')[0].trim())
        .filter(Boolean);
    if (rules.length !== 1 || !rules[0].startsWith('* ')) {
        throw new Error('Golden approval requires one global CODEOWNERS rule');
    }
    const owners = rules[0]
        .split(/\s+/)
        .slice(1)
        .map((owner) => owner.toLowerCase());
    if (!owners.length || owners.some((owner) => !/^@[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(owner))) {
        throw new Error('Invalid golden CODEOWNERS policy');
    }
    return owners;
}

function approvedReview(reviews, request, owners) {
    if (
        reviews.some((review) => !Number.isSafeInteger(review?.databaseId) || review.databaseId < 1)
    ) {
        throw new Error('Incomplete golden review identity');
    }
    const latest = new Map();
    for (const review of [...reviews].sort((a, b) => a.databaseId - b.databaseId)) {
        if (['APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'].includes(review.state)) {
            latest.set(review.author?.login?.toLowerCase(), review);
        }
    }
    return [...latest.values()].find((review) => {
        const login = review.author?.login?.toLowerCase();
        if (
            !login ||
            review.author.__typename !== 'User' ||
            MACHINE_USERS.has(login) ||
            review.state !== 'APPROVED' ||
            review.commit?.oid !== request.head ||
            !String(review.body || '')
                .split(/\r?\n/)
                .some((line) => line.trim() === request.command)
        ) {
            return false;
        }
        if (review.onBehalfOf?.pageInfo?.hasNextPage !== false) {
            return false;
        }
        const identities = [
            `@${login}`,
            ...(review.onBehalfOf.nodes || []).map((team) =>
                `@${team.organization.login}/${team.slug}`.toLowerCase(),
            ),
        ];
        return identities.some((identity) => owners.includes(identity));
    });
}

async function currentReviews(github, request) {
    const [owner, repo] = request.repository.split('/');
    const reviews = [];
    let cursor = null;
    for (let page = 0; page < 10; page++) {
        const response = await github.graphql(REVIEW_QUERY, {
            owner,
            repo,
            number: request.pr,
            cursor,
        });
        const pr = response.repository?.pullRequest;
        if (
            !pr ||
            pr.state !== 'OPEN' ||
            pr.headRefOid !== request.head ||
            pr.baseRefOid !== request.base
        ) {
            throw new Error(
                'Golden comparison is stale; run it again for the current PR head and base',
            );
        }
        if (!Array.isArray(pr.reviews?.nodes) || !pr.reviews.pageInfo) {
            throw new Error('Incomplete golden review evidence');
        }
        reviews.push(...pr.reviews.nodes);
        if (pr.reviews.pageInfo.hasNextPage === false) {
            return pr.reviewDecision === 'APPROVED' ? reviews : [];
        }
        const next = pr.reviews.pageInfo.endCursor;
        if (!next || next === cursor) {
            throw new Error('Incomplete golden review pagination');
        }
        cursor = next;
    }
    throw new Error('Golden review history exceeds the safe pagination limit');
}

/**
 * Data-only comparator gate. No PR code or writable GitHub token is used here.
 * @param {Object} clients GitHub Actions API, context and logging clients.
 * @param {Object} env Trusted workflow comparison inputs.
 * @returns {Promise<void>} Gate outcome through core.setFailed or a thrown error.
 */
async function runGoldenReview({github, context, core}, env = process.env) {
    const output = env.GOLDEN_REPORTS || 'reports';
    fs.mkdirSync(output, {recursive: true});
    const result = compareCorpus(env.GOLDEN_BASELINE, env.GOLDEN_CANDIDATE);
    writeCorpusReports(result, output);
    if (result.passed) {
        core.notice('Golden comparison is identical; no approval required');
        return;
    }

    const request = reviewRequest(result, {
        repository: `${context.repo.owner}/${context.repo.repo}`,
        pr: Number(env.GOLDEN_PR),
        base: env.GOLDEN_BASE,
        head: env.GOLDEN_HEAD,
    });
    const summary = path.join(output, 'golden-review.md');
    fs.writeFileSync(
        path.join(output, 'golden-review.json'),
        JSON.stringify({request, accepted: false}, null, 2),
    );
    fs.writeFileSync(
        summary,
        [
            '# Golden differences need human CODEOWNER approval',
            `Head: \`${request.head}\`  \nBase: \`${request.base}\``,
            'Inspect the HTML, Markdown and SVG reports from this run. To accept this exact diff,',
            'submit an **Approve** review as a human CODEOWNER with this line in the review body:',
            `\n\`\`\`text\n${request.command}\n\`\`\``,
            'Then use **Re-run failed jobs** on this run. Only the comparison of retained artifacts is repeated.',
            'A changed head, base or comparison needs new approval. Build and screenshot failures cannot be approved here.',
            '',
        ].join('\n\n'),
    );

    const owners = globalCodeowners(
        fs.readFileSync(path.join(__dirname, '../.github/CODEOWNERS'), 'utf8'),
    );
    const approval = approvedReview(await currentReviews(github, request), request, owners);
    if (!approval) {
        core.setFailed(
            'Golden differences require an exact-diff approval from a human CODEOWNER; see golden-review.md',
        );
        return;
    }
    const accepted = {
        request,
        accepted: true,
        reviewId: approval.databaseId,
        reviewer: approval.author.login,
        reviewUrl: approval.url,
    };
    fs.writeFileSync(path.join(output, 'golden-review.json'), JSON.stringify(accepted, null, 2));
    fs.appendFileSync(
        summary,
        `\n## Accepted differences\n\nApproved by ${approval.author.login}: ${approval.url}\n\nThe raw comparison still records every difference. Other CI checks remain required.\n`,
    );
    core.notice(`Golden differences accepted by ${approval.author.login} for ${request.head}`);
}

module.exports = {reviewRequest, globalCodeowners, approvedReview, currentReviews, runGoldenReview};
