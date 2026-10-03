#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const artifacts = require('./compare-artifacts');
const svg = require('./compare-svg-dom');

/**
 * Compare data-only HTML/Markdown/SVG evidence; never execute package code.
 * @param {string} baseline - Reference corpus directory with html/md subtrees.
 * @param {string} candidate - Candidate corpus directory with html/md subtrees.
 * @returns {object} Per-format results and the aggregate verification decision.
 */
function compareCorpus(baseline, candidate) {
    for (const root of [baseline, candidate]) {
        if (
            !artifacts
                .listFiles(path.join(root, 'html/output'))
                .some((file) => file.endsWith('.html') && !file.startsWith('_search/')) ||
            !artifacts.listFiles(path.join(root, 'md/output')).some((file) => file.endsWith('.md'))
        ) {
            throw new Error('Incomplete corpus evidence');
        }
    }
    const html = artifacts.compareArtifacts(
        path.join(baseline, 'html/output'),
        path.join(candidate, 'html/output'),
    );
    const markdown = artifacts.compareArtifacts(
        path.join(baseline, 'md/output'),
        path.join(candidate, 'md/output'),
    );
    const visual = svg.compareSvgDoms(
        path.join(baseline, 'html/output'),
        path.join(candidate, 'html/output'),
    );
    return {
        html,
        markdown,
        visual,
        passed: !html.hasDifferences && !markdown.hasDifferences && !visual.hasDifferences,
    };
}

function main() {
    const args = artifacts.parseArgs();
    if (!args.baseline || !args.candidate || !args.output)
        throw new Error('Missing corpus comparison arguments');
    fs.mkdirSync(args.output, {recursive: true});
    try {
        const result = compareCorpus(args.baseline, args.candidate);
        fs.writeFileSync(
            path.join(args.output, 'corpus-result.json'),
            JSON.stringify(result, null, 2) + '\n',
        );
        for (const [name, report] of [
            ['html', artifacts.renderReport(result.html)],
            ['markdown', artifacts.renderReport(result.markdown)],
            ['svg', svg.renderReport(result.visual)],
        ]) {
            fs.writeFileSync(path.join(args.output, `${name}-diff.md`), report);
        }
        if (!result.passed) process.exitCode = 1;
    } catch (error) {
        fs.writeFileSync(
            path.join(args.output, 'corpus-error.md'),
            `# Corpus verification failed\n\n${error.message}\n`,
        );
        throw error;
    }
}

if (require.main === module) main();
module.exports = {compareCorpus};
