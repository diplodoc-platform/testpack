#!/usr/bin/env node

'use strict';

/* eslint-disable no-console -- CLI diagnostics are part of this script's interface. */

const fs = require('node:fs');
const path = require('node:path');

const artifacts = require('./compare-artifacts');
const svg = require('./compare-svg-dom');
const downstream = require('./downstream-check');
const {compareCorpus} = require('./compare-corpus');

// This module only reads build evidence. It never imports or executes anything
// from the candidate or reference package directories.
function readEvidence(root, relative) {
    const file = path.join(root, relative);
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.size === 0 || stat.size > 1024 * 1024) {
        throw new Error(`Invalid evidence file: ${relative}`);
    }
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function validateExports(report) {
    for (const field of ['checked', 'missing']) {
        if (
            !Array.isArray(report[field]) ||
            report[field].some((entry) => typeof entry !== 'string')
        ) {
            throw new Error(`Invalid export evidence: ${field}`);
        }
    }
    if (
        report.missing.includes('package.json') ||
        report.missing.some((entry) => !report.checked.includes(entry))
    ) {
        throw new Error('Incomplete export evidence');
    }
    if (report.ok !== (report.missing.length === 0))
        throw new Error('Inconsistent export evidence');
    return report;
}

function compareExports(baseline, candidate) {
    validateExports(baseline);
    validateExports(candidate);
    return {newMissing: candidate.missing.filter((target) => !baseline.missing.includes(target))};
}

function validateConsumers(report, repository) {
    if (report.package !== repository || report.error || !Array.isArray(report.consumers)) {
        throw new Error('Incomplete downstream evidence');
    }
    const expected = downstream.resolveDownstreamConsumers(repository).slice().sort();
    const actual = report.consumers.map((entry) => entry.consumer).sort();
    if (JSON.stringify(expected) !== JSON.stringify(actual))
        throw new Error('Missing or duplicate consumers');
    for (const entry of report.consumers) {
        if (
            typeof entry.build?.success !== 'boolean' ||
            typeof entry.test?.success !== 'boolean' ||
            entry.passed !== (entry.build.success && entry.test.success)
        ) {
            throw new Error('Invalid consumer outcome');
        }
        // Skipped checks are not successful evidence, even when both builds skip.
        if (entry.build.skipped || entry.test.skipped)
            throw new Error('Skipped consumer verification');
    }
    return report;
}

function compareVerification(repository, baselineDir, candidateDir) {
    if (!downstream.isSupportedPackage(repository)) throw new Error('Unsupported repository');
    const exports = {};
    for (const scope of ['standalone-', '']) {
        const baseline = readEvidence(baselineDir, `base-${scope}package-targets.json`);
        const candidate = readEvidence(candidateDir, `candidate-${scope}package-targets.json`);
        exports[scope || 'workspace'] = compareExports(baseline, candidate);
    }
    const baselineConsumers = validateConsumers(
        readEvidence(baselineDir, 'base-downstream/downstream-result.json'),
        repository,
    );
    const candidateConsumers = validateConsumers(
        readEvidence(candidateDir, 'candidate-downstream/downstream-result.json'),
        repository,
    );
    const consumers = downstream.compareConsumerResults(
        candidateConsumers.consumers,
        baselineConsumers,
    );
    const {html, markdown, visual} = compareCorpus(
        path.join(baselineDir, 'expected'),
        path.join(candidateDir, 'actual'),
    );
    const passed =
        Object.values(exports).every((report) => report.newMissing.length === 0) &&
        consumers.regressions === 0 &&
        !html.hasDifferences &&
        !markdown.hasDifferences &&
        !visual.hasDifferences;
    return {repository, exports, consumers, html, markdown, visual, passed};
}

function main() {
    const args = downstream.parseArgs();
    if (!args.package || !args.baseline || !args.candidate || !args.output)
        throw new Error('Missing comparison arguments');
    fs.mkdirSync(args.output, {recursive: true});
    try {
        const result = compareVerification(args.package, args.baseline, args.candidate);
        fs.writeFileSync(
            path.join(args.output, 'verification-result.json'),
            JSON.stringify(result, null, 2) + '\n',
        );
        const report = [
            `# Dependency verification: ${result.passed ? 'PASS' : 'FAIL'}`,
            'Reference and candidate were built on isolated runners; this job only reads evidence.',
            `## Package exports\n\n\`\`\`json\n${JSON.stringify(result.exports, null, 2)}\n\`\`\``,
            `## Consumers\n\n\`\`\`json\n${JSON.stringify(result.consumers, null, 2)}\n\`\`\``,
            '## HTML',
            artifacts.renderReport(result.html),
            '## Markdown',
            artifacts.renderReport(result.markdown),
            '## SVG',
            svg.renderReport(result.visual),
        ].join('\n\n');
        fs.writeFileSync(path.join(args.output, 'verification-report.md'), report);
        if (!result.passed) process.exitCode = 1;
    } catch (error) {
        fs.writeFileSync(
            path.join(args.output, 'verification-report.md'),
            `# Dependency verification: FAIL\n\nIncomplete or invalid evidence: ${error.message}\n`,
        );
        throw error;
    }
}

if (require.main === module) main();
module.exports = {
    readEvidence,
    validateExports,
    compareExports,
    validateConsumers,
    compareVerification,
};
