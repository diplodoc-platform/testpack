import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {expect, test} from '@playwright/test';

test('Candidate bundle identity is loaded by the real Components page', async ({
    page,
}, testInfo) => {
    test.skip(!process.env.CANDIDATE_PROOF, 'Only runs against an explicit source candidate');

    // Read the producer's immutable source and bundle identities.
    const proof = JSON.parse(readFileSync(process.env.CANDIDATE_PROOF as string, 'utf8')) as {
        componentsSha: string;
        bundles: {path: string; sha256: string}[];
    };
    // Subscribe before navigation to hash real responses rather than cached files.
    const responses = proof.bundles.map(({path, sha256}) =>
        page
            .waitForResponse((response) => new URL(response.url()).pathname === `/${path}`)
            .then(async (response) => {
                expect(response.status()).toBe(200);
                const actual = createHash('sha256')
                    .update(await response.body())
                    .digest('hex');
                expect(actual).toBe(sha256);
                return {path, sha256: actual};
            }),
    );

    // Keep normal document navigation and readiness assertions unchanged.
    await page.goto('./ru/syntax/components');
    await expect(page.locator('.dc-mini-toc__section_active')).toHaveCount(1);
    const bundles = await Promise.all(responses);

    // Preserve runtime proof independently of the navigation/full-suite reports.
    await testInfo.attach('loaded-candidate-bundles', {
        body: JSON.stringify({componentsSha: proof.componentsSha, bundles}),
        contentType: 'application/json',
    });
});
