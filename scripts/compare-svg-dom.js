#!/usr/bin/env node

/**
 * Compare SVG DOM structure between expected (base SHA) and actual
 * (PR head SHA) corpus builds.
 *
 * Usage:
 *   node scripts/compare-svg-dom.js \
 *     --expected artifacts/expected/output/ \
 *     --actual artifacts/actual/output/ \
 *     --report artifacts/svg-diff.md
 *
 * The comparison covers critical SVG attributes:
 *   - id, href, viewBox
 *   - masks, gradients (linearGradient, radialGradient)
 *   - Element structure (tag names and nesting)
 *
 * Exits 0 when identical, 1 when differences are found.
 *
 * @module scripts/compare-svg-dom
 */

'use strict';

/* eslint-disable no-console -- CLI diagnostics are part of this script's interface. */

const fs = require('fs');
const path = require('path');

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
 * Recursively list all SVG files under a directory.
 * @param {string} dir - Root directory.
 * @returns {string[]} Sorted array of relative file paths.
 */
function listSvgFiles(dir) {
    const result = [];
    if (!fs.existsSync(dir)) return result;
    function walk(base) {
        const entries = fs.readdirSync(base, {withFileTypes: true});
        for (const entry of entries) {
            const full = path.join(base, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else if (entry.isFile() && entry.name.endsWith('.svg')) {
                result.push(path.relative(dir, full).split(path.sep).join('/'));
            }
        }
    }
    walk(dir);
    return result.sort();
}

/**
 * Critical SVG attributes to extract and compare.
 */
const CRITICAL_ATTRS = [
    'id',
    'href',
    'viewBox',
    'mask',
    'maskUnits',
    'maskContentUnits',
    'fill',
    'stroke',
    'gradientUnits',
    'gradientTransform',
    'x1',
    'y1',
    'x2',
    'y2',
    'cx',
    'cy',
    'r',
    'fx',
    'fy',
    'filter',
    'filterUnits',
    'patternUnits',
    'patternTransform',
    'clipPath',
    'clipPathUnits',
];

/**
 * SVG element types that are critical for rendering correctness.
 */
const CRITICAL_ELEMENTS = new Set([
    'svg',
    'defs',
    'linearGradient',
    'radialGradient',
    'stop',
    'mask',
    'clipPath',
    'pattern',
    'filter',
    'feGaussianBlur',
    'feOffset',
    'feMerge',
    'feMergeNode',
    'path',
    'rect',
    'circle',
    'ellipse',
    'line',
    'polyline',
    'polygon',
    'g',
    'use',
    'image',
    'text',
    'tspan',
    'marker',
    'symbol',
]);

/**
 * Extract a normalized representation of SVG DOM from raw SVG content.
 * This is a lightweight string-based parser that extracts the critical
 * structure without requiring a full DOM parser.
 * @param {string} svgContent - Raw SVG file content.
 * @returns {object} Normalized SVG structure.
 */
// eslint-disable-next-line complexity -- token handling is intentionally centralized.
function extractSvgStructure(svgContent) {
    const elements = [];
    const gradients = [];
    const masks = [];
    const links = [];

    let viewBox = null;
    let depth = 0;
    let charIndex = 0;

    while (charIndex < svgContent.length) {
        const lt = svgContent.indexOf('<', charIndex);
        if (lt === -1) break;

        const gt = svgContent.indexOf('>', lt);
        if (gt === -1) break;

        if (svgContent[lt + 1] === '/') {
            depth = Math.max(0, depth - 1);
            charIndex = gt + 1;
            continue;
        }
        if (svgContent[lt + 1] === '?' || svgContent.startsWith('<!--', lt)) {
            charIndex = gt + 1;
            continue;
        }

        const tagContent = svgContent.slice(lt + 1, gt);
        const isSelfClosing = tagContent.endsWith('/');
        const tagNameMatch = tagContent.match(/^([\w-]+)/);
        if (!tagNameMatch) {
            charIndex = gt + 1;
            continue;
        }

        const tagName = tagNameMatch[1];

        if (CRITICAL_ELEMENTS.has(tagName)) {
            const attrs = extractAttrs(tagContent);
            const criticalAttrs = {};
            for (const attr of CRITICAL_ATTRS) {
                if (attrs[attr] !== undefined) {
                    criticalAttrs[attr] = attrs[attr];
                }
            }

            elements.push({
                tag: tagName,
                depth,
                attrs: criticalAttrs,
            });

            if (tagName === 'linearGradient' || tagName === 'radialGradient') {
                gradients.push({tag: tagName, ...criticalAttrs});
            }
            if (tagName === 'mask') {
                masks.push({tag: tagName, ...criticalAttrs});
            }
            if ((tagName === 'use' || tagName === 'image' || tagName === 'a') && attrs.href) {
                links.push({tag: tagName, href: attrs.href});
            }
            if (tagName === 'svg' && attrs.viewBox) {
                viewBox = attrs.viewBox;
            }
        }

        if (!isSelfClosing) {
            depth++;
        }
        charIndex = gt + 1;
    }

    return {elements, gradients, masks, links, viewBox};
}

/**
 * Extract attributes from a tag string.
 * @param {string} tagContent - Content between < and >.
 * @returns {Record<string, string>}
 */
function extractAttrs(tagContent) {
    const attrs = {};
    const re = /([\w-:]+)\s*=\s*"([^"]*)"/g;
    let m;
    while ((m = re.exec(tagContent)) !== null) {
        attrs[m[1]] = m[2];
    }
    const re2 = /([\w-:]+)\s*=\s*'([^']*)'/g;
    while ((m = re2.exec(tagContent)) !== null) {
        attrs[m[1]] = m[2];
    }
    return attrs;
}

/**
 * Compare two SVG structures and return differences.
 * @param {object} expected - Expected SVG structure.
 * @param {object} actual - Actual SVG structure.
 * @returns {{identical: boolean, diffs: string[]}}
 */
function compareSvgStructure(expected, actual) {
    const diffs = [];

    if (expected.viewBox !== actual.viewBox) {
        diffs.push(`viewBox: expected "${expected.viewBox}", got "${actual.viewBox}"`);
    }

    if (expected.elements.length !== actual.elements.length) {
        diffs.push(
            `element count: expected ${expected.elements.length}, got ${actual.elements.length}`,
        );
    }

    const maxLen = Math.max(expected.elements.length, actual.elements.length);
    for (let i = 0; i < maxLen; i++) {
        const expEl = expected.elements[i];
        const actEl = actual.elements[i];
        if (!expEl) {
            diffs.push(`extra element at index ${i}: <${actEl.tag}>`);
            continue;
        }
        if (!actEl) {
            diffs.push(`missing element at index ${i}: <${expEl.tag}>`);
            continue;
        }
        if (expEl.tag !== actEl.tag) {
            diffs.push(`element ${i} tag mismatch: expected <${expEl.tag}>, got <${actEl.tag}>`);
            continue;
        }
        if (expEl.depth !== actEl.depth) {
            diffs.push(
                `element ${i} <${expEl.tag}> depth: expected ${expEl.depth}, got ${actEl.depth}`,
            );
        }
        const expAttrs = Object.keys(expEl.attrs).sort();
        const actAttrs = Object.keys(actEl.attrs).sort();
        for (const key of new Set([...expAttrs, ...actAttrs])) {
            if (expEl.attrs[key] !== actEl.attrs[key]) {
                diffs.push(
                    `element ${i} <${expEl.tag}> attr "${key}": ` +
                        `expected "${expEl.attrs[key] ?? '(missing)'}", ` +
                        `got "${actEl.attrs[key] ?? '(missing)'}"`,
                );
            }
        }
    }

    if (expected.gradients.length !== actual.gradients.length) {
        diffs.push(
            `gradient count: expected ${expected.gradients.length}, got ${actual.gradients.length}`,
        );
    }

    if (expected.masks.length !== actual.masks.length) {
        diffs.push(`mask count: expected ${expected.masks.length}, got ${actual.masks.length}`);
    }

    if (expected.links.length !== actual.links.length) {
        diffs.push(`link count: expected ${expected.links.length}, got ${actual.links.length}`);
    }

    return {
        identical: diffs.length === 0,
        diffs,
    };
}

/**
 * Collect standalone SVG files and inline SVG fragments from an output tree.
 * @param {string} dir - Output directory.
 * @returns {Map<string, string>} Source id to SVG source.
 */
function collectSvgSources(dir) {
    const sources = new Map();
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return sources;
    function walk(base) {
        for (const entry of fs.readdirSync(base, {withFileTypes: true})) {
            const full = path.join(base, entry.name);
            if (entry.isDirectory()) {
                walk(full);
                continue;
            }
            if (!entry.isFile()) continue;
            const relative = path.relative(dir, full).split(path.sep).join('/');
            if (entry.name.endsWith('.svg')) {
                sources.set(relative, fs.readFileSync(full, 'utf-8'));
            } else if (entry.name.endsWith('.html')) {
                const html = fs.readFileSync(full, 'utf-8');
                const matches = html.match(/<svg\b[\s\S]*?<\/svg>/gi) || [];
                matches.forEach((svg, index) =>
                    sources.set(`${relative}#inline-svg-${index}`, svg),
                );
            }
        }
    }
    walk(dir);
    return sources;
}

function compareSvgDoms(expectedDir, actualDir) {
    if (!fs.existsSync(expectedDir) || !fs.statSync(expectedDir).isDirectory()) {
        throw new Error(`Expected SVG artifact directory does not exist: ${expectedDir}`);
    }
    if (!fs.existsSync(actualDir) || !fs.statSync(actualDir).isDirectory()) {
        throw new Error(`Actual SVG artifact directory does not exist: ${actualDir}`);
    }
    const expectedSources = collectSvgSources(expectedDir);
    const actualSources = collectSvgSources(actualDir);
    const expectedFiles = [...expectedSources.keys()].sort();
    const actualFiles = [...actualSources.keys()].sort();
    const expectedSet = new Set(expectedFiles);
    const actualSet = new Set(actualFiles);

    const addedFiles = actualFiles.filter((f) => !expectedSet.has(f));
    const removedFiles = expectedFiles.filter((f) => !actualSet.has(f));
    const commonFiles = expectedFiles.filter((f) => actualSet.has(f));

    const svgDiffs = [];
    for (const file of commonFiles) {
        const expectedContent = expectedSources.get(file);
        const actualContent = actualSources.get(file);
        const expectedStruct = extractSvgStructure(expectedContent);
        const actualStruct = extractSvgStructure(actualContent);
        const result = compareSvgStructure(expectedStruct, actualStruct);
        if (!result.identical) {
            svgDiffs.push({file, diffs: result.diffs});
        }
    }

    const hasDifferences = addedFiles.length > 0 || removedFiles.length > 0 || svgDiffs.length > 0;

    return {svgDiffs, addedFiles, removedFiles, hasDifferences};
}

/**
 * Render SVG comparison results as a markdown report.
 * @param {object} result - Result from compareSvgDoms.
 * @returns {string} Markdown report.
 */
function renderReport(result) {
    const lines = [];
    lines.push('# SVG DOM Comparison Report\n');
    lines.push(`Generated: ${new Date().toISOString()}\n`);

    if (!result.hasDifferences) {
        lines.push('## No differences detected\n');
        lines.push('All SVG files are structurally identical.\n');
        return lines.join('\n');
    }

    lines.push('## Differences detected\n');

    if (result.addedFiles.length > 0) {
        lines.push('### Added SVG files\n');
        for (const f of result.addedFiles) lines.push('- ' + f);
        lines.push('');
    }

    if (result.removedFiles.length > 0) {
        lines.push('### Removed SVG files\n');
        for (const f of result.removedFiles) lines.push('- ' + f);
        lines.push('');
    }

    if (result.svgDiffs.length > 0) {
        lines.push('### SVG DOM Differences\n');
        for (const d of result.svgDiffs) {
            lines.push('#### ' + d.file + '\n');
            lines.push('```diff');
            for (const diff of d.diffs) {
                lines.push('- ' + diff);
            }
            lines.push('```');
            lines.push('');
        }
    }

    lines.push('## CODEOWNER Approval Required\n');
    lines.push(
        'SVG DOM changes (id, href, viewBox, masks, gradients) require ' +
            'separate human CODEOWNER confirmation.\n',
    );

    return lines.join('\n');
}

function main() {
    const args = parseArgs();
    const expected = args.expected;
    const actual = args.actual;
    const report = args.report;

    if (!expected || !actual) {
        console.error('Usage: compare-svg-dom.js --expected <dir> --actual <dir> --report <path>');
        process.exit(1);
    }

    const result = compareSvgDoms(expected, actual);
    const md = renderReport(result);

    if (report) {
        fs.mkdirSync(path.dirname(report), {recursive: true});
        fs.writeFileSync(report, md, 'utf-8');
    }

    console.log(md);

    if (result.hasDifferences) {
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    parseArgs,
    listSvgFiles,
    collectSvgSources,
    extractAttrs,
    extractSvgStructure,
    compareSvgStructure,
    compareSvgDoms,
    renderReport,
    CRITICAL_ATTRS,
    CRITICAL_ELEMENTS,
};
