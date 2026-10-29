import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {expect, test} from '@playwright/test';

/* eslint-disable @typescript-eslint/no-require-imports */
const yaml = require(
    require.resolve('js-yaml', {
        paths: [path.dirname(require.resolve('@diplodoc/infra/prettier-config'))],
    }),
);

const {
    reviewRequest,
    globalCodeowners,
    approvedReview,
    currentReviews,
    runGoldenReview,
} = require('../../../scripts/golden-review');
const {compareCorpus} = require('../../../scripts/compare-corpus');
/* eslint-enable @typescript-eslint/no-require-imports */

const binding = {
    repository: 'diplodoc-platform/testpack',
    pr: 49,
    base: 'a'.repeat(40),
    head: 'b'.repeat(40),
};
const request = reviewRequest({passed: false, change: 'original'}, binding);
const owners = ['@diplodoc-platform/team', '@diplodoc-bot'];
const review = () => ({
    databaseId: 10,
    state: 'APPROVED',
    body: request.command,
    commit: {oid: binding.head},
    author: {login: 'maintainer', __typename: 'User'},
    url: 'https://github.com/diplodoc-platform/testpack/pull/49#pullrequestreview-10',
    onBehalfOf: {
        nodes: [{slug: 'team', organization: {login: 'diplodoc-platform'}}],
        pageInfo: {hasNextPage: false},
    },
});
const snapshot = (nodes = [review()]) => ({
    repository: {
        pullRequest: {
            state: 'OPEN',
            headRefOid: binding.head,
            baseRefOid: binding.base,
            reviewDecision: 'APPROVED',
            reviews: {nodes, pageInfo: {hasNextPage: false, endCursor: null as string | null}},
        },
    },
});

function corpus(root: string, side: string) {
    const directory = path.join(root, side);
    for (const format of ['html', 'md'])
        fs.mkdirSync(path.join(directory, format, 'output'), {recursive: true});
    fs.writeFileSync(path.join(directory, 'html/output/index.html'), '<p>document</p>');
    fs.writeFileSync(path.join(directory, 'md/output/index.md'), '# Document');
    return directory;
}

test.describe('Golden review', () => {
    test('binds approval to repository, PR, base, head and complete diff while ignoring JSON key order', () => {
        const before = reviewRequest({passed: false, change: 'original'}, binding);
        expect(reviewRequest({change: 'original', passed: false}, binding).digest).toBe(
            before.digest,
        );
        for (const next of [
            {...binding, head: 'c'.repeat(40)},
            {...binding, base: 'c'.repeat(40)},
            {...binding, pr: 50},
            {...binding, repository: 'other/testpack'},
        ])
            expect(reviewRequest({passed: false, change: 'original'}, next).digest).not.toBe(
                before.digest,
            );
        expect(reviewRequest({passed: false, change: 'new'}, binding).digest).not.toBe(
            before.digest,
        );
        expect(() => reviewRequest({}, {...binding, head: 'invalid'})).toThrow();
    });

    test('requires a human owner approval for the exact commit and digest', () => {
        expect(approvedReview([review()], request, owners)?.databaseId).toBe(10);
        expect(
            approvedReview(
                [{...review(), onBehalfOf: {nodes: [], pageInfo: {hasNextPage: false}}}],
                request,
                ['@maintainer'],
            )?.databaseId,
        ).toBe(10);
        const bad = [
            {...review(), author: {login: 'dependabot', __typename: 'Bot'}},
            {...review(), author: {login: 'diplodoc-bot', __typename: 'User'}},
            {...review(), author: {login: 'yc-ui-bot', __typename: 'User'}},
            {...review(), state: 'COMMENTED'},
            {...review(), state: 'CHANGES_REQUESTED'},
            {...review(), state: 'DISMISSED'},
            {...review(), commit: {oid: 'c'.repeat(40)}},
            {...review(), body: '/golden-approve sha256:' + '0'.repeat(64)},
            {...review(), onBehalfOf: {nodes: [], pageInfo: {hasNextPage: false}}},
            {...review(), onBehalfOf: {...review().onBehalfOf, pageInfo: {hasNextPage: true}}},
        ];
        for (const value of bad) expect(approvedReview([value], request, owners)).toBeUndefined();
        expect(approvedReview([review()], request, ['@other/team'])).toBeUndefined();
        expect(() => approvedReview([{...review(), databaseId: 0}], request, owners)).toThrow(
            'identity',
        );
    });

    test('a later dismissal, change request or different approval invalidates the old approval', () => {
        for (const newer of [
            {...review(), databaseId: 11, state: 'DISMISSED'},
            {...review(), databaseId: 11, state: 'CHANGES_REQUESTED'},
            {...review(), databaseId: 11, body: 'Approved without the golden command'},
        ])
            expect(approvedReview([newer, review()], request, owners)).toBeUndefined();
        expect(
            approvedReview(
                [review(), {...review(), databaseId: 11, state: 'COMMENTED'}],
                request,
                owners,
            ),
        ).toBeDefined();
    });

    test('reads global owner policy from trusted checkout and rejects unsupported rules', () => {
        expect(globalCodeowners('* @diplodoc-platform/team @diplodoc-bot\n')).toEqual(owners);
        for (const source of [
            '',
            '*\n',
            '*.js @someone',
            '* @owner\npackage.json @other',
            '* malicious',
        ]) {
            expect(() => globalCodeowners(source)).toThrow();
        }
    });

    test('fetches all review pages and fails closed on stale or incomplete API evidence', async () => {
        let calls = 0;
        const github = {
            graphql: async () => {
                const data = snapshot(calls++ ? [review()] : []);
                if (calls === 1)
                    data.repository.pullRequest.reviews.pageInfo = {
                        hasNextPage: true,
                        endCursor: 'next',
                    };
                return data;
            },
        };
        expect(await currentReviews(github, request)).toHaveLength(1);
        expect(calls).toBe(2);
        for (const field of ['headRefOid', 'baseRefOid', 'state']) {
            const data = snapshot();
            Object.assign(data.repository.pullRequest, {[field]: 'changed'});
            await expect(currentReviews({graphql: async () => data}, request)).rejects.toThrow(
                'stale',
            );
        }
        const noDecision = snapshot();
        noDecision.repository.pullRequest.reviewDecision = 'REVIEW_REQUIRED';
        expect(await currentReviews({graphql: async () => noDecision}, request)).toEqual([]);
        const truncated = snapshot();
        truncated.repository.pullRequest.reviews.pageInfo = {hasNextPage: true, endCursor: null};
        await expect(currentReviews({graphql: async () => truncated}, request)).rejects.toThrow(
            'pagination',
        );
        await expect(
            currentReviews(
                {
                    graphql: async () => {
                        throw new Error('denied');
                    },
                },
                request,
            ),
        ).rejects.toThrow('denied');
    });

    test('a genuine runtime diff remains recorded and only exact owner approval makes the gate pass', async () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'golden-review-'));
        try {
            const baseline = corpus(root, 'baseline');
            const candidate = corpus(root, 'candidate');
            fs.writeFileSync(path.join(baseline, 'html/output/runtime.js'), 'before();');
            fs.writeFileSync(path.join(candidate, 'html/output/runtime.js'), 'after();');
            const exact = reviewRequest(compareCorpus(baseline, candidate), binding);
            const output = path.join(root, 'reports');
            const env = {
                GOLDEN_BASELINE: baseline,
                GOLDEN_CANDIDATE: candidate,
                GOLDEN_REPORTS: output,
                GOLDEN_PR: '49',
                GOLDEN_BASE: binding.base,
                GOLDEN_HEAD: binding.head,
            };
            const failures: string[] = [];
            const core = {notice: () => {}, setFailed: (message: string) => failures.push(message)};
            const context = {repo: {owner: 'diplodoc-platform', repo: 'testpack'}};
            let reviews = snapshot([]);
            const github = {graphql: async () => reviews};
            await runGoldenReview({github, context, core}, env);
            expect(failures).toHaveLength(1);
            expect(fs.readFileSync(path.join(output, 'golden-review.md'), 'utf8')).toContain(
                exact.command,
            );
            failures.length = 0;
            const owner = review();
            owner.body = exact.command;
            reviews = snapshot([owner]);
            await runGoldenReview({github, context, core}, env);
            expect(failures).toEqual([]);
            expect(
                JSON.parse(fs.readFileSync(path.join(output, 'golden-review.json'), 'utf8'))
                    .accepted,
            ).toBe(true);
            expect(
                JSON.parse(fs.readFileSync(path.join(output, 'corpus-result.json'), 'utf8')).passed,
            ).toBe(false);
            fs.writeFileSync(path.join(candidate, 'html/output/runtime.js'), 'anotherChange();');
            await runGoldenReview({github, context, core}, env);
            expect(failures).toHaveLength(1);
            fs.rmSync(path.join(candidate, 'md'), {recursive: true});
            await expect(runGoldenReview({github, context, core}, env)).rejects.toThrow(
                'Incomplete corpus',
            );
        } finally {
            fs.rmSync(root, {recursive: true, force: true});
        }
    });

    test('identical complete corpus needs no approval or GitHub API call', async () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'golden-identical-'));
        try {
            const dir = corpus(root, 'corpus');
            await runGoldenReview(
                {
                    github: {
                        graphql: () => {
                            throw new Error('must not call');
                        },
                    },
                    context: {},
                    core: {
                        notice: () => {},
                        setFailed: () => {
                            throw new Error('must not fail');
                        },
                    },
                },
                {
                    GOLDEN_BASELINE: dir,
                    GOLDEN_CANDIDATE: dir,
                    GOLDEN_REPORTS: path.join(root, 'reports'),
                },
            );
        } finally {
            fs.rmSync(root, {recursive: true, force: true});
        }
    });

    test('workflow retains build and screenshot gates, read-only permissions and trusted base tooling', () => {
        const workflow = yaml.load(
            fs.readFileSync(
                path.join(__dirname, '../../../.github/workflows/golden-file-comparison.yml'),
                'utf8',
            ),
        );
        const job = workflow.jobs['golden-file-comparison'];
        expect(job.permissions).toEqual({contents: 'read', 'pull-requests': 'read'});
        expect(job.steps[0].run).toContain('$BASELINE_RESULT');
        expect(job.steps[0].run).toContain('$CANDIDATE_RESULT');
        const compare = job.steps.find((step: {name: string}) =>
            step.name.startsWith('Compare HTML'),
        );
        expect(compare.uses).toBe('actions/github-script@v7');
        expect(compare['continue-on-error']).toBeUndefined();
        expect(compare.with.script).toContain(
            "require('./tools/testpack/scripts/golden-review.js')",
        );
        expect(workflow.jobs.candidate.steps.at(-1).if).toContain('screenshots.outcome');
    });
});
