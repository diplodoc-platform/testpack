import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {execFileSync} from 'child_process';
import {expect, test} from '@playwright/test';

import './mini-toc-diagnostics';
import './mini-toc-candidate';

/* eslint-disable @typescript-eslint/no-require-imports */
// Use the YAML parser provided by the installed infra tooling.
const yaml = require(
    require.resolve('js-yaml', {
        paths: [path.dirname(require.resolve('@diplodoc/infra/prettier-config'))],
    }),
);

const compare = require('../../../scripts/compare-artifacts');
const verification = require('../../../scripts/compare-verification');
const corpus = require('../../../scripts/build-corpus');
const {compareCorpus} = require('../../../scripts/compare-corpus');
const {validateInputs, resolveMetadata} = require('../../../scripts/verification-setup');
const {classifyScope} = require('../../../scripts/golden-scope');
const {prepareBrowser, inventoryCorpus} = require('../../../scripts/candidate-browser');
const {resolveRepositoryCorpus} = require('../../../scripts/repository-corpus');
/* eslint-enable @typescript-eslint/no-require-imports */

type ArtifactDownloadInputs = {
    'artifact-ids': string;
    path: string;
    'merge-multiple'?: boolean;
};

const writeEvidenceFixture = (dir: string, role: string, kind: string) => {
    fs.mkdirSync(path.join(dir, `${role}-downstream`), {recursive: true});
    fs.writeFileSync(
        path.join(dir, `${role}-downstream/downstream-result.json`),
        JSON.stringify({package: 'cut-extension', consumers: []}),
    );
    for (const scope of ['', 'standalone-']) {
        fs.writeFileSync(
            path.join(dir, `${role}-${scope}package-targets.json`),
            JSON.stringify({ok: true, checked: ['./index.js'], missing: []}),
        );
    }
    for (const format of ['html', 'md'])
        fs.mkdirSync(path.join(dir, kind, format, 'output'), {recursive: true});
    fs.writeFileSync(path.join(dir, kind, 'html/output/index.html'), '<p>same</p>');
    fs.writeFileSync(path.join(dir, kind, 'md/output/index.md'), 'same');
};

// download-artifact@v4 treats only a name-selected download as "single".
// ID-selected downloads get a name subdirectory unless merge-multiple is true.
// Contract: https://github.com/actions/download-artifact/blob/v4/src/download-artifact.ts#L158-L166
const unpackIdSelectedFixture = (
    source: string,
    root: string,
    artifactName: string,
    inputs: ArtifactDownloadInputs,
) => {
    const directory = path.join(root, inputs.path);
    const destination = inputs['merge-multiple'] ? directory : path.join(directory, artifactName);
    fs.cpSync(source, destination, {recursive: true});
};

test.describe('Verification security boundaries', () => {
    test('verification workflows use the shared Node version variable', () => {
        for (const name of [
            'mini-toc-candidate',
            'mini-toc-diagnostics',
            'golden-file-comparison',
            'downstream-check',
        ]) {
            const workflow = yaml.load(
                fs.readFileSync(
                    path.join(__dirname, `../../../.github/workflows/${name}.yml`),
                    'utf8',
                ),
            );
            let setupCount = 0;
            for (const job of Object.values(workflow.jobs) as {
                steps: {uses?: string; with?: Record<string, unknown>}[];
            }[])
                for (const step of job.steps) {
                    if (!step.uses?.includes('setup-node')) continue;
                    setupCount++;
                    expect(step.with?.['node-version']).toBe("${{ vars.NODE_VERSION || '24' }}");
                }
            expect(setupCount).toBeGreaterThan(0);
        }
    });

    test('Windows diagnostic workflow is manual-only and preserves every attempt', () => {
        const workflow = yaml.load(
            fs.readFileSync(
                path.join(__dirname, '../../../.github/workflows/mini-toc-diagnostics.yml'),
                'utf8',
            ),
        );
        expect(workflow.on).toEqual({workflow_dispatch: null});
        expect(workflow.permissions).toEqual({contents: 'read'});
        const job = workflow.jobs.windows;
        expect(job['runs-on']).toBe('windows-latest');
        expect(job.strategy).toEqual({
            'fail-fast': false,
            matrix: {scenario: ['navigation', 'full-suite']},
        });
        const repeated = job.steps.find(
            (step: {name: string}) => step.name === 'Repeat real navigation without retries',
        );
        expect(repeated.run).toBe(
            'npm test -- --config playwright.mini-toc.config.ts --grep "Components.*Mini TOC.*Navigation to" --repeat-each 50 --workers 1 --retries 0',
        );
        const full = job.steps.find(
            (step: {name: string}) => step.name === 'Run full suite with normal CI retries',
        );
        expect(full.run).toBe('npm test -- --config playwright.mini-toc.config.ts');
        const upload = job.steps.find(
            (step: {uses?: string}) => step.uses === 'actions/upload-artifact@v4',
        );
        expect({
            condition: upload.if,
            path: upload.with.path,
            hidden: upload.with['include-hidden-files'],
            missing: upload.with['if-no-files-found'],
        }).toEqual({
            condition: 'always()',
            path: '.playwright/mini-toc/${{ matrix.scenario }}/',
            hidden: true,
            missing: 'error',
        });
    });

    test('repository tests prefer the explicit frozen corpus and reject missing or invalid inputs', () => {
        const root = fs.realpathSync(
            fs.mkdtempSync(path.join(os.tmpdir(), 'testpack-repository-corpus-')),
        );
        try {
            const local = path.join(root, 'docs/output');
            const frozen = path.join(
                root,
                process.platform === 'win32' ? 'frozen candidate' : 'frozen "candidate"',
            );
            for (const directory of [local, frozen]) {
                fs.mkdirSync(directory, {recursive: true});
                fs.writeFileSync(path.join(directory, 'index.html'), '<p>fixture</p>');
            }
            expect(resolveRepositoryCorpus(local, {})).toBe(local);
            expect(resolveRepositoryCorpus(local, {CANDIDATE_CORPUS: frozen})).toBe(frozen);
            for (const invalid of ['', 'relative', path.join(root, 'missing')]) {
                expect(() => resolveRepositoryCorpus(local, {CANDIDATE_CORPUS: invalid})).toThrow(
                    /corpus|CANDIDATE_CORPUS/,
                );
            }
            fs.rmSync(local, {recursive: true});
            expect(resolveRepositoryCorpus(local, {CANDIDATE_CORPUS: frozen})).toBe(frozen);
            expect(() => resolveRepositoryCorpus(local, {})).toThrow('Build local docs');
            fs.unlinkSync(path.join(frozen, 'index.html'));
            expect(() => resolveRepositoryCorpus(local, {CANDIDATE_CORPUS: frozen})).toThrow(
                'contains no HTML',
            );
        } finally {
            fs.rmSync(root, {recursive: true, force: true});
        }
    });

    test('both isolated corpus producers retain hidden evidence only inside artifacts', () => {
        for (const name of ['downstream-check.yml', 'golden-file-comparison.yml']) {
            const workflow = yaml.load(
                fs.readFileSync(path.join(__dirname, '../../../.github/workflows', name), 'utf8'),
            );
            for (const job of ['baseline', 'candidate']) {
                const upload = workflow.jobs[job].steps.find(
                    (step: {id?: string}) => step.id === 'evidence',
                );
                expect(upload.uses).toBe('actions/upload-artifact@v4');
                expect(upload.with.path).toBe('artifacts/');
                expect(upload.with['include-hidden-files']).toBe(true);
                expect(upload.with['if-no-files-found']).toBe('error');
            }
        }
    });

    test('browsers serve and fingerprint the candidate corpus without rebuilding docs or updating screenshots', () => {
        const root = fs.realpathSync(
            fs.mkdtempSync(path.join(os.tmpdir(), 'testpack-browser-corpus-')),
        );
        try {
            const testpack = path.join(root, 'testpack');
            const candidate = path.join(root, 'actual/html/output');
            const unrelated = path.join(testpack, 'docs/output');
            fs.mkdirSync(path.join(testpack, 'build/server'), {recursive: true});
            fs.writeFileSync(path.join(testpack, 'build/server/index.js'), '// fixture');
            fs.mkdirSync(candidate, {recursive: true});
            fs.mkdirSync(unrelated, {recursive: true});
            fs.writeFileSync(path.join(candidate, 'index.html'), '<p>candidate</p>');
            fs.writeFileSync(path.join(candidate, '.yfm'), 'hidden corpus configuration');
            fs.writeFileSync(path.join(unrelated, 'index.html'), '<p>npm CLI</p>');
            const env = {
                TESTPACK_ROOT: testpack,
                CANDIDATE_CORPUS: candidate,
                BROWSER_ARTIFACTS: root,
                PR_SHA: 'a'.repeat(40),
            };
            const result = prepareBrowser(env);
            expect(result.config.webServer).toEqual({
                command: `node ${JSON.stringify(path.join(testpack, 'build/server/index.js'))}`,
                cwd: testpack,
                url: 'http://localhost:3000',
                env: {PROJECT: candidate, PORT: '3000'},
                reuseExistingServer: false,
            });
            expect(result.config.updateSnapshots).toBe('none');
            expect(result.evidence.candidateSha).toBe(env.PR_SHA);
            expect(result.evidence.files).toHaveLength(2);
            expect(result.evidence.files.map((file: {path: string}) => file.path)).toEqual([
                '.yfm',
                'index.html',
            ]);
            const digest = result.evidence.corpusSha256;
            const downloaded = path.join(root, 'downloaded');
            fs.cpSync(candidate, downloaded, {recursive: true});
            expect(inventoryCorpus(downloaded)).toEqual(result.evidence.files);
            fs.unlinkSync(path.join(downloaded, '.yfm'));
            expect(inventoryCorpus(downloaded)).not.toEqual(result.evidence.files);
            fs.writeFileSync(path.join(candidate, '.yfm'), 'changed hidden configuration');
            expect(prepareBrowser(env).evidence.corpusSha256).not.toBe(digest);
            fs.writeFileSync(path.join(candidate, '.yfm'), 'hidden corpus configuration');
            fs.writeFileSync(path.join(candidate, 'index.html'), '<p>regression</p>');
            expect(prepareBrowser(env).evidence.corpusSha256).not.toBe(digest);
            expect(() => prepareBrowser({...env, PR_SHA: 'wrong'})).toThrow(
                'Invalid candidate SHA',
            );
            expect(() => prepareBrowser({...env, CANDIDATE_CORPUS: 'docs/output'})).toThrow(
                'Missing absolute',
            );
            expect(() =>
                prepareBrowser({...env, CANDIDATE_CORPUS: path.join(root, 'missing')}),
            ).toThrow();
            fs.unlinkSync(path.join(candidate, 'index.html'));
            expect(() => inventoryCorpus(candidate)).toThrow('contains no HTML');
            if (process.platform !== 'win32') {
                fs.symlinkSync(
                    path.join(unrelated, 'index.html'),
                    path.join(candidate, 'index.html'),
                );
                expect(() => inventoryCorpus(candidate)).toThrow('symlinks');
            }
        } finally {
            fs.rmSync(root, {recursive: true, force: true});
        }
    });

    test('rendering workflow uses immutable browser tooling and the compared candidate HTML', () => {
        const workflow = yaml.load(
            fs.readFileSync(
                path.join(__dirname, '../../../.github/workflows/downstream-check.yml'),
                'utf8',
            ),
        );
        const browser = workflow.jobs.candidate.steps.find(
            (step: {id?: string}) => step.id === 'browser',
        );
        expect(browser.env.CANDIDATE_CORPUS).toBe(
            '${{ github.workspace }}/artifacts/actual/html/output',
        );
        expect(browser.run).toContain('tools/testpack/scripts/candidate-browser.js');
        expect(browser.run).toContain(
            '--config "$GITHUB_WORKSPACE/artifacts/candidate-playwright.config.ts"',
        );
        expect(browser.run).toContain('--update-snapshots=none');
    });
    test('workflow input helper rejects invalid data before candidate checkout', () => {
        const valid = {
            REPOSITORY_NAME: 'tabs-extension',
            EXPECTED_SHA: 'a'.repeat(40),
            PROFILE: 'document-transform',
            PR_NUMBER: '29',
        };
        expect(() => validateInputs(valid)).not.toThrow();
        for (const invalid of [
            {EXPECTED_SHA: '$(unreviewed)'},
            {REPOSITORY_NAME: '../cli'},
            {REPOSITORY_NAME: 'unsupported'},
            {PROFILE: 'standard-ci'},
            {PR_NUMBER: '0'},
        ])
            expect(() => validateInputs({...valid, ...invalid})).toThrow();
    });

    test('scope helper distinguishes dependency-only changes, feature PRs and Git errors', () => {
        const base = 'a'.repeat(40);
        const head = 'b'.repeat(40);
        const git = (_command: string, args: string[]) => {
            if (args[0] === 'show')
                return JSON.stringify({
                    dependencies: {fixture: args[1].startsWith(base) ? '1' : '2'},
                });
            return '';
        };
        expect(classifyScope(base, head, git)).toEqual({
            dependencyOnly: true,
            hasDependencyChanges: true,
            runComparison: true,
        });
        expect(
            classifyScope(base, head, (command: string, args: string[]) =>
                args[1] === '--name-only' ? 'src/index.ts\n' : git(command, args),
            ),
        ).toEqual({dependencyOnly: false, hasDependencyChanges: true, runComparison: false});
        expect(() =>
            classifyScope(base, head, (command: string, args: string[]) => {
                if (args[1] === '--quiet')
                    throw Object.assign(new Error('Git failed'), {status: 128});
                return git(command, args);
            }),
        ).toThrow('Git failed');
        expect(() => classifyScope('invalid', head, git)).toThrow('Invalid comparison SHA');
    });

    test('metadata helper resolves exact revisions and rejects wrong candidate identity', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'testpack-metadata-'));
        try {
            const initialize = (dir: string) => {
                fs.mkdirSync(dir, {recursive: true});
                const git = (args: string[]) =>
                    execFileSync('git', ['-C', dir, ...args], {encoding: 'utf8'}).trim();
                git(['init', '-q']);
                git(['config', 'user.name', 'Fixture']);
                git(['config', 'user.email', 'fixture@example.invalid']);
                git(['commit', '-q', '--allow-empty', '-m', 'fixture']);
                return git(['rev-parse', 'HEAD']);
            };
            const candidate = path.join(root, 'candidate');
            const metapackage = path.join(root, 'metapackage');
            const sha = initialize(candidate);
            const metapackageSha = initialize(metapackage);
            const baseSha = initialize(path.join(metapackage, 'extensions/tabs'));
            const manifest = path.join(candidate, 'package.json');
            fs.writeFileSync(manifest, JSON.stringify({name: '@diplodoc/tabs-extension'}));
            const env = {
                REPOSITORY_NAME: 'tabs-extension',
                EXPECTED_SHA: sha,
                PROFILE: 'document-transform',
            };
            expect(resolveMetadata(env, candidate, metapackage)).toEqual({
                path: 'extensions/tabs',
                name: '@diplodoc/tabs-extension',
                baseSha,
                metapackageSha,
            });
            expect(() =>
                resolveMetadata({...env, EXPECTED_SHA: 'a'.repeat(40)}, candidate, metapackage),
            ).toThrow('Candidate checkout does not match expected SHA');
            fs.writeFileSync(manifest, JSON.stringify({name: '@diplodoc/cli'}));
            expect(() => resolveMetadata(env, candidate, metapackage)).toThrow(
                'Unexpected package name',
            );
        } finally {
            fs.rmSync(root, {recursive: true, force: true});
        }
    });

    test('workflow JavaScript stays in trusted helper files, not YAML heredocs', () => {
        const downstream = fs.readFileSync(
            path.join(__dirname, '../../../.github/workflows/downstream-check.yml'),
            'utf8',
        );
        const golden = fs.readFileSync(
            path.join(__dirname, '../../../.github/workflows/golden-file-comparison.yml'),
            'utf8',
        );
        expect(downstream).toContain('node tools/testpack/scripts/verification-setup.js metadata');
        expect(golden).toContain('node ../tools/testpack/scripts/golden-scope.js');
        expect(downstream + golden).not.toMatch(/node\s+(?:<<|-e)/);
    });
    test('complete isolated evidence passes while a new Markdown failure or missing report blocks', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'testpack-comparison-evidence-'));
        const baseline = path.join(root, 'baseline');
        const candidate = path.join(root, 'candidate');
        try {
            for (const [dir, role, kind] of [
                [baseline, 'base', 'expected'],
                [candidate, 'candidate', 'actual'],
            ]) {
                writeEvidenceFixture(dir, role, kind);
            }
            expect(
                verification.compareVerification('cut-extension', baseline, candidate).passed,
            ).toBe(true);
            fs.writeFileSync(path.join(candidate, 'actual/md/output/index.md'), 'changed');
            expect(
                verification.compareVerification('cut-extension', baseline, candidate).passed,
            ).toBe(false);
            fs.unlinkSync(path.join(candidate, 'candidate-standalone-package-targets.json'));
            expect(() =>
                verification.compareVerification('cut-extension', baseline, candidate),
            ).toThrow();
        } finally {
            fs.rmSync(root, {recursive: true, force: true});
        }
    });

    for (const [workflowName, comparisonJob, golden] of [
        ['downstream-check.yml', 'comparison', false],
        ['golden-file-comparison.yml', 'golden-file-comparison', true],
    ] as const) {
        test(`${workflowName} unpacks producer ID artifacts at the comparator roots`, () => {
            const workflow = yaml.load(
                fs.readFileSync(
                    path.join(__dirname, '../../../.github/workflows', workflowName),
                    'utf8',
                ),
            );
            const downloads = (
                workflow.jobs[comparisonJob].steps as {
                    uses?: string;
                    with?: ArtifactDownloadInputs;
                }[]
            ).filter((step) => step.uses?.startsWith('actions/download-artifact@'));
            const root = fs.mkdtempSync(path.join(os.tmpdir(), 'testpack-artifact-layout-'));
            const flat = path.join(root, 'downloaded');
            const nested = path.join(root, 'without-merge');
            const compareDownloaded = (dir: string) =>
                golden
                    ? compareCorpus(
                          path.join(dir, 'baseline/expected'),
                          path.join(dir, 'candidate/actual'),
                      )
                    : verification.compareVerification(
                          'cut-extension',
                          path.join(dir, 'baseline'),
                          path.join(dir, 'candidate'),
                      );
            try {
                expect(downloads).toHaveLength(2);
                for (const [producer, role, kind] of [
                    ['baseline', 'base', 'expected'],
                    ['candidate', 'candidate', 'actual'],
                ]) {
                    const id = '${{ needs.' + producer + '.outputs.artifact-id }}';
                    const inputs = downloads.find(
                        (step) => step.with?.['artifact-ids'] === id,
                    )?.with;
                    if (!inputs) throw new Error(`Missing producer-bound download: ${producer}`);
                    const payload = path.join(root, 'uploaded', producer);
                    const artifactName = `unrelated-to-path-${producer}-123456`;
                    writeEvidenceFixture(payload, role, kind);
                    unpackIdSelectedFixture(payload, flat, artifactName, inputs);
                    unpackIdSelectedFixture(payload, nested, artifactName, {
                        ...inputs,
                        'merge-multiple': false,
                    });
                }

                expect(compareDownloaded(flat).passed).toBe(true);
                expect(() => compareDownloaded(nested)).toThrow(
                    golden ? 'Incomplete corpus evidence' : /ENOENT/,
                );
                for (const producer of ['baseline', 'candidate']) {
                    expect(downloads.find((step) => step.with?.path === producer)?.with).toEqual({
                        'artifact-ids': '${{ needs.' + producer + '.outputs.artifact-id }}',
                        path: producer,
                        'merge-multiple': true,
                    });
                }
                fs.writeFileSync(
                    path.join(flat, 'candidate/actual/md/output/index.md'),
                    'regression',
                );
                expect(compareDownloaded(flat).passed).toBe(false);
            } finally {
                fs.rmSync(root, {recursive: true, force: true});
            }
        });
    }

    test('golden comparison reads only base tooling and immutable artifacts on its own runner', () => {
        const workflow = yaml.load(
            fs.readFileSync(
                path.join(__dirname, '../../../.github/workflows/golden-file-comparison.yml'),
                'utf8',
            ),
        );
        expect(workflow.jobs.baseline.needs).toBe('scope');
        expect(workflow.jobs.candidate.needs).toBe('scope');
        const steps = workflow.jobs['golden-file-comparison'].steps;
        const checkouts = steps.filter((step: {uses?: string}) =>
            step.uses?.startsWith('actions/checkout@'),
        );
        expect(checkouts).toHaveLength(1);
        expect(checkouts[0].with.ref).toBe('${{ github.event.pull_request.base.sha }}');
        expect(
            steps.find(
                (step: {name: string}) => step.name === 'Download immutable baseline evidence',
            ).with['artifact-ids'],
        ).toBe('${{ needs.baseline.outputs.artifact-id }}');
        expect(steps.map((step: {run?: string}) => step.run || '').join('\n')).not.toMatch(
            /npm (?:ci|test|run)/,
        );
    });

    test('normalizes search insertion order but preserves content, weights and executable tails', () => {
        const file = '_search/ru/hash-index.js';
        const before =
            'self.index={"version":"2.3.9","invertedIndex":[["b",{"_index":0}],["a",{"_index":1}]],"fieldVectors":[["doc",[0,1,1,2]]]};';
        const after =
            'self.index={"version":"2.3.9","invertedIndex":[["a",{"_index":0}],["b",{"_index":1}]],"fieldVectors":[["doc",[0,2,1,1]]]};';
        expect(compare.normalizeSearchArtifact(before, file)).toBe(
            compare.normalizeSearchArtifact(after, file),
        );
        expect(compare.normalizeSearchArtifact(before, file)).not.toBe(
            compare.normalizeSearchArtifact(after.replace('[0,2,1,1]', '[0,3,1,1]'), file),
        );
        const extraCode = after + 'self.unreviewed = true;';
        expect(compare.normalizeSearchArtifact(extraCode, file)).toBe(extraCode);
        const registry = 'self.registry={"b":"B","a":"A"};';
        expect(compare.normalizeSearchArtifact(registry, '_search/ru/hash-registry.js')).toBe(
            'self.registry={"a":"A","b":"B"};',
        );
        expect(compare.normalizeSearchArtifact(registry, '_search/ru/hash-registry.js')).not.toBe(
            compare.normalizeSearchArtifact(
                registry.replace('"B"', '"changed"'),
                '_search/ru/hash-registry.js',
            ),
        );
    });

    test('empty HTML and Markdown directories are not valid corpus evidence', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'testpack-empty-corpus-'));
        try {
            fs.mkdirSync(path.join(root, 'html/output'), {recursive: true});
            fs.mkdirSync(path.join(root, 'md/output'), {recursive: true});
            expect(() => compareCorpus(root, root)).toThrow(/Incomplete corpus evidence/);
        } finally {
            fs.rmSync(root, {recursive: true, force: true});
        }
    });

    test('builds baseline and candidate separately and compares immutable artifacts without package execution', () => {
        const workflow = yaml.load(
            fs.readFileSync(
                path.join(__dirname, '../../../.github/workflows/downstream-check.yml'),
                'utf8',
            ),
        );
        expect(Object.keys(workflow.jobs)).toEqual([
            'prepare',
            'baseline',
            'candidate',
            'comparison',
        ]);
        expect(workflow.jobs.baseline.needs).toBe('prepare');
        expect(workflow.jobs.candidate.needs).toBe('prepare');
        expect(workflow.jobs.comparison.needs).toEqual(['prepare', 'baseline', 'candidate']);
        const comparisonSteps = workflow.jobs.comparison.steps;
        expect(
            comparisonSteps.filter((step: {uses?: string}) =>
                step.uses?.startsWith('actions/checkout@'),
            ),
        ).toHaveLength(1);
        expect(
            comparisonSteps.find(
                (step: {name: string}) => step.name === 'Download immutable baseline artifact',
            ).with['artifact-ids'],
        ).toBe('${{ needs.baseline.outputs.artifact-id }}');
        for (const job of Object.values(workflow.jobs) as {
            steps: {run?: string; uses?: string; with?: {cache?: string}}[];
        }[]) {
            for (const step of job.steps) {
                expect(step.run || '').not.toMatch(/\$\{\{\s*inputs\./);
                expect(step.with?.cache).toBeUndefined();
                if (step.uses) expect(step.uses).toMatch(/@v\d+(?:\.\d+)*$/);
            }
        }
    });

    test('does not turn missing, malformed or skipped evidence into a pass', () => {
        expect(() => verification.validateExports({ok: true})).toThrow();
        expect(() =>
            verification.validateExports({
                ok: true,
                checked: ['./index.js'],
                missing: ['./index.js'],
            }),
        ).toThrow();
        expect(() =>
            verification.validateConsumers({package: 'components', consumers: []}, 'components'),
        ).toThrow();
        expect(() =>
            verification.validateConsumers(
                {package: 'cut-extension', error: 'build failed', consumers: []},
                'cut-extension',
            ),
        ).toThrow();
        expect(
            verification.compareExports(
                {ok: false, checked: ['old'], missing: ['old']},
                {ok: false, checked: ['old', 'new'], missing: ['old', 'new']},
            ),
        ).toEqual({newMissing: ['new']});
    });

    test('preserves script attributes and dynamic chunk identity', () => {
        const original = '<script defer src="_bundle/572-aaaaaaaaaaaaaaaa.js"></script>';
        expect(compare.normalizeBuildSpecificValues(original)).toContain('defer');
        expect(compare.normalizeBuildSpecificValues(original)).not.toBe(
            compare.normalizeBuildSpecificValues(original.replace(' defer', '')),
        );
        expect(compare.normalizeBuildSpecificValues(original)).not.toBe(
            compare.normalizeBuildSpecificValues(original.replace('572-', '573-')),
        );
    });

    for (const asset of [
        'app-aaaaaaaaaaaaaaaa.js',
        '572-aaaaaaaaaaaaaaaa.js',
        '572-aaaaaaaaaaaaaaaa.css',
    ]) {
        test(`detects runtime content changes and removal in ${asset}`, () => {
            const root = fs.mkdtempSync(path.join(os.tmpdir(), 'testpack-runtime-'));
            const baseline = path.join(root, 'base');
            const candidate = path.join(root, 'candidate');
            try {
                for (const dir of [baseline, candidate]) {
                    fs.mkdirSync(path.join(dir, '_bundle'), {recursive: true});
                    fs.writeFileSync(path.join(dir, '_bundle', asset), 'original runtime');
                }
                expect(compare.compareArtifacts(baseline, candidate).hasDifferences).toBe(false);
                fs.writeFileSync(path.join(candidate, '_bundle', asset), 'changed runtime');
                const changed = compare.compareArtifacts(baseline, candidate);
                expect(changed.hasDifferences).toBe(true);
                expect(changed.contentDiffs[0].diff.length).toBeGreaterThan(0);
                fs.unlinkSync(path.join(candidate, '_bundle', asset));
                expect(
                    compare.compareArtifacts(baseline, candidate).fileTreeDiff.removed,
                ).toHaveLength(1);
            } finally {
                fs.rmSync(root, {recursive: true, force: true});
            }
        });
    }

    test('refuses existing corpus output before running git or npm and preserves contents', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'testpack-safe-output-'));
        try {
            fs.writeFileSync(path.join(root, 'user-data'), 'keep');
            expect(() => corpus.buildCorpus('not-a-git-ref', root)).toThrow(/fresh directory/);
            expect(() => corpus.validateOutputDirectory(path.parse(root).root)).toThrow();
            expect(fs.readFileSync(path.join(root, 'user-data'), 'utf8')).toBe('keep');
        } finally {
            fs.rmSync(root, {recursive: true, force: true});
        }
    });
});
