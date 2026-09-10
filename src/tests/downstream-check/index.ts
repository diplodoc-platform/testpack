import * as fs from 'fs';
import * as path from 'path';
import {expect, test} from '@playwright/test';

/* eslint-disable @typescript-eslint/no-require-imports */
const downstreamCheck = require('../../../scripts/downstream-check.js');
/* eslint-enable @typescript-eslint/no-require-imports */

const METAPACKAGE_ROOT = path.join(__dirname, '..', '..', '..', '..', '..');

test.describe('Downstream Check', () => {
    test.describe('CORE_PACKAGES', () => {
        test('should define exactly 3 core packages', () => {
            expect(downstreamCheck.CORE_PACKAGES).toHaveLength(3);
        });

        test('should include transform, components, cli', () => {
            expect(downstreamCheck.CORE_PACKAGES).toContain('transform');
            expect(downstreamCheck.CORE_PACKAGES).toContain('components');
            expect(downstreamCheck.CORE_PACKAGES).toContain('cli');
        });
    });

    test.describe('CORE_PACKAGE_PATHS', () => {
        test('should map transform to packages/transform', () => {
            expect(downstreamCheck.CORE_PACKAGE_PATHS.transform).toBe('packages/transform');
        });

        test('should map components to packages/components', () => {
            expect(downstreamCheck.CORE_PACKAGE_PATHS.components).toBe('packages/components');
        });

        test('should map cli to packages/cli', () => {
            expect(downstreamCheck.CORE_PACKAGE_PATHS.cli).toBe('packages/cli');
        });

        test('should have a path for every core package', () => {
            for (const pkg of downstreamCheck.CORE_PACKAGES) {
                expect(downstreamCheck.CORE_PACKAGE_PATHS[pkg]).toBeDefined();
                expect(downstreamCheck.CORE_PACKAGE_PATHS[pkg].length).toBeGreaterThan(0);
            }
        });
    });

    test.describe('DOWNSTREAM_CONSUMERS', () => {
        test('should have a consumer list for each core package', () => {
            for (const pkg of downstreamCheck.CORE_PACKAGES) {
                expect(downstreamCheck.DOWNSTREAM_CONSUMERS[pkg]).toBeDefined();
                expect(Array.isArray(downstreamCheck.DOWNSTREAM_CONSUMERS[pkg])).toBe(true);
            }
        });

        test('transform should have at least 8 downstream consumers', () => {
            expect(downstreamCheck.DOWNSTREAM_CONSUMERS.transform.length).toBeGreaterThanOrEqual(8);
        });

        test('transform should include cli as a consumer', () => {
            expect(downstreamCheck.DOWNSTREAM_CONSUMERS.transform).toContain('packages/cli');
        });

        test('transform should include components as a consumer', () => {
            expect(downstreamCheck.DOWNSTREAM_CONSUMERS.transform).toContain('packages/components');
        });

        test('transform should include translation as a consumer', () => {
            expect(downstreamCheck.DOWNSTREAM_CONSUMERS.transform).toContain(
                'packages/translation',
            );
        });

        test('transform should include html extension as a consumer', () => {
            expect(downstreamCheck.DOWNSTREAM_CONSUMERS.transform).toContain('extensions/html');
        });

        test('transform should include page-constructor extension as a consumer', () => {
            expect(downstreamCheck.DOWNSTREAM_CONSUMERS.transform).toContain(
                'extensions/page-constructor',
            );
        });

        test('components should have at least 2 downstream consumers', () => {
            expect(downstreamCheck.DOWNSTREAM_CONSUMERS.components.length).toBeGreaterThanOrEqual(
                2,
            );
        });

        test('components should include client as a consumer', () => {
            expect(downstreamCheck.DOWNSTREAM_CONSUMERS.components).toContain('packages/client');
        });

        test('components should include search extension as a consumer', () => {
            expect(downstreamCheck.DOWNSTREAM_CONSUMERS.components).toContain('extensions/search');
        });

        test('cli should have at least 4 downstream consumers', () => {
            expect(downstreamCheck.DOWNSTREAM_CONSUMERS.cli.length).toBeGreaterThanOrEqual(4);
        });

        test('cli should include testpack as a consumer', () => {
            expect(downstreamCheck.DOWNSTREAM_CONSUMERS.cli).toContain('devops/testpack');
        });

        test('cli should include algolia extension as a consumer', () => {
            expect(downstreamCheck.DOWNSTREAM_CONSUMERS.cli).toContain('extensions/algolia');
        });

        test('cli should include search extension as a consumer', () => {
            expect(downstreamCheck.DOWNSTREAM_CONSUMERS.cli).toContain('extensions/search');
        });

        test('all consumer paths should be valid submodule directories', () => {
            for (const pkg of downstreamCheck.CORE_PACKAGES) {
                for (const consumer of downstreamCheck.DOWNSTREAM_CONSUMERS[pkg]) {
                    expect(consumer).toMatch(/^(packages|extensions|devops)\//);
                }
            }
        });

        test('no core package should be listed as its own consumer', () => {
            for (const pkg of downstreamCheck.CORE_PACKAGES) {
                const selfPath = downstreamCheck.CORE_PACKAGE_PATHS[pkg];
                expect(downstreamCheck.DOWNSTREAM_CONSUMERS[pkg]).not.toContain(selfPath);
            }
        });
    });

    test.describe('isCorePackage', () => {
        test('should return true for transform', () => {
            expect(downstreamCheck.isCorePackage('transform')).toBe(true);
        });

        test('should return true for components', () => {
            expect(downstreamCheck.isCorePackage('components')).toBe(true);
        });

        test('should return true for cli', () => {
            expect(downstreamCheck.isCorePackage('cli')).toBe(true);
        });

        test('should return false for non-core packages', () => {
            expect(downstreamCheck.isCorePackage('ajv')).toBe(false);
            expect(downstreamCheck.isCorePackage('utils')).toBe(false);
            expect(downstreamCheck.isCorePackage('')).toBe(false);
        });

        test('should return false for undefined/null', () => {
            expect(downstreamCheck.isCorePackage(undefined)).toBe(false);
            expect(downstreamCheck.isCorePackage(null)).toBe(false);
        });
    });

    test.describe('resolveDownstreamConsumers', () => {
        test('should return consumers for transform', () => {
            const consumers = downstreamCheck.resolveDownstreamConsumers('transform');
            expect(consumers.length).toBeGreaterThan(0);
            expect(consumers).toContain('packages/cli');
        });

        test('should return consumers for components', () => {
            const consumers = downstreamCheck.resolveDownstreamConsumers('components');
            expect(consumers.length).toBeGreaterThan(0);
            expect(consumers).toContain('packages/client');
        });

        test('should return consumers for cli', () => {
            const consumers = downstreamCheck.resolveDownstreamConsumers('cli');
            expect(consumers.length).toBeGreaterThan(0);
            expect(consumers).toContain('devops/testpack');
        });

        test('should return empty array for unknown package', () => {
            expect(downstreamCheck.resolveDownstreamConsumers('unknown')).toEqual([]);
        });
    });

    test.describe('resolveMetapackageRoot', () => {
        test('should resolve metapackage root from testpack directory', () => {
            const root = downstreamCheck.resolveMetapackageRoot(__dirname);
            if (root) {
                expect(fs.existsSync(path.join(root, 'packages'))).toBe(true);
                expect(fs.existsSync(path.join(root, 'extensions'))).toBe(true);
                expect(fs.existsSync(path.join(root, 'devops'))).toBe(true);
            }
        });

        test('should return null for a non-metapackage directory', () => {
            const tmpDir = path.join(require('os').tmpdir(), '.tmp-downstream-test-' + Date.now());
            try {
                fs.mkdirSync(tmpDir, {recursive: true});
                const root = downstreamCheck.resolveMetapackageRoot(tmpDir);
                expect(root).toBeNull();
            } finally {
                fs.rmSync(tmpDir, {recursive: true, force: true});
            }
        });
    });

    test.describe('resolvePackageDir', () => {
        test('should resolve transform package directory', () => {
            const root = downstreamCheck.resolveMetapackageRoot(__dirname);
            if (!root) {
                test.skip(true, 'metapackage root not found');
                return;
            }
            const dir = downstreamCheck.resolvePackageDir('transform', root);
            expect(dir).toBe(path.join(root, 'packages', 'transform'));
        });

        test('should throw for unknown package', () => {
            expect(() => downstreamCheck.resolvePackageDir('unknown', '/tmp')).toThrow(
                /Unknown core package/,
            );
        });
    });

    test.describe('buildConsumerResult', () => {
        test('should build a passing result', () => {
            const result = downstreamCheck.buildConsumerResult(
                'packages/cli',
                {success: true, error: null},
                {success: true, error: null},
            );
            expect(result.consumer).toBe('packages/cli');
            expect(result.build.success).toBe(true);
            expect(result.test.success).toBe(true);
            expect(result.passed).toBe(true);
        });

        test('should build a failing result when build fails', () => {
            const result = downstreamCheck.buildConsumerResult(
                'packages/cli',
                {success: false, error: 'build error'},
                {success: false, error: 'Skipped (build failed)'},
            );
            expect(result.passed).toBe(false);
            expect(result.build.success).toBe(false);
            expect(result.test.success).toBe(false);
        });

        test('should build a failing result when tests fail', () => {
            const result = downstreamCheck.buildConsumerResult(
                'packages/cli',
                {success: true, error: null},
                {success: false, error: 'test failure'},
            );
            expect(result.passed).toBe(false);
            expect(result.build.success).toBe(true);
            expect(result.test.success).toBe(false);
        });
    });

    test.describe('summarizeConsumerResults', () => {
        test('should summarize all-passing results', () => {
            const results = [
                downstreamCheck.buildConsumerResult(
                    'a',
                    {success: true, error: null},
                    {success: true, error: null},
                ),
                downstreamCheck.buildConsumerResult(
                    'b',
                    {success: true, error: null},
                    {success: true, error: null},
                ),
            ];
            const summary = downstreamCheck.summarizeConsumerResults(results);
            expect(summary.total).toBe(2);
            expect(summary.passed).toBe(2);
            expect(summary.failed).toBe(0);
            expect(summary.failedConsumers).toEqual([]);
        });

        test('should summarize mixed results', () => {
            const results = [
                downstreamCheck.buildConsumerResult(
                    'a',
                    {success: true, error: null},
                    {success: true, error: null},
                ),
                downstreamCheck.buildConsumerResult(
                    'b',
                    {success: false, error: 'err'},
                    {success: false, error: 'skipped'},
                ),
            ];
            const summary = downstreamCheck.summarizeConsumerResults(results);
            expect(summary.total).toBe(2);
            expect(summary.passed).toBe(1);
            expect(summary.failed).toBe(1);
            expect(summary.failedConsumers).toEqual(['b']);
        });

        test('should summarize empty results', () => {
            const summary = downstreamCheck.summarizeConsumerResults([]);
            expect(summary.total).toBe(0);
            expect(summary.passed).toBe(0);
            expect(summary.failed).toBe(0);
            expect(summary.failedConsumers).toEqual([]);
        });
    });

    test.describe('runDownstreamCheck — invalid input', () => {
        test('should return error for unknown package', () => {
            const result = downstreamCheck.runDownstreamCheck('unknown', {
                metapackageRoot: '/tmp',
                skipBuild: true,
                skipTests: true,
                skipCorpus: true,
            });
            expect(result.passed).toBe(false);
            expect(result.error).toContain('Unknown core package');
            expect(result.summary.total).toBe(0);
        });

        test('should reject a non-full PR SHA', () => {
            const result = downstreamCheck.runDownstreamCheck('transform', {
                prSha: 'abc123',
                metapackageRoot: METAPACKAGE_ROOT,
                skipBuild: true,
                skipTests: true,
                skipCorpus: true,
            });
            expect(result.passed).toBe(false);
            expect(result.error).toContain('40-character');
            expect(result.summary.total).toBe(0);
        });
    });

    test.describe('runDownstreamCheck — skip flags', () => {
        test('should pass when all consumers skipped and no corpus', () => {
            const result = downstreamCheck.runDownstreamCheck('transform', {
                metapackageRoot: METAPACKAGE_ROOT,
                skipBuild: true,
                skipTests: true,
                skipCorpus: true,
            });
            expect(result.package).toBe('transform');
            expect(result.summary.total).toBe(
                downstreamCheck.DOWNSTREAM_CONSUMERS.transform.length,
            );
            expect(result.summary.passed).toBe(result.summary.total);
            expect(result.summary.failed).toBe(0);
            expect(result.passed).toBe(true);
            expect(result.semanticComparison).toBeNull();
            expect(result.visualComparison).toBeNull();
        });

        test('should work for components with skip flags', () => {
            const result = downstreamCheck.runDownstreamCheck('components', {
                metapackageRoot: METAPACKAGE_ROOT,
                skipBuild: true,
                skipTests: true,
                skipCorpus: true,
            });
            expect(result.package).toBe('components');
            expect(result.summary.total).toBe(
                downstreamCheck.DOWNSTREAM_CONSUMERS.components.length,
            );
            expect(result.passed).toBe(true);
        });

        test('should work for cli with skip flags', () => {
            const result = downstreamCheck.runDownstreamCheck('cli', {
                metapackageRoot: METAPACKAGE_ROOT,
                skipBuild: true,
                skipTests: true,
                skipCorpus: true,
            });
            expect(result.package).toBe('cli');
            expect(result.summary.total).toBe(downstreamCheck.DOWNSTREAM_CONSUMERS.cli.length);
            expect(result.passed).toBe(true);
        });

        test('should detect non-existent consumer directories', () => {
            const result = downstreamCheck.runDownstreamCheck('transform', {
                metapackageRoot: '/tmp',
                skipBuild: true,
                skipTests: true,
                skipCorpus: true,
            });
            expect(result.summary.total).toBe(
                downstreamCheck.DOWNSTREAM_CONSUMERS.transform.length,
            );
            expect(result.summary.failed).toBe(result.summary.total);
            expect(result.passed).toBe(false);
        });
    });

    test.describe('runDownstreamCheck — corpus comparison', () => {
        test('should run semantic + visual comparison when dirs provided', () => {
            const docsOutput = path.join(__dirname, '..', '..', '..', 'docs', 'output');
            if (!fs.existsSync(docsOutput)) {
                test.skip(true, 'docs/output does not exist');
                return;
            }
            const result = downstreamCheck.runDownstreamCheck('transform', {
                metapackageRoot: METAPACKAGE_ROOT,
                skipBuild: true,
                skipTests: true,
                expectedDir: docsOutput,
                actualDir: docsOutput,
            });
            expect(result.semanticComparison).not.toBeNull();
            expect(result.visualComparison).not.toBeNull();
            expect(result.semanticComparison.hasDifferences).toBe(false);
            expect(result.visualComparison.hasDifferences).toBe(false);
            expect(result.corpusPassed).toBe(true);
            expect(result.passed).toBe(true);
        });

        test('should fail closed when corpus directories do not exist', () => {
            const result = downstreamCheck.runDownstreamCheck('transform', {
                metapackageRoot: METAPACKAGE_ROOT,
                skipBuild: true,
                skipTests: true,
                expectedDir: '/nonexistent/expected',
                actualDir: '/nonexistent/actual',
            });
            expect(result.semanticComparison).toBeNull();
            expect(result.visualComparison).toBeNull();
            expect(result.corpusPassed).toBe(false);
            expect(result.corpusError).toMatch(/does not exist/);
            expect(result.passed).toBe(false);
        });
    });

    test.describe('truncate', () => {
        test('should return short strings unchanged', () => {
            expect(downstreamCheck.truncate('hello', 100)).toBe('hello');
        });

        test('should truncate long strings', () => {
            const long = 'a'.repeat(500);
            const result = downstreamCheck.truncate(long, 100);
            expect(result.length).toBe(103);
            expect(result.endsWith('...')).toBe(true);
        });

        test('should use default max of 300', () => {
            const long = 'a'.repeat(400);
            const result = downstreamCheck.truncate(long);
            expect(result.length).toBe(303);
        });

        test('should handle null/undefined input', () => {
            expect(downstreamCheck.truncate(null)).toBe('');
            expect(downstreamCheck.truncate(undefined)).toBe('');
        });
    });

    test.describe('renderReport', () => {
        test('should render a passing report', () => {
            const result = {
                package: 'transform',
                prSha: 'abc123',
                metapackageRoot: '/path/to/metapkg',
                consumers: [
                    downstreamCheck.buildConsumerResult(
                        'packages/cli',
                        {success: true, error: null},
                        {success: true, error: null},
                    ),
                    downstreamCheck.buildConsumerResult(
                        'packages/client',
                        {success: true, error: null},
                        {success: true, error: null},
                    ),
                ],
                summary: {total: 2, passed: 2, failed: 0, failedConsumers: []},
                semanticComparison: null,
                visualComparison: null,
                corpusPassed: true,
                passed: true,
            };
            const md = downstreamCheck.renderReport(result);
            expect(md).toContain('# Downstream Check Report');
            expect(md).toContain('PASSED');
            expect(md).toContain('transform');
            expect(md).toContain('packages/cli');
            expect(md).toContain('packages/client');
        });

        test('should render a failing report with consumer failures', () => {
            const result = {
                package: 'cli',
                prSha: null,
                metapackageRoot: '/path/to/metapkg',
                consumers: [
                    downstreamCheck.buildConsumerResult(
                        'packages/client',
                        {success: false, error: 'build error'},
                        {success: false, error: 'skipped'},
                    ),
                ],
                summary: {total: 1, passed: 0, failed: 1, failedConsumers: ['packages/client']},
                semanticComparison: null,
                visualComparison: null,
                corpusPassed: true,
                passed: false,
            };
            const md = downstreamCheck.renderReport(result);
            expect(md).toContain('FAILED');
            expect(md).toContain('Failed Consumers');
            expect(md).toContain('build error');
            expect(md).toContain('CODEOWNER Review Required');
        });

        test('should render corpus comparison section', () => {
            const result = {
                package: 'transform',
                prSha: null,
                metapackageRoot: '/path/to/metapkg',
                consumers: [],
                summary: {total: 0, passed: 0, failed: 0, failedConsumers: []},
                semanticComparison: {
                    hasDifferences: false,
                    fileTreeDiff: {added: [], removed: []},
                    htmlDiffs: [],
                },
                visualComparison: {
                    hasDifferences: false,
                    svgDiffs: [],
                    addedFiles: [],
                    removedFiles: [],
                },
                corpusPassed: true,
                passed: true,
            };
            const md = downstreamCheck.renderReport(result);
            expect(md).toContain('Corpus Comparison');
            expect(md).toContain('Semantic (Artifact) Comparison');
            expect(md).toContain('Visual (SVG DOM) Comparison');
            expect(md).toContain('No differences detected');
            expect(md).toContain('No SVG DOM differences detected');
        });

        test('should render corpus comparison with differences', () => {
            const result = {
                package: 'transform',
                prSha: null,
                metapackageRoot: '/path/to/metapkg',
                consumers: [],
                summary: {total: 0, passed: 0, failed: 0, failedConsumers: []},
                semanticComparison: {
                    hasDifferences: true,
                    fileTreeDiff: {added: ['new.html'], removed: ['old.html']},
                    htmlDiffs: [{file: 'index.html', diff: ['- old', '+ new']}],
                },
                visualComparison: {
                    hasDifferences: true,
                    svgDiffs: [{file: 'diagram.svg', diffs: ['viewBox mismatch']}],
                    addedFiles: [],
                    removedFiles: [],
                },
                corpusPassed: false,
                passed: false,
            };
            const md = downstreamCheck.renderReport(result);
            expect(md).toContain('Differences detected');
            expect(md).toContain('Added files');
            expect(md).toContain('new.html');
            expect(md).toContain('Removed files');
            expect(md).toContain('old.html');
            expect(md).toContain('HTML diffs');
            expect(md).toContain('SVG DOM differences');
            expect(md).toContain('diagram.svg');
            expect(md).toContain('CODEOWNER Review Required');
        });

        test('should render error report', () => {
            const result = {
                package: 'unknown',
                error: 'Unknown core package: unknown',
                consumers: [],
                summary: {total: 0, passed: 0, failed: 0, failedConsumers: []},
                semanticComparison: null,
                visualComparison: null,
                corpusPassed: true,
                passed: false,
            };
            const md = downstreamCheck.renderReport(result);
            expect(md).toContain('# Downstream Check Report');
            expect(md).toContain('Error');
            expect(md).toContain('Unknown core package');
        });
    });

    test.describe('Verification profile integration', () => {
        test('ecosystem profile should have downstream-check step', () => {
            const vp = require('../../../src/verification-profiles/index.js');
            expect(vp.hasStep('ecosystem', 'downstream-check')).toBe(true);
        });

        test('downstream-check step should reference downstream-check.js script', () => {
            const vp = require('../../../src/verification-profiles/index.js');
            const profile = vp.getProfile('ecosystem');
            const step = profile.steps.find((s: {id: string}) => s.id === 'downstream-check');
            expect(step).toBeDefined();
            expect(step.command).toContain('downstream-check.js');
        });

        test('downstream-check step should accept --package flag', () => {
            const vp = require('../../../src/verification-profiles/index.js');
            const profile = vp.getProfile('ecosystem');
            const step = profile.steps.find((s: {id: string}) => s.id === 'downstream-check');
            expect(step.command).toContain('--package');
        });
    });

    test.describe('CLI script — execution', () => {
        test('should exit 1 when --package is missing', () => {
            const {execSync} = require('child_process');
            const script = path.join(__dirname, '..', '..', '..', 'scripts', 'downstream-check.js');
            expect(() => execSync(`node "${script}"`, {encoding: 'utf-8'})).toThrow();
        });

        test('should exit 1 for unknown package', () => {
            const {execSync} = require('child_process');
            const script = path.join(__dirname, '..', '..', '..', 'scripts', 'downstream-check.js');
            expect(() =>
                execSync(
                    `node "${script}" --package unknown --skip-build --skip-tests --skip-corpus`,
                    {
                        encoding: 'utf-8',
                    },
                ),
            ).toThrow();
        });

        test('should exit 0 for valid package with all skips', () => {
            const {execSync} = require('child_process');
            const script = path.join(__dirname, '..', '..', '..', 'scripts', 'downstream-check.js');
            const metapkgRoot = downstreamCheck.resolveMetapackageRoot(__dirname);
            if (!metapkgRoot) {
                test.skip(true, 'metapackage root not found');
                return;
            }
            const cmd = `node "${script}" --package transform --skip-build --skip-tests --skip-corpus --metapackage-root "${metapkgRoot}"`;
            expect(() => execSync(cmd, {encoding: 'utf-8'})).not.toThrow();
        });
    });
});
