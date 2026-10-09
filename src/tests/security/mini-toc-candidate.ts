import {createHash} from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {expect, test} from '@playwright/test';

/* eslint-disable @typescript-eslint/no-require-imports */
const {
    validatePins,
    findBundleProof,
    prepareCandidateBrowser,
    main,
} = require('../../../scripts/mini-toc-candidate');
const {inventoryCorpus} = require('../../../scripts/candidate-browser');
const yaml = require(
    require.resolve('js-yaml', {
        paths: [path.dirname(require.resolve('@diplodoc/infra/prettier-config'))],
    }),
);
/* eslint-enable @typescript-eslint/no-require-imports */

test.describe('Mini TOC source candidate boundaries', () => {
    test('requires full immutable revisions', () => {
        const pins = {METAPACKAGE_SHA: 'a'.repeat(40), COMPONENTS_SHA: 'b'.repeat(40)};
        expect(() => validatePins(pins)).not.toThrow();
        expect(() => main('validate', pins)).not.toThrow();
        for (const value of ['', 'master', 'a'.repeat(39), '../other'])
            expect(() => validatePins({...pins, COMPONENTS_SHA: value})).toThrow(
                'Invalid COMPONENTS_SHA',
            );
    });

    test('binds the compiled selector to a bundle referenced by the actual page', () => {
        const root = fs.realpathSync(
            fs.mkdtempSync(path.join(os.tmpdir(), 'testpack-selector-proof-')),
        );
        try {
            // Arrange a source map, compiled selector and independently served corpus.
            const client = path.join(root, 'client');
            const html = path.join(root, 'html');
            const compiled = path.join(root, 'selectIntersectingHeading.js');
            fs.mkdirSync(client);
            fs.mkdirSync(path.join(html, 'ru/syntax'), {recursive: true});
            fs.mkdirSync(path.join(html, '_bundle'));
            fs.writeFileSync(compiled, 'export function selectIntersectingHeading() {}');
            fs.writeFileSync(path.join(client, 'app.js'), 'candidate runtime');
            fs.copyFileSync(path.join(client, 'app.js'), path.join(html, '_bundle/app.js'));
            const mapPath = path.join(client, 'app.js.map');
            const sourceMap = {
                sources: [
                    'webpack:///components/build/esm/components/SubNavigation/hooks/selectIntersectingHeading.js',
                ],
                sourcesContent: [fs.readFileSync(compiled, 'utf8')],
            };
            fs.writeFileSync(mapPath, JSON.stringify(sourceMap));
            const page = path.join(html, 'ru/syntax/components.html');
            fs.writeFileSync(page, '<script src="_bundle/app.js"></script>');

            // Accept only exact bytes in a runtime referenced by this document.
            const bundles = findBundleProof(client, compiled, html);
            expect(bundles).toHaveLength(1);
            expect(bundles[0].path).toBe('_bundle/app.js');
            // Another runtime can contain the same selector without being
            // loaded by this page. It must not hide the valid served bundle.
            fs.writeFileSync(path.join(client, '0-async.js'), 'other runtime');
            fs.writeFileSync(path.join(client, '0-async.js.map'), JSON.stringify(sourceMap));
            expect(findBundleProof(client, compiled, html)).toEqual(bundles);

            // Reject missing references, old bytes and foreign or absent selector text.
            fs.writeFileSync(page, '<script src="_bundle/old.js"></script>');
            expect(() => findBundleProof(client, compiled, html)).toThrow('not referenced');
            fs.writeFileSync(page, '<script src="_bundle/app.js"></script>');
            fs.writeFileSync(path.join(html, '_bundle/app.js'), 'old runtime');
            expect(() => findBundleProof(client, compiled, html)).toThrow('not referenced');
            fs.copyFileSync(path.join(client, 'app.js'), path.join(html, '_bundle/app.js'));
            fs.writeFileSync(
                mapPath,
                JSON.stringify({...sourceMap, sourcesContent: ['old selector']}),
            );
            expect(() => findBundleProof(client, compiled, html)).toThrow('different selector');
            fs.writeFileSync(mapPath, JSON.stringify({sources: [], sourcesContent: []}));
            expect(() => findBundleProof(client, compiled, html)).toThrow('No candidate selector');
        } finally {
            fs.rmSync(root, {recursive: true, force: true});
        }
    });

    test('rejects tampered downloads and source identities before serving', () => {
        const root = fs.realpathSync(
            fs.mkdtempSync(path.join(os.tmpdir(), 'testpack-candidate-download-')),
        );
        try {
            // Arrange producer evidence with hidden corpus files included.
            const corpus = path.join(root, 'corpus');
            fs.mkdirSync(corpus);
            fs.mkdirSync(path.join(root, 'build/server'), {recursive: true});
            fs.writeFileSync(path.join(root, 'build/server/index.js'), '// server');
            fs.writeFileSync(path.join(corpus, 'index.html'), '<script src="app.js"></script>');
            fs.writeFileSync(path.join(corpus, 'app.js'), 'candidate');
            fs.writeFileSync(path.join(corpus, '.yfm'), 'hidden');
            const files = inventoryCorpus(corpus);
            const proof = {
                componentsSha: 'b'.repeat(40),
                metapackageSha: 'a'.repeat(40),
                htmlFiles: files,
                corpusSha256: createHash('sha256').update(JSON.stringify(files)).digest('hex'),
                bundles: [files.find((file: {path: string}) => file.path === 'app.js')],
            };
            const proofPath = path.join(root, 'proof.json');
            fs.writeFileSync(proofPath, JSON.stringify(proof));
            const env = {
                METAPACKAGE_SHA: proof.metapackageSha,
                COMPONENTS_SHA: proof.componentsSha,
                CANDIDATE_PROOF: proofPath,
                TESTPACK_ROOT: root,
                CANDIDATE_CORPUS: corpus,
                BROWSER_ARTIFACTS: path.join(root, 'evidence'),
            };

            // Separate suite outputs from identity proof; serve only the frozen corpus.
            expect(prepareCandidateBrowser(env).prepared.config.webServer.reuseExistingServer).toBe(
                false,
            );
            main('browser', env);
            const navigationConfig = fs.readFileSync(
                path.join(env.BROWSER_ARTIFACTS, 'candidate-playwright.config.ts'),
                'utf8',
            );
            const identityConfig = fs.readFileSync(
                path.join(env.BROWSER_ARTIFACTS, 'candidate-identity.config.ts'),
                'utf8',
            );
            expect(navigationConfig).toContain(JSON.stringify(path.join(root, 'tests')));
            expect(navigationConfig).toContain(
                JSON.stringify(path.join(env.BROWSER_ARTIFACTS, 'results')),
            );
            expect(identityConfig).toContain(
                JSON.stringify(path.join(env.BROWSER_ARTIFACTS, 'identity-results')),
            );

            // Reject altered source revisions and an incomplete artifact download.
            expect(identityConfig).toContain(
                JSON.stringify(path.join(env.BROWSER_ARTIFACTS, 'identity-results.json')),
            );
            expect(() =>
                prepareCandidateBrowser({...env, COMPONENTS_SHA: 'c'.repeat(40)}),
            ).toThrow();
            fs.unlinkSync(path.join(corpus, '.yfm'));
            expect(() => prepareCandidateBrowser(env)).toThrow('Downloaded corpus differs');
        } finally {
            fs.rmSync(root, {recursive: true, force: true});
        }
    });

    test('keeps source probes manual-only and binds the isolated artifact producer', () => {
        const workflow = yaml.load(
            fs.readFileSync(
                path.join(__dirname, '../../../.github/workflows/mini-toc-candidate.yml'),
                'utf8',
            ),
        );
        // Manual inputs replace historical YAML pins without permitting moving refs.
        expect(workflow.on).toEqual({
            workflow_dispatch: {
                inputs: {
                    'metapackage-sha': {
                        description: expect.any(String),
                        required: true,
                        type: 'string',
                    },
                    'components-sha': {
                        description: expect.any(String),
                        required: true,
                        type: 'string',
                    },
                },
            },
        });
        expect(workflow.permissions).toEqual({contents: 'read'});
        expect(workflow.env).toEqual({
            METAPACKAGE_SHA: '${{ inputs.metapackage-sha }}',
            COMPONENTS_SHA: '${{ inputs.components-sha }}',
        });
        expect(workflow.jobs.build['runs-on']).toBe('ubuntu-24.04');
        const buildSteps = workflow.jobs.build.steps;
        const setupIndex = buildSteps.findIndex(
            (step: {uses?: string}) => step.uses === 'diplodoc-platform/setup-node-action@v1',
        );
        const validationIndex = buildSteps.findIndex(
            (step: {run?: string}) =>
                step.run === 'node tools/testpack/scripts/mini-toc-candidate.js validate',
        );
        const sourceIndex = buildSteps.findIndex(
            (step: {with?: {repository?: string}}) =>
                step.with?.repository === 'diplodoc-platform/diplodoc',
        );
        expect(buildSteps[setupIndex].with).toEqual({
            'node-version': "${{ vars.NODE_VERSION || '24' }}",
            'run-install': 'false',
            cache: '',
        });
        expect(setupIndex).toBeGreaterThan(0);
        expect(validationIndex).toBeGreaterThan(setupIndex);
        expect(sourceIndex).toBeGreaterThan(validationIndex);

        // Download only the artifact produced by this isolated source-build job.
        const windows = workflow.jobs.windows;
        expect(windows.needs).toBe('build');
        expect(windows['runs-on']).toBe('windows-latest');
        const download = windows.steps.find(
            (step: {uses?: string}) => step.uses === 'actions/download-artifact@v4',
        );
        expect(download.with).toEqual({
            'artifact-ids': '${{ needs.build.outputs.artifact-id }}',
            'merge-multiple': true,
            path: 'candidate-corpus',
        });

        // Keep strict browser attempts and always-upload evidence without publication.
        const commands = windows.steps.map((step: {run?: string}) => step.run || '').join('\n');
        expect(commands).not.toMatch(/npm run docs|npm publish|update-snapshots/);
        expect(commands).toContain('--repeat-each 50 --workers 1 --retries 0');
        expect(
            windows.steps.find(
                (step: {name: string}) =>
                    step.name === 'Preserve corpus identity and every attempt',
            ).if,
        ).toBe('always()');
        for (const job of Object.values(workflow.jobs) as {
            steps: {uses?: string; with?: Record<string, unknown>}[];
        }[])
            for (const step of job.steps)
                if (step.uses === 'actions/checkout@v5')
                    expect(step.with?.['persist-credentials']).toBe(false);
    });
});
