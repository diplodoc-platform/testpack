#!/usr/bin/env node

/**
 * Downstream check for core Diplodoc packages (transform, components, cli).
 *
 * When a core package receives a Dependabot PR, this script verifies the
 * downstream impact by:
 *
 * 1. Resolving the downstream consumers of the changed core package.
 * 2. Building each consumer against dependencies installed at the metapackage root.
 * 3. Running each consumer's test suite.
 * 4. Building the testpack corpus (docs) with the updated package.
 * 5. Running semantic comparison (compare-artifacts) and visual comparison
 *    (compare-svg-dom) against the corpus.
 * 6. Rendering a structured report.
 *
 * Usage:
 *   node scripts/downstream-check.js --package <name> [--pr-sha <sha>]
 *   node scripts/downstream-check.js --package transform --pr-sha <40-character-sha>
 *   node scripts/downstream-check.js --package cli --output artifacts/downstream/
 *   node scripts/downstream-check.js --package components --report artifacts/downstream-report.md
 *
 * Exits 0 when all downstream checks pass, 1 when any consumer fails.
 *
 * @module scripts/downstream-check
 */

'use strict';

/* eslint-disable no-console -- CLI diagnostics are part of this script's interface. */

const {execFileSync, execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const compareArtifacts = require('./compare-artifacts.js');
const compareSvgDom = require('./compare-svg-dom.js');

/**
 * The three core packages that trigger downstream checks.
 * These are the packages whose changes ripple to the most consumers.
 */
const CORE_PACKAGES = ['transform', 'components', 'cli'];

/**
 * Metapackage submodule path mapping for each core package.
 * Maps the short package name to its submodule directory in the metapackage.
 */
const CORE_PACKAGE_PATHS = {
    transform: 'packages/transform',
    components: 'packages/components',
    cli: 'packages/cli',
};

/**
 * Downstream consumer map: for each core package, the list of metapackage
 * submodule paths that directly depend on it (from package.json deps).
 *
 * Derived from the metapackage dependency graph:
 * - @diplodoc/transform is consumed by: cli, client, components, translation,
 *   vsc, yfmlint, html, page-constructor
 * - @diplodoc/cli is consumed by: client, algolia, search, testpack
 * - @diplodoc/components is consumed by: client, search
 */
const DOWNSTREAM_CONSUMERS = {
    transform: [
        'packages/cli',
        'packages/client',
        'packages/components',
        'packages/translation',
        'packages/vsc',
        'packages/yfmlint',
        'extensions/html',
        'extensions/page-constructor',
    ],
    components: ['packages/client', 'extensions/search'],
    cli: ['packages/client', 'extensions/algolia', 'extensions/search', 'devops/testpack'],
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
 * Check whether a value is a valid core package name.
 * @param {string} pkg - Package name to check.
 * @returns {boolean}
 */
function isCorePackage(pkg) {
    return CORE_PACKAGES.includes(pkg);
}

/**
 * Resolve the downstream consumers for a given core package.
 * @param {string} pkg - Core package name (transform, components, cli).
 * @returns {string[]} Array of metapackage submodule paths.
 */
function resolveDownstreamConsumers(pkg) {
    return DOWNSTREAM_CONSUMERS[pkg] || [];
}

/**
 * Resolve the metapackage root directory.
 * Walks up from the current directory (testpack submodule) to find the
 * metapackage root containing the `packages/`, `extensions/`, `devops/`
 * directory tree.
 * @param {string} [startDir] - Starting directory (default: __dirname).
 * @returns {string|null} Metapackage root path or null if not found.
 */
function resolveMetapackageRoot(startDir) {
    let dir = startDir || __dirname;
    for (let i = 0; i < 10; i++) {
        if (
            fs.existsSync(path.join(dir, 'package.json')) &&
            fs.existsSync(path.join(dir, 'packages')) &&
            fs.existsSync(path.join(dir, 'extensions')) &&
            fs.existsSync(path.join(dir, 'devops'))
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
 * Resolve the submodule path for a core package within the metapackage.
 * @param {string} pkg - Core package name.
 * @param {string} metapackageRoot - Metapackage root directory.
 * @returns {string} Absolute path to the submodule directory.
 */
function resolvePackageDir(pkg, metapackageRoot) {
    const subPath = CORE_PACKAGE_PATHS[pkg];
    if (!subPath) throw new Error(`Unknown core package: ${pkg}`);
    return path.join(metapackageRoot, subPath);
}

/**
 * Replace a submodule with a specific commit SHA.
 * This checks out the given SHA in the submodule's git repository.
 * @param {string} submoduleDir - Path to the submodule directory.
 * @param {string} sha - Commit SHA to check out.
 * @returns {void}
 */
function replaceSubmoduleSha(submoduleDir, sha) {
    if (!/^[0-9a-f]{40}$/i.test(sha)) throw new Error('Expected a full commit SHA');
    execFileSync('git', ['fetch', 'origin'], {cwd: submoduleDir, stdio: 'pipe'});
    execFileSync('git', ['checkout', '--detach', sha], {cwd: submoduleDir, stdio: 'pipe'});
}

/**
 * Build a consumer package in the metapackage context.
 * Runs the consumer build against dependencies installed once at the
 * metapackage root. Per-consumer installs would mutate submodules and can hide
 * workspace-resolution failures.
 * @param {string} consumerDir - Path to the consumer package.
 * @returns {object} Build outcome.
 */
function buildConsumer(consumerDir) {
    try {
        execSync('npm run build', {cwd: consumerDir, stdio: 'pipe'});
        return {success: true, error: null};
    } catch (err) {
        return {success: false, error: err.message || String(err)};
    }
}

/**
 * Run a consumer package's test suite.
 * @param {string} consumerDir - Path to the consumer package.
 * @returns {object} Test outcome.
 */
function runConsumerTests(consumerDir) {
    try {
        execSync('npm test', {cwd: consumerDir, stdio: 'pipe'});
        return {success: true, error: null};
    } catch (err) {
        return {success: false, error: err.message || String(err)};
    }
}

/**
 * Build the testpack corpus (docs) at the current working tree state.
 * @param {string} testpackDir - Path to the testpack submodule.
 * @param {string} outputDir - Destination directory for the corpus.
 * @returns {object} Corpus build outcome.
 */
function buildTestpackCorpus(testpackDir, outputDir) {
    try {
        execSync('npm ci', {cwd: testpackDir, stdio: 'pipe'});
        execSync('npm run docs', {cwd: testpackDir, stdio: 'pipe'});
        const docsOutput = path.join(testpackDir, 'docs', 'output');
        if (fs.existsSync(docsOutput) && fs.existsSync(outputDir) === false) {
            fs.mkdirSync(outputDir, {recursive: true});
        }
        if (fs.existsSync(docsOutput)) {
            copyDir(docsOutput, path.join(outputDir, 'output'));
        }
        return {success: true, outputDir, error: null};
    } catch (err) {
        return {success: false, outputDir: null, error: err.message || String(err)};
    }
}

/**
 * Recursively copy a directory.
 * @param {string} src - Source directory.
 * @param {string} dest - Destination directory.
 * @returns {void}
 */
function copyDir(src, dest) {
    fs.mkdirSync(dest, {recursive: true});
    const entries = fs.readdirSync(src, {withFileTypes: true});
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else if (entry.isFile()) {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Run semantic comparison (file tree + normalized HTML) between two corpus builds.
 * @param {string} expectedDir - Expected (base) corpus output directory.
 * @param {string} actualDir - Actual (head) corpus output directory.
 * @returns {object} Comparison result from compare-artifacts.
 */
function runSemanticComparison(expectedDir, actualDir) {
    return compareArtifacts.compareArtifacts(expectedDir, actualDir);
}

/**
 * Run visual comparison (SVG DOM) between two corpus builds.
 * @param {string} expectedDir - Expected (base) corpus output directory.
 * @param {string} actualDir - Actual (head) corpus output directory.
 * @returns {object} Comparison result from compare-svg-dom.
 */
function runVisualComparison(expectedDir, actualDir) {
    return compareSvgDom.compareSvgDoms(expectedDir, actualDir);
}

/**
 * Build a structured result object for a single downstream consumer.
 * @param {string} consumer - Consumer submodule path.
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
 * Run the full downstream check for a core package.
 * @param {string} pkg - Core package name.
 * @param {object} [options] - Options.
 * @param {string} [options.prSha] - PR commit SHA to replace the submodule with.
 * @param {string} [options.metapackageRoot] - Metapackage root directory.
 * @param {string} [options.expectedDir] - Expected (base) corpus directory.
 * @param {string} [options.actualDir] - Actual (head) corpus directory.
 * @param {boolean} [options.skipBuild] - Skip consumer build step.
 * @param {boolean} [options.skipTests] - Skip consumer test step.
 * @param {boolean} [options.skipCorpus] - Skip corpus comparison step.
 * @returns {object} Downstream check result.
 */
// eslint-disable-next-line complexity -- orchestration keeps all fail-closed states visible.
function runDownstreamCheck(pkg, options) {
    options = options || {};
    const opts = {
        prSha: options.prSha || null,
        metapackageRoot: options.metapackageRoot || resolveMetapackageRoot(),
        expectedDir: options.expectedDir || null,
        actualDir: options.actualDir || null,
        skipBuild: options.skipBuild === true,
        skipTests: options.skipTests === true,
        skipCorpus: options.skipCorpus === true,
    };

    if (!isCorePackage(pkg)) {
        return {
            package: pkg,
            error: `Unknown core package: ${pkg}. Valid: ${CORE_PACKAGES.join(', ')}`,
            consumers: [],
            summary: {total: 0, passed: 0, failed: 0, failedConsumers: []},
            semanticComparison: null,
            visualComparison: null,
            passed: false,
        };
    }

    if (!opts.metapackageRoot) {
        return {
            package: pkg,
            error: 'Could not resolve metapackage root directory',
            consumers: [],
            summary: {total: 0, passed: 0, failed: 0, failedConsumers: []},
            semanticComparison: null,
            visualComparison: null,
            passed: false,
        };
    }

    if (opts.prSha && !/^[0-9a-f]{40}$/i.test(opts.prSha)) {
        return {
            package: pkg,
            error: 'PR SHA must be a full 40-character hexadecimal commit SHA',
            consumers: [],
            summary: {total: 0, passed: 0, failed: 0, failedConsumers: []},
            semanticComparison: null,
            visualComparison: null,
            passed: false,
        };
    }

    const consumers = resolveDownstreamConsumers(pkg);
    const consumerResults = [];

    for (const consumer of consumers) {
        const consumerDir = path.join(opts.metapackageRoot, consumer);
        if (!fs.existsSync(consumerDir)) {
            consumerResults.push(
                buildConsumerResult(
                    consumer,
                    {success: false, error: 'Consumer directory not found'},
                    {success: false, error: 'Skipped (dir not found)'},
                ),
            );
            continue;
        }

        let buildResult = {success: true, error: null};
        if (!opts.skipBuild) {
            buildResult = buildConsumer(consumerDir);
        }

        let testResult = {success: true, error: null};
        if (!opts.skipTests && buildResult.success) {
            testResult = runConsumerTests(consumerDir);
        } else if (!buildResult.success) {
            testResult = {success: false, error: 'Skipped (build failed)'};
        }

        consumerResults.push(buildConsumerResult(consumer, buildResult, testResult));
    }

    const summary = summarizeConsumerResults(consumerResults);

    let semanticComparison = null;
    let visualComparison = null;

    let corpusError = null;
    if (!opts.skipCorpus) {
        if (!opts.expectedDir || !opts.actualDir) {
            corpusError = 'Both expected and actual corpus directories are required';
        } else if (!fs.existsSync(opts.expectedDir) || !fs.existsSync(opts.actualDir)) {
            corpusError = 'Expected or actual corpus directory does not exist';
        } else {
            semanticComparison = runSemanticComparison(opts.expectedDir, opts.actualDir);
            visualComparison = runVisualComparison(opts.expectedDir, opts.actualDir);
        }
    }

    const corpusPassed = opts.skipCorpus
        ? true
        : corpusError === null &&
          semanticComparison !== null &&
          visualComparison !== null &&
          !semanticComparison.hasDifferences &&
          !visualComparison.hasDifferences;

    return {
        package: pkg,
        prSha: opts.prSha,
        metapackageRoot: opts.metapackageRoot,
        consumers: consumerResults,
        summary,
        semanticComparison,
        visualComparison,
        corpusError,
        corpusPassed,
        passed: summary.failed === 0 && corpusPassed,
    };
}

/**
 * Render the downstream check result as a markdown report.
 * @param {object} result - Result from runDownstreamCheck.
 * @returns {string} Markdown report.
 */
// eslint-disable-next-line complexity -- report sections mirror independent result categories.
function renderReport(result) {
    const lines = [];
    lines.push('# Downstream Check Report\n');
    lines.push(`Generated: ${new Date().toISOString()}\n`);

    lines.push('## Summary\n');
    lines.push('| Field | Value |');
    lines.push('| ----- | ----- |');
    lines.push(`| Package | \`${result.package || '—'}\` |`);
    lines.push(`| PR SHA | \`${result.prSha || '—'}\` |`);
    lines.push(`| Consumers total | ${result.summary.total} |`);
    lines.push(`| Consumers passed | ${result.summary.passed} |`);
    lines.push(`| Consumers failed | ${result.summary.failed} |`);
    lines.push(`| Corpus comparison | ${result.corpusPassed ? 'passed' : 'failed'} |`);
    lines.push(`| Overall result | ${result.passed ? '**PASSED**' : '**FAILED**'} |`);
    lines.push('');

    if (result.error) {
        lines.push('## Error\n');
        lines.push(`> ${result.error}\n`);
        return lines.join('\n');
    }

    if (result.corpusError) {
        lines.push('## Corpus Error\n');
        lines.push(`> ${result.corpusError}\n`);
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

    if (result.semanticComparison || result.visualComparison) {
        lines.push('## Corpus Comparison\n');

        if (result.semanticComparison) {
            lines.push('### Semantic (Artifact) Comparison\n');
            if (result.semanticComparison.hasDifferences) {
                lines.push('**Differences detected.**\n');
                if (result.semanticComparison.fileTreeDiff.added.length > 0) {
                    lines.push('**Added files:**');
                    for (const f of result.semanticComparison.fileTreeDiff.added)
                        lines.push(`- \`${f}\``);
                    lines.push('');
                }
                if (result.semanticComparison.fileTreeDiff.removed.length > 0) {
                    lines.push('**Removed files:**');
                    for (const f of result.semanticComparison.fileTreeDiff.removed)
                        lines.push(`- \`${f}\``);
                    lines.push('');
                }
                if (result.semanticComparison.htmlDiffs.length > 0) {
                    lines.push(
                        `**HTML diffs:** ${result.semanticComparison.htmlDiffs.length} file(s)`,
                    );
                    lines.push('');
                }
            } else {
                lines.push('No differences detected.\n');
            }
        }

        if (result.visualComparison) {
            lines.push('### Visual (SVG DOM) Comparison\n');
            if (result.visualComparison.hasDifferences) {
                lines.push('**SVG DOM differences detected.**\n');
                if (result.visualComparison.svgDiffs.length > 0) {
                    lines.push(`**SVG diffs:** ${result.visualComparison.svgDiffs.length} file(s)`);
                    for (const d of result.visualComparison.svgDiffs) {
                        lines.push(`- \`${d.file}\``);
                    }
                    lines.push('');
                }
            } else {
                lines.push('No SVG DOM differences detected.\n');
            }
        }
    }

    if (!result.passed) {
        lines.push('## CODEOWNER Review Required\n');
        lines.push(
            'Downstream check failures require human CODEOWNER review. ' +
                'The Dependabot PR must not be merged until all downstream consumers pass.',
        );
        lines.push('');
    }

    return lines.join('\n');
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

function main() {
    const args = parseArgs();
    const pkg = args.package;
    const prSha = args['pr-sha'] || null;
    const output = args.output;
    const report = args.report;

    if (!pkg) {
        console.error(
            'Usage: downstream-check.js --package <transform|components|cli> [--pr-sha <sha>] [--output <dir>] [--report <path>]',
        );
        process.exit(1);
    }

    const expectedDir = args.expected || null;
    const actualDir = args.actual || null;
    const skipBuild = args['skip-build'] === 'true';
    const skipTests = args['skip-tests'] === 'true';
    const skipCorpus = args['skip-corpus'] === 'true';

    const result = runDownstreamCheck(pkg, {
        prSha,
        metapackageRoot: args['metapackage-root'] || undefined,
        expectedDir,
        actualDir,
        skipBuild,
        skipTests,
        skipCorpus,
    });

    const md = renderReport(result);

    if (report) {
        fs.mkdirSync(path.dirname(report), {recursive: true});
        fs.writeFileSync(report, md, 'utf-8');
    }

    if (output) {
        fs.mkdirSync(output, {recursive: true});
        fs.writeFileSync(
            path.join(output, 'downstream-result.json'),
            JSON.stringify(result, null, 2) + '\n',
            'utf-8',
        );
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
    CORE_PACKAGES,
    CORE_PACKAGE_PATHS,
    DOWNSTREAM_CONSUMERS,
    isCorePackage,
    resolveDownstreamConsumers,
    resolveMetapackageRoot,
    resolvePackageDir,
    replaceSubmoduleSha,
    buildConsumer,
    runConsumerTests,
    buildTestpackCorpus,
    copyDir,
    runSemanticComparison,
    runVisualComparison,
    buildConsumerResult,
    summarizeConsumerResults,
    runDownstreamCheck,
    renderReport,
    truncate,
};
