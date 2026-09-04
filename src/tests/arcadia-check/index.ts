import * as fs from 'fs';
import * as path from 'path';
import {expect, test} from '@playwright/test';

/* eslint-disable @typescript-eslint/no-require-imports */
const arcadiaCheck = require('../../../scripts/arcadia-check.js');
/* eslint-enable @typescript-eslint/no-require-imports */

test.describe('Arcadia External Check', () => {
    test.describe('ARCADIA_PACKAGES', () => {
        test('should define exactly 3 packages', () => {
            expect(arcadiaCheck.ARCADIA_PACKAGES).toHaveLength(3);
        });

        test('should include transform, components, cli', () => {
            expect(arcadiaCheck.ARCADIA_PACKAGES).toContain('transform');
            expect(arcadiaCheck.ARCADIA_PACKAGES).toContain('components');
            expect(arcadiaCheck.ARCADIA_PACKAGES).toContain('cli');
        });
    });

    test.describe('ARCADIA_CONTRIB_PATHS', () => {
        test('should map transform to a contrib path', () => {
            expect(arcadiaCheck.ARCADIA_CONTRIB_PATHS.transform).toContain('contrib/');
            expect(arcadiaCheck.ARCADIA_CONTRIB_PATHS.transform).toContain('transform');
        });

        test('should map components to a contrib path', () => {
            expect(arcadiaCheck.ARCADIA_CONTRIB_PATHS.components).toContain('contrib/');
            expect(arcadiaCheck.ARCADIA_CONTRIB_PATHS.components).toContain('components');
        });

        test('should map cli to a contrib path', () => {
            expect(arcadiaCheck.ARCADIA_CONTRIB_PATHS.cli).toContain('contrib/');
            expect(arcadiaCheck.ARCADIA_CONTRIB_PATHS.cli).toContain('cli');
        });

        test('should have a contrib path for every package', () => {
            for (const pkg of arcadiaCheck.ARCADIA_PACKAGES) {
                expect(arcadiaCheck.ARCADIA_CONTRIB_PATHS[pkg]).toBeDefined();
                expect(arcadiaCheck.ARCADIA_CONTRIB_PATHS[pkg].length).toBeGreaterThan(0);
            }
        });

        test('all contrib paths should start with contrib/', () => {
            for (const pkg of arcadiaCheck.ARCADIA_PACKAGES) {
                expect(arcadiaCheck.ARCADIA_CONTRIB_PATHS[pkg]).toMatch(/^contrib\//);
            }
        });
    });

    test.describe('ARCADIA_CONSUMERS', () => {
        test('should have a consumer list for each package', () => {
            for (const pkg of arcadiaCheck.ARCADIA_PACKAGES) {
                expect(arcadiaCheck.ARCADIA_CONSUMERS[pkg]).toBeDefined();
                expect(Array.isArray(arcadiaCheck.ARCADIA_CONSUMERS[pkg])).toBe(true);
            }
        });

        test('transform should have at least 3 consumers', () => {
            expect(arcadiaCheck.ARCADIA_CONSUMERS.transform.length).toBeGreaterThanOrEqual(3);
        });

        test('components should have at least 2 consumers', () => {
            expect(arcadiaCheck.ARCADIA_CONSUMERS.components.length).toBeGreaterThanOrEqual(2);
        });

        test('cli should have at least 3 consumers', () => {
            expect(arcadiaCheck.ARCADIA_CONSUMERS.cli.length).toBeGreaterThanOrEqual(3);
        });

        test('all consumer paths should be non-empty strings', () => {
            for (const pkg of arcadiaCheck.ARCADIA_PACKAGES) {
                for (const consumer of arcadiaCheck.ARCADIA_CONSUMERS[pkg]) {
                    expect(typeof consumer).toBe('string');
                    expect(consumer.length).toBeGreaterThan(0);
                }
            }
        });

        test('consumer paths should not start with contrib/', () => {
            for (const pkg of arcadiaCheck.ARCADIA_PACKAGES) {
                for (const consumer of arcadiaCheck.ARCADIA_CONSUMERS[pkg]) {
                    expect(consumer).not.toMatch(/^contrib\//);
                }
            }
        });
    });

    test.describe('isArcadiaPackage', () => {
        test('should return true for transform', () => {
            expect(arcadiaCheck.isArcadiaPackage('transform')).toBe(true);
        });

        test('should return true for components', () => {
            expect(arcadiaCheck.isArcadiaPackage('components')).toBe(true);
        });

        test('should return true for cli', () => {
            expect(arcadiaCheck.isArcadiaPackage('cli')).toBe(true);
        });

        test('should return false for non-Arcadia packages', () => {
            expect(arcadiaCheck.isArcadiaPackage('ajv')).toBe(false);
            expect(arcadiaCheck.isArcadiaPackage('utils')).toBe(false);
            expect(arcadiaCheck.isArcadiaPackage('')).toBe(false);
        });

        test('should return false for undefined/null', () => {
            expect(arcadiaCheck.isArcadiaPackage(undefined)).toBe(false);
            expect(arcadiaCheck.isArcadiaPackage(null)).toBe(false);
        });
    });

    test.describe('resolveContribPath', () => {
        test('should resolve transform contrib path', () => {
            const p = arcadiaCheck.resolveContribPath('transform');
            expect(p).toContain('contrib/');
            expect(p).toContain('transform');
        });

        test('should resolve components contrib path', () => {
            const p = arcadiaCheck.resolveContribPath('components');
            expect(p).toContain('contrib/');
            expect(p).toContain('components');
        });

        test('should resolve cli contrib path', () => {
            const p = arcadiaCheck.resolveContribPath('cli');
            expect(p).toContain('contrib/');
            expect(p).toContain('cli');
        });

        test('should return null for unknown package', () => {
            expect(arcadiaCheck.resolveContribPath('unknown')).toBeNull();
        });
    });

    test.describe('resolveArcadiaConsumers', () => {
        test('should return consumers for transform', () => {
            const consumers = arcadiaCheck.resolveArcadiaConsumers('transform');
            expect(consumers.length).toBeGreaterThan(0);
        });

        test('should return consumers for components', () => {
            const consumers = arcadiaCheck.resolveArcadiaConsumers('components');
            expect(consumers.length).toBeGreaterThan(0);
        });

        test('should return consumers for cli', () => {
            const consumers = arcadiaCheck.resolveArcadiaConsumers('cli');
            expect(consumers.length).toBeGreaterThan(0);
        });

        test('should return empty array for unknown package', () => {
            expect(arcadiaCheck.resolveArcadiaConsumers('unknown')).toEqual([]);
        });
    });

    test.describe('consumerExists', () => {
        test('should return false when arcRoot is null', () => {
            expect(arcadiaCheck.consumerExists(null, 'some/path')).toBe(false);
        });

        test('should return false when arcRoot is empty', () => {
            expect(arcadiaCheck.consumerExists('', 'some/path')).toBe(false);
        });

        test('should return false for non-existent path', () => {
            expect(arcadiaCheck.consumerExists('/tmp', 'nonexistent-arcadia-path-' + Date.now())).toBe(false);
        });

        test('should return true for existing directory', () => {
            const tmpDir = path.join(require('os').tmpdir(), '.tmp-arcadia-consumer-' + Date.now());
            try {
                fs.mkdirSync(tmpDir, {recursive: true});
                expect(arcadiaCheck.consumerExists(require('os').tmpdir(), path.basename(tmpDir))).toBe(true);
            } finally {
                fs.rmSync(tmpDir, {recursive: true, force: true});
            }
        });
    });

    test.describe('buildConsumerResult', () => {
        test('should build a passing result', () => {
            const result = arcadiaCheck.buildConsumerResult(
                'docs/tools/diplodoc-cli',
                {success: true, error: null},
                {success: true, error: null},
            );
            expect(result.consumer).toBe('docs/tools/diplodoc-cli');
            expect(result.build.success).toBe(true);
            expect(result.test.success).toBe(true);
            expect(result.passed).toBe(true);
        });

        test('should build a failing result when build fails', () => {
            const result = arcadiaCheck.buildConsumerResult(
                'docs/tools/diplodoc-cli',
                {success: false, error: 'build error'},
                {success: false, error: 'Skipped (build failed)'},
            );
            expect(result.passed).toBe(false);
            expect(result.build.success).toBe(false);
            expect(result.test.success).toBe(false);
        });

        test('should build a failing result when tests fail', () => {
            const result = arcadiaCheck.buildConsumerResult(
                'docs/tools/diplodoc-cli',
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
                arcadiaCheck.buildConsumerResult(
                    'a',
                    {success: true, error: null},
                    {success: true, error: null},
                ),
                arcadiaCheck.buildConsumerResult(
                    'b',
                    {success: true, error: null},
                    {success: true, error: null},
                ),
            ];
            const summary = arcadiaCheck.summarizeConsumerResults(results);
            expect(summary.total).toBe(2);
            expect(summary.passed).toBe(2);
            expect(summary.failed).toBe(0);
            expect(summary.failedConsumers).toEqual([]);
        });

        test('should summarize mixed results', () => {
            const results = [
                arcadiaCheck.buildConsumerResult(
                    'a',
                    {success: true, error: null},
                    {success: true, error: null},
                ),
                arcadiaCheck.buildConsumerResult(
                    'b',
                    {success: false, error: 'err'},
                    {success: false, error: 'skipped'},
                ),
            ];
            const summary = arcadiaCheck.summarizeConsumerResults(results);
            expect(summary.total).toBe(2);
            expect(summary.passed).toBe(1);
            expect(summary.failed).toBe(1);
            expect(summary.failedConsumers).toEqual(['b']);
        });

        test('should summarize empty results', () => {
            const summary = arcadiaCheck.summarizeConsumerResults([]);
            expect(summary.total).toBe(0);
            expect(summary.passed).toBe(0);
            expect(summary.failed).toBe(0);
            expect(summary.failedConsumers).toEqual([]);
        });
    });

    test.describe('runArcadiaCheck — invalid input', () => {
        test('should return error for unknown package', () => {
            const result = arcadiaCheck.runArcadiaCheck('unknown', {
                dryRun: true,
                skipBuild: true,
                skipTests: true,
            });
            expect(result.passed).toBe(false);
            expect(result.error).toContain('Unknown package');
            expect(result.summary.total).toBe(0);
        });
    });

    test.describe('runArcadiaCheck — dry-run mode', () => {
        test('should pass when dry-run and consumers exist check is skipped', () => {
            const result = arcadiaCheck.runArcadiaCheck('transform', {
                dryRun: true,
                skipBuild: true,
                skipTests: true,
            });
            expect(result.package).toBe('transform');
            expect(result.dryRun).toBe(true);
            expect(result.summary.total).toBe(
                arcadiaCheck.ARCADIA_CONSUMERS.transform.length,
            );
            expect(result.summary.passed).toBe(result.summary.total);
            expect(result.summary.failed).toBe(0);
            expect(result.passed).toBe(true);
        });

        test('should work for components in dry-run mode', () => {
            const result = arcadiaCheck.runArcadiaCheck('components', {
                dryRun: true,
                skipBuild: true,
                skipTests: true,
            });
            expect(result.package).toBe('components');
            expect(result.dryRun).toBe(true);
            expect(result.summary.total).toBe(
                arcadiaCheck.ARCADIA_CONSUMERS.components.length,
            );
            expect(result.passed).toBe(true);
        });

        test('should work for cli in dry-run mode', () => {
            const result = arcadiaCheck.runArcadiaCheck('cli', {
                dryRun: true,
                skipBuild: true,
                skipTests: true,
            });
            expect(result.package).toBe('cli');
            expect(result.dryRun).toBe(true);
            expect(result.summary.total).toBe(
                arcadiaCheck.ARCADIA_CONSUMERS.cli.length,
            );
            expect(result.passed).toBe(true);
        });

        test('should include contrib path in result', () => {
            const result = arcadiaCheck.runArcadiaCheck('transform', {
                dryRun: true,
                skipBuild: true,
                skipTests: true,
            });
            expect(result.contribPath).toBe(arcadiaCheck.ARCADIA_CONTRIB_PATHS.transform);
        });

        test('should fail when arc root not found and not dry-run', () => {
            const result = arcadiaCheck.runArcadiaCheck('transform', {
                arcRoot: null,
                dryRun: false,
                skipBuild: false,
                skipTests: false,
            });
            expect(result.passed).toBe(false);
            expect(result.summary.failed).toBe(result.summary.total);
        });
    });

    test.describe('truncate', () => {
        test('should return short strings unchanged', () => {
            expect(arcadiaCheck.truncate('hello', 100)).toBe('hello');
        });

        test('should truncate long strings', () => {
            const long = 'a'.repeat(500);
            const result = arcadiaCheck.truncate(long, 100);
            expect(result.length).toBe(103);
            expect(result.endsWith('...')).toBe(true);
        });

        test('should use default max of 300', () => {
            const long = 'a'.repeat(400);
            const result = arcadiaCheck.truncate(long);
            expect(result.length).toBe(303);
        });

        test('should handle null/undefined input', () => {
            expect(arcadiaCheck.truncate(null)).toBe('');
            expect(arcadiaCheck.truncate(undefined)).toBe('');
        });
    });

    test.describe('renderReport', () => {
        test('should render a passing report', () => {
            const result = {
                package: 'transform',
                contribPath: 'contrib/skins/diplodoc/packages/transform',
                arcRoot: '/arc/root',
                consumers: [
                    arcadiaCheck.buildConsumerResult(
                        'docs/tools/diplodoc-cli',
                        {success: true, error: null},
                        {success: true, error: null},
                    ),
                    arcadiaCheck.buildConsumerResult(
                        'wiki/frontend/packages/markdown-transform',
                        {success: true, error: null},
                        {success: true, error: null},
                    ),
                ],
                summary: {total: 2, passed: 2, failed: 0, failedConsumers: []},
                dryRun: false,
                passed: true,
            };
            const md = arcadiaCheck.renderReport(result);
            expect(md).toContain('# Arcadia External Check Report');
            expect(md).toContain('PASSED');
            expect(md).toContain('transform');
            expect(md).toContain('docs/tools/diplodoc-cli');
            expect(md).toContain('wiki/frontend/packages/markdown-transform');
            expect(md).toContain('contrib/skins/diplodoc/packages/transform');
        });

        test('should render a failing report with consumer failures', () => {
            const result = {
                package: 'cli',
                contribPath: 'contrib/skins/diplodoc/packages/cli',
                arcRoot: '/arc/root',
                consumers: [
                    arcadiaCheck.buildConsumerResult(
                        'docs/tools/diplodoc-cli',
                        {success: false, error: 'build error'},
                        {success: false, error: 'skipped'},
                    ),
                ],
                summary: {total: 1, passed: 0, failed: 1, failedConsumers: ['docs/tools/diplodoc-cli']},
                dryRun: false,
                passed: false,
            };
            const md = arcadiaCheck.renderReport(result);
            expect(md).toContain('FAILED');
            expect(md).toContain('Failed Consumers');
            expect(md).toContain('build error');
            expect(md).toContain('CODEOWNER Review Required');
        });

        test('should render dry-run notice', () => {
            const result = {
                package: 'transform',
                contribPath: 'contrib/skins/diplodoc/packages/transform',
                arcRoot: null,
                consumers: [],
                summary: {total: 0, passed: 0, failed: 0, failedConsumers: []},
                dryRun: true,
                passed: true,
            };
            const md = arcadiaCheck.renderReport(result);
            expect(md).toContain('Dry-run mode');
            expect(md).toContain('arc');
        });

        test('should render error report', () => {
            const result = {
                package: 'unknown',
                error: 'Unknown package: unknown',
                consumers: [],
                summary: {total: 0, passed: 0, failed: 0, failedConsumers: []},
                dryRun: false,
                passed: false,
            };
            const md = arcadiaCheck.renderReport(result);
            expect(md).toContain('# Arcadia External Check Report');
            expect(md).toContain('Error');
            expect(md).toContain('Unknown package');
        });

        test('should render summary table with all fields', () => {
            const result = {
                package: 'components',
                contribPath: 'contrib/skins/diplodoc/packages/components',
                arcRoot: '/arc/root',
                consumers: [],
                summary: {total: 0, passed: 0, failed: 0, failedConsumers: []},
                dryRun: false,
                passed: true,
            };
            const md = arcadiaCheck.renderReport(result);
            expect(md).toContain('Package');
            expect(md).toContain('Contrib path');
            expect(md).toContain('Arcadia root');
            expect(md).toContain('Dry run');
            expect(md).toContain('Consumers total');
            expect(md).toContain('Consumers passed');
            expect(md).toContain('Consumers failed');
            expect(md).toContain('Overall result');
        });
    });

    test.describe('Verification profile integration', () => {
        test('ecosystem profile should have arcadia-external-check step', () => {
            const vp = require('../../../src/verification-profiles/index.js');
            expect(vp.hasStep('ecosystem', 'arcadia-external-check')).toBe(true);
        });

        test('arcadia-external-check step should reference arcadia-check.js script', () => {
            const vp = require('../../../src/verification-profiles/index.js');
            const profile = vp.getProfile('ecosystem');
            const step = profile.steps.find((s: {id: string}) => s.id === 'arcadia-external-check');
            expect(step).toBeDefined();
            expect(step.command).toContain('arcadia-check.js');
        });

        test('arcadia-external-check step should accept --package flag', () => {
            const vp = require('../../../src/verification-profiles/index.js');
            const profile = vp.getProfile('ecosystem');
            const step = profile.steps.find((s: {id: string}) => s.id === 'arcadia-external-check');
            expect(step.command).toContain('--package');
        });
    });

    test.describe('CLI script — execution', () => {
        test('should exit 1 when --package is missing', () => {
            const {execSync} = require('child_process');
            const script = path.join(__dirname, '..', '..', '..', 'scripts', 'arcadia-check.js');
            expect(() => execSync(`node "${script}"`, {encoding: 'utf-8'})).toThrow();
        });

        test('should exit 1 for unknown package', () => {
            const {execSync} = require('child_process');
            const script = path.join(__dirname, '..', '..', '..', 'scripts', 'arcadia-check.js');
            expect(() =>
                execSync(
                    `node "${script}" --package unknown --dry-run`,
                    {
                        encoding: 'utf-8',
                    },
                ),
            ).toThrow();
        });

        test('should exit 0 for valid package in dry-run mode', () => {
            const {execSync} = require('child_process');
            const script = path.join(__dirname, '..', '..', '..', 'scripts', 'arcadia-check.js');
            const cmd = `node "${script}" --package transform --dry-run --skip-build --skip-tests`;
            expect(() => execSync(cmd, {encoding: 'utf-8'})).not.toThrow();
        });
    });
});
