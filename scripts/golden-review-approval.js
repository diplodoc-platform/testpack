'use strict';

const {exactHumanReviews, globalCodeowners, currentReviews} = require('./golden-review');

// Only this installed App can attest private team membership. Actions checks
// and user-created commit statuses are not approval evidence.
const APPROVAL_APP_ID = 2126995;
const APPROVAL_CHECK = 'Golden difference approval';

function proofIdentity(request, review) {
    return JSON.stringify({
        version: 1,
        repository: request.repository,
        pr: request.pr,
        base: request.base,
        head: request.head,
        digest: request.digest,
        reviewId: review.databaseId,
        reviewer: review.author.login.toLowerCase(),
    });
}

/**
 * Read App-authenticated proof, then match it to a still-valid human review.
 * @param {Object} github Read-only API client.
 * @param {Object} request Exact comparison binding.
 * @param {Object[]} reviews Current, fully paginated PR reviews.
 * @returns {Promise<Object|undefined>} Confirmed human approval, if present.
 */
async function confirmedTeamReview(github, request, reviews) {
    const candidates = exactHumanReviews(reviews, request);
    if (!candidates.length) return undefined;

    const [owner, repo] = request.repository.split('/');
    let count = 0;
    for await (const page of github.paginate.iterator(github.rest.checks.listForRef, {
        owner,
        repo,
        ref: request.head,
        check_name: APPROVAL_CHECK,
        filter: 'all',
        per_page: 100,
    })) {
        if (++count > 10) throw new Error('Golden approval checks exceed the pagination limit');
        if (!Array.isArray(page.data)) throw new Error('Incomplete golden approval checks');
        for (const check of page.data) {
            if (
                check.app?.id !== APPROVAL_APP_ID ||
                check.name !== APPROVAL_CHECK ||
                check.head_sha !== request.head ||
                check.status !== 'completed' ||
                check.conclusion !== 'success'
            )
                continue;

            const approval = candidates.find(
                (review) => check.external_id === proofIdentity(request, review),
            );
            if (approval) return approval;
        }
    }
    return undefined;
}

async function isCodeowner(github, review, owners, organization) {
    const login = review.author.login.toLowerCase();
    if (owners.includes(`@${login}`)) return true;

    for (const owner of owners.filter((value) => value.includes('/'))) {
        const [org, team] = owner.slice(1).split('/');
        if (org !== organization.toLowerCase()) {
            throw new Error('Cross-organization CODEOWNER teams are unsupported');
        }
        try {
            const membership = await github.rest.teams.getMembershipForUserInOrg({
                org,
                team_slug: team,
                username: login,
            });
            if (membership.data.state === 'active') return true;
        } catch (error) {
            if (error.status !== 404) throw error;
        }
    }
    return false;
}

/**
 * Trusted manual handler. Uses only GitHub metadata, never PR code or artifacts.
 * @param {Object} clients Scoped App API client, trusted event context and logger.
 * @returns {Promise<void>} Writes an authenticated check after owner verification.
 */
async function publishGoldenApproval({github, context, core}) {
    const {owner, repo} = context.repo;
    const inputs = context.payload.inputs || {};
    if (
        context.eventName !== 'workflow_dispatch' ||
        context.ref !== `refs/heads/${context.payload.repository.default_branch}` ||
        !/^[1-9]\d*$/.test(inputs.pr || '') ||
        !Number.isSafeInteger(Number(inputs.pr)) ||
        !/^[a-f0-9]{64}$/.test(inputs.digest || '')
    )
        throw new Error('Golden approval requires a default-branch dispatch and exact PR/digest');

    const {data: pr} = await github.rest.pulls.get({owner, repo, pull_number: Number(inputs.pr)});
    if (pr.state !== 'open' || pr.base.repo.full_name !== `${owner}/${repo}`) {
        throw new Error('Golden approval requires an open PR in this repository');
    }
    const request = {
        repository: `${owner}/${repo}`,
        pr: pr.number,
        base: pr.base.sha,
        head: pr.head.sha,
        digest: inputs.digest,
        command: `/golden-approve sha256:${inputs.digest}`,
    };
    const {data: file} = await github.rest.repos.getContent({
        owner,
        repo,
        path: '.github/CODEOWNERS',
        ref: request.base,
    });
    if (file.type !== 'file' || file.encoding !== 'base64' || file.size > 65536) {
        throw new Error('Invalid trusted CODEOWNERS file');
    }
    const owners = globalCodeowners(Buffer.from(file.content, 'base64').toString('utf8'));
    const reviews = await currentReviews(github, request);
    for (const review of exactHumanReviews(reviews, request)) {
        if (!(await isCodeowner(github, review, owners, owner))) continue;

        // Re-read immediately before publishing to reject edits/dismissals and
        // a moved head/base while team membership was being resolved.
        const fresh = exactHumanReviews(await currentReviews(github, request), request);
        if (
            !fresh.some((value) => proofIdentity(request, value) === proofIdentity(request, review))
        ) {
            throw new Error('Golden review changed during owner verification');
        }
        await github.rest.checks.create({
            owner,
            repo,
            name: APPROVAL_CHECK,
            head_sha: request.head,
            external_id: proofIdentity(request, review),
            status: 'completed',
            conclusion: 'success',
            details_url: review.url,
            output: {
                title: 'Exact golden difference approved by a human CODEOWNER',
                summary: `Review: ${review.url}\n\nDigest: ${request.digest}\n\nRe-run failed Golden File Comparison jobs. This confirmation does not bypass build or screenshot checks.`,
            },
        });
        core.notice(`Confirmed CODEOWNER ${review.author.login}; re-run failed Golden jobs`);
        return;
    }
    throw new Error('No exact-diff human approval from an active CODEOWNER');
}

module.exports = {
    APPROVAL_APP_ID,
    APPROVAL_CHECK,
    proofIdentity,
    confirmedTeamReview,
    publishGoldenApproval,
};
