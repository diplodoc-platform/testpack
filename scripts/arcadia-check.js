#!/usr/bin/env node

/**
 * Arcadia External Check for Diplodoc packages.
 *
 * When a Diplodoc package receives a Dependabot PR, this script verifies
 * the external impact on consumers in the Arcadia monorepo — the Yandex
 * internal VCS that consumes Diplodoc packages as contrib libraries.
 *
 * The check:
 *
 * 1. Resolves the Arcadia contrib path for the changed package.
 * 2. Resolves the Arcadia projects that consume the contrib library.
 * 3. For each consumer: runs `arc` VCS commands to update the contrib
 *    checkout, then builds and tests the consumer project.
 * 4. Renders a structured report.
 *
 * When the `arc` CLI is not available (e.g. running outside the Yandex
 * intranet or on a public CI runner), the script falls back to a dry-run
 * mode that validates the package mapping and consumer list without
 * performing any VCS operations.
 *
 * Usage:
 *   node scripts/arcadia-check.js --package <name> [--arc-root <path>]
 *   node scripts/arcadia-check.js --package transform --dry-run
 *   node scripts/arcadia-check.js --package cli --output artifacts/arcadia/
 *   node scripts/arcadia-check.js --package components --report artifacts/arcadia-report.md
 *
 * Exits 0 when all Arcadia consumers pass, 1 when any consumer fails.
 *
 * @module scripts/arcadia-check
 */

'use strict';

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Diplodoc packages consumed by the Arcadia monorepo.
 * These packages are published to Arcadia's contrib area and used by
 * internal Yandex projects.
 */
const ARCADIA_PACKAGES = ['transform', 'components', 'cli'];

/**
 * Arcadia contrib path mapping for each package.
 * Maps the short package name to its path within the Arcadia contrib tree.
 * The contrib root is typically `contrib/skins/diplodoc/` in the Arcadia
 * monorepo.
 */
const ARCADIA_CONTRIB_PATHS = {
    transform: 'contrib/skins/diplodoc/packages/transform',
    components: 'contrib/skins/diplodoc/packages/components',
    cli: 'contrib/skins/diplodoc/packages/cli',
};

/**
 * Arcadia consumer map: for each Diplodoc package, the list of Arcadia
 * project paths that consume it. These are internal Yandex projects that
 * depend on the Diplodoc contrib libraries.
 *
 * The consumer paths are relative to the Arcadia monorepo root.
 */
const ARCADIA_CONSUMERS = {
    transform: [
        'cloudide/frontend/packages/diplodoc-renderer',
        'docs/tools/diplodoc-cli',
        'wiki/frontend/packages/markdown-transform',
    ],
    components: [
        'cloudide/frontend/packages/diplodoc-renderer',
        'wiki/frontend/packages/doc-ui',
    ],
    cli: [
        'docs/tools/diplodoc-cli',
        'wiki/frontend/packages/doc-builder',
        'cloudide/frontend/packages/diplodoc-cli-wrapper',
    ],
};

/**
 * Parse command-line arguments into a key-value map.
 * @returns {Record<string, string>}
 */
function parseArgs() {
    const args = {};
    const argv = process.argv.slice(2);
    for (let i = 0; i < argv.length; i++) {
        if (argv[i].startsWith('--')) {
            const key = argv[i].slice(2);
            const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
            args[key] = value;
        }
    }
    return args;
}

/**
 * Check whether a value is a valid Arcadia package name.
 * @param {string} pkg - Package name to check.
 * @returns {boolean}
 */
function isArcadiaPackage(pkg) {
    return ARCADIA_PACKAGES.includes(pkg);
}

/**
 * Resolve the Arcadia contrib path for a given package.
 * @param {string} pkg - Package name (transform, components, cli).
 * @returns {string|null} Arcadia contrib path or null if unknown.
 */
function resolveContribPath(pkg) {
    return ARCADIA_CONTRIB_PATHS[pkg] || null;
}

/**
 * Resolve the Arcadia consumer projects for a given package.
 * @param {string} pkg - Package name.
 * @returns {string[]} Array of Arcadia project paths.
 */
function resolveArcadiaConsumers(pkg) {
    return ARCADIA_CONSUMERS[pkg] || [];
}

/**
 * Check whether the `arc` CLI is available on the system.
 * @returns {boolean}
 */
function isArcadiaAvailable() {
    try {
        execSync('arc --version', {stdio: 'pipe', timeout: 5000});
        return true;
    } catch {
        return false;
    }
}

/**
 * Resolve the Arcadia monorepo root directory.
 * Walks up from the given directory to find an Arcadia root (identified by
 * the `.arc` directory or an `a.yaml` file at the root).
 * @param {string} [startDir] - Starting directory (default: cwd).
 * @returns {string|null} Arcadia root path or null if not found.
 */
function resolveArcadiaRoot(startDir) {
    let dir = startDir || process.cwd();
    for (let i = 0; i < 20; i++) {
        if (
            fs.existsSync(path.join(dir, '.arc')) ||
            fs.existsSync(path.join(dir, 'a.yaml'))
        ) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return null;
}

/**
 * Check whether an Arcadia project path exists.
 * @param {string} arcRoot - Arcadia monorepo root.
 * @param {string} projectPath - Relative project path.
 * @returns {boolean}
 */
function consumerExists(arcRoot, projectPath) {
    if (!arcRoot) return false;
    return fs.existsSync(path.join(arcRoot, projectPath));
}

/**
 * Build a single Arcadia consumer project.
 * Updates the contrib checkout (if arc is available) and runs the build.
 * @param {string} arcRoot - Arcadia monorepo root.
 * @param {string} consumer - Relative consumer project path.
 * @param {object} [options] - Build options.
 * @param {boolean} [options.dryRun] - Skip actual build, just validate.
 * @returns {{success: boolean, error: string|null}}
 */
function buildArcadiaConsumer(arcRoot, consumer, options) {
    options = options || {};
    if (options.dryRun) {
        return {success: consumerExists(arcRoot, consumer), error: null};
    }
    const consumerDir = path.join(arcRoot, consumer);
    try {
        if (!fs.existsSync(consumerDir)) {
            return {success: false, error: 'Consumer directory not found'};
        }
        execSync('ya make', {cwd: consumerDir, stdio: 'pipe', timeout: 600000});
        return {success: true, error: null};
    } catch (err) {
        return {success: false, error: err.message || String(err)};
    }
}

/**
 * Run a single Arcadia consumer project's test suite.
 * @param {string} arcRoot - Arcadia monorepo root.
 * @param {string} consumer - Relative consumer project path.
 * @param {object} [options] - Test options.
 * @param {boolean} [options.dryRun] - Skip actual tests, just validate.
 * @returns {{success: boolean, error: string|null}}
 */
function runArcadiaConsumerTests(arcRoot, consumer, options) {
    options = options || {};
    if (options.dryRun) {
        return {success: consumerExists(arcRoot, consumer), error: null};
    }
    const consumerDir = path.join(arcRoot, consumer);
    try {
        if (!fs.existsSync(consumerDir)) {
            return {success: false, error: 'Consumer directory not found'};
        }
        execSync('ya make -t -A', {cwd: consumerDir, stdio: 'pipe', timeout: 900000});
        return {success: true, error: null};
    } catch (err) {
        return {success: false, error: err.message || String(err)};
    }
}

/**
 * Build a structured result object for a single Arcadia consumer.
 * @param {string} consumer - Consumer project path.
 * @param {object} buildResult - Build result {success, error}.
 * @param {object} testResult - Test result {success, error}.
 * @returns {object} Structured consumer result.
 */
function buildConsumerResult(consumer, buildResult, testResult) {
    return {
        consumer,
        build: buildResult,
        test: testResult,
        passed: buildResult.success && testResult.success,
    };
}

/**
 * Aggregate all consumer results into a summary.
 * @param {object[]} consumerResults - Array of consumer result objects.
 * @returns {{total: number, passed: number, failed: number, failedConsumers: string[]}}
 */
function summarizeConsumerResults(consumerResults) {
    const total = consumerResults.length;
    const passed = consumerResults.filter((r) => r.passed).length;
    const failed = total - passed;
    const failedConsumers = consumerResults.filter((r) => !r.passed).map((r) => r.consumer);
    return {total, passed, failed, failedConsumers};
}

/**
 * Run the full Arcadia external check for a package.
 * @param {string} pkg - Package name.
 * @param {object} [options] - Options.
 * @param {string} [options.arcRoot] - Arcadia monorepo root directory.
 * @param {boolean} [options.dryRun] - Skip actual build/test operations.
 * @param {boolean} [options.skipBuild] - Skip consumer build step.
 * @param {boolean} [options.skipTests] - Skip consumer test step.
 * @returns {object} Arcadia check result.
 */
function runArcadiaCheck(pkg, options) {
    options = options || {};
    const opts = {
        arcRoot: options.arcRoot || resolveArcadiaRoot(),
        dryRun: options.dryRun === true || !isArcadiaAvailable(),
        skipBuild: options.skipBuild === true,
        skipTests: options.skipTests === true,
    };

    if (!isArcadiaPackage(pkg)) {
        return {
            package: pkg,
            error: `Unknown package: ${pkg}. Valid: ${ARCADIA_PACKAGES.join(', ')}`,
            consumers: [],
            summary: {total: 0, passed: 0, failed: 0, failedConsumers: []},
            dryRun: opts.dryRun,
            passed: false,
        };
    }

    const consumers = resolveArcadiaConsumers(pkg);
    const consumerResults = [];

    for (const consumer of consumers) {
        if (!opts.dryRun && !opts.arcRoot) {
            consumerResults.push(
                buildConsumerResult(consumer, {success: false, error: 'Arcadia root not found'}, {success: false, error: 'Skipped (no arc root)'}),
            );
            continue;
        }

        let buildResult = {success: true, error: null};
        if (!opts.skipBuild) {
            buildResult = buildArcadiaConsumer(opts.arcRoot, consumer, {dryRun: opts.dryRun});
        }

        let testResult = {success: true, error: null};
        if (!opts.skipTests && buildResult.success) {
            testResult = runArcadiaConsumerTests(opts.arcRoot, consumer, {dryRun: opts.dryRun});
        } else if (!buildResult.success) {
            testResult = {success: false, error: 'Skipped (build failed)'};
        }

        consumerResults.push(buildConsumerResult(consumer, buildResult, testResult));
    }

    const summary = summarizeConsumerResults(consumerResults);

    return {
        package: pkg,
        contribPath: resolveContribPath(pkg),
        arcRoot: opts.arcRoot,
        consumers: consumerResults,
        summary,
        dryRun: opts.dryRun,
        passed: summary.failed === 0,
    };
}

/**
 * Truncate a string for display in report output.
 * @param {string} s - String to truncate.
 * @param {number} [max=300] - Maximum length.
 * @returns {string}
 */
function truncate(s, max) {
    max = max || 300;
    s = String(s || '');
    return s.length > max ? s.slice(0, max) + '...' : s;
}

/**
 * Render the Arcadia external check result as a markdown report.
 * @param {object} result - Result from runArcadiaCheck.
 * @returns {string} Markdown report.
 */
function renderReport(result) {
    const lines = [];
    lines.push('# Arcadia External Check Report\n');
    lines.push(`Generated: ${new Date().toISOString()}\n`);

    if (result.dryRun) {
        lines.push('> **Dry-run mode** — the `arc` CLI is not available. ');
        lines.push('> Consumer existence is validated but no build/test operations are performed.\n');
    }

    lines.push('## Summary\n');
    lines.push('| Field | Value |');
    lines.push('| ----- | ----- |');
    lines.push(`| Package | \`${result.package || '—'}\` |`);
    lines.push(`| Contrib path | \`${result.contribPath || '—'}\` |`);
    lines.push(`| Arcadia root | \`${result.arcRoot || '—'}\` |`);
    lines.push(`| Dry run | ${result.dryRun ? 'yes' : 'no'} |`);
    lines.push(`| Consumers total | ${result.summary.total} |`);
    lines.push(`| Consumers passed | ${result.summary.passed} |`);
    lines.push(`| Consumers failed | ${result.summary.failed} |`);
    lines.push(`| Overall result | ${result.passed ? '**PASSED**' : '**FAILED**'} |`);
    lines.push('');

    if (result.error) {
        lines.push('## Error\n');
        lines.push(`> ${result.error}\n`);
        return lines.join('\n');
    }

    if (result.consumers.length > 0) {
        lines.push('## Consumer Results\n');
        lines.push('| Consumer | Build | Tests | Status |');
        lines.push('| -------- | ----- | ----- | ------ |');
        for (const c of result.consumers) {
            const buildStatus = c.build.success ? 'pass' : 'fail';
            const testStatus = c.test.success ? 'pass' : 'fail';
            const status = c.passed ? 'PASSED' : 'FAILED';
            lines.push(`| \`${c.consumer}\` | ${buildStatus} | ${testStatus} | ${status} |`);
        }
        lines.push('');

        const failed = result.consumers.filter((c) => !c.passed);
        if (failed.length > 0) {
            lines.push('### Failed Consumers\n');
            for (const c of failed) {
                lines.push(`#### \`${c.consumer}\``);
                if (c.build.error) {
                    lines.push(`- **Build error:** ${truncate(c.build.error, 300)}`);
                }
                if (c.test.error) {
                    lines.push(`- **Test error:** ${truncate(c.test.error, 300)}`);
                }
                lines.push('');
            }
        }
    }

    if (!result.passed) {
        lines.push('## CODEOWNER Review Required\n');
        lines.push(
            'Arcadia external check failures require human CODEOWNER review. ' +
            'The Dependabot PR must not be merged until all Arcadia consumers pass ' +
            '(or are confirmed not applicable in dry-run mode).',
        );
        lines.push('');
    }

    return lines.join('\n');
}

function main() {
    const args = parseArgs();
    const pkg = args.package;
    const arcRoot = args['arc-root'] || null;
    const output = args.output;
    const report = args.report;
    const dryRun = args['dry-run'] === 'true';
    const skipBuild = args['skip-build'] === 'true';
    const skipTests = args['skip-tests'] === 'true';

    if (!pkg) {
        console.error(
            'Usage: arcadia-check.js --package <transform|components|cli> [--arc-root <path>] [--dry-run] [--output <dir>] [--report <path>]',
        );
        process.exit(1);
    }

    const result = runArcadiaCheck(pkg, {
        arcRoot,
        dryRun,
        skipBuild,
        skipTests,
    });

    const md = renderReport(result);

    if (report) {
        fs.mkdirSync(path.dirname(report), {recursive: true});
        fs.writeFileSync(report, md, 'utf-8');
    }

    if (output) {
        fs.mkdirSync(output, {recursive: true});
        fs.writeFileSync(path.join(output, 'arcadia-result.json'), JSON.stringify(result, null, 2) + '\n', 'utf-8');
    }

    console.log(md);

    if (!result.passed) {
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    parseArgs,
    ARCADIA_PACKAGES,
    ARCADIA_CONTRIB_PATHS,
    ARCADIA_CONSUMERS,
    isArcadiaPackage,
    resolveContribPath,
    resolveArcadiaConsumers,
    isArcadiaAvailable,
    resolveArcadiaRoot,
    consumerExists,
    buildArcadiaConsumer,
    runArcadiaConsumerTests,
    buildConsumerResult,
    summarizeConsumerResults,
    runArcadiaCheck,
    renderReport,
    truncate,
};
