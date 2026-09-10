#!/usr/bin/env node

/**
 * Compare build artifacts (file tree + normalized HTML) between expected
 * (base SHA) and actual (PR head SHA) corpus builds.
 *
 * Usage:
 *   node scripts/compare-artifacts.js \
 *     --expected artifacts/expected/output/ \
 *     --actual artifacts/actual/output/ \
 *     --report artifacts/diff.md
 *
 * The comparison covers:
 * 1. Output file tree — relative file paths that exist in one but not the other
 * 2. Normalized HTML — whitespace-collapsed, attribute-sorted HTML comparison
 * 3. Asset links — references to assets in HTML are checked for consistency
 *
 * Exits 0 when identical, 1 when differences are found.
 *
 * @module scripts/compare-artifacts
 */

'use strict';

/* eslint-disable no-console -- CLI diagnostics are part of this script's interface. */

const fs = require('fs');
const path = require('path');
const {createHash} = require('crypto');

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
 * Recursively list all files under a directory, returning relative paths.
 * @param {string} dir - Root directory.
 * @returns {string[]} Sorted array of relative file paths (POSIX separators).
 */
function listFiles(dir) {
    const result = [];
    if (!fs.existsSync(dir)) return result;
    function walk(base) {
        const entries = fs.readdirSync(base, {withFileTypes: true});
        for (const entry of entries) {
            const full = path.join(base, entry.name);
            if (entry.isDirectory()) {
                walk(full);
            } else if (entry.isFile()) {
                result.push(path.relative(dir, full).split(path.sep).join('/'));
            }
        }
    }
    walk(dir);
    return result.sort();
}

/**
 * Compute file-tree differences between expected and actual.
 * @param {string[]} expectedFiles - Sorted relative paths in expected dir.
 * @param {string[]} actualFiles - Sorted relative paths in actual dir.
 * @returns {{added: string[], removed: string[], common: string[]}}
 */
function diffFileTree(expectedFiles, actualFiles) {
    const expectedSet = new Set(expectedFiles);
    const actualSet = new Set(actualFiles);
    const added = actualFiles.filter((f) => !expectedSet.has(f));
    const removed = expectedFiles.filter((f) => !actualSet.has(f));
    const common = expectedFiles.filter((f) => actualSet.has(f));
    return {added, removed, common};
}

const DYNAMIC_BUNDLE_PATH = /(^|\/)_bundle\/\d+-[a-f0-9]{12,16}(?:\.[a-z0-9]+)*\.[a-z0-9]+$/i;
const DYNAMIC_BUNDLE_REFERENCE = String.raw`_bundle\/\d+-[a-f0-9]{12,16}(?:\.[a-z0-9]+)*\.[a-z0-9]+`;

function stripDynamicBundleReferences(content) {
    if (!new RegExp(DYNAMIC_BUNDLE_REFERENCE).test(content)) return content;

    return content
        .replace(
            new RegExp(`<script\\b[^>]*?${DYNAMIC_BUNDLE_REFERENCE}[^>]*?>\\s*<\\/script>`, 'g'),
            '',
        )
        .replace(new RegExp(`<link\\b[^>]*?${DYNAMIC_BUNDLE_REFERENCE}[^>]*?\\/?>`, 'g'), '')
        .replace(new RegExp(`\\\\?"${DYNAMIC_BUNDLE_REFERENCE}\\\\?",?`, 'g'), '')
        .replace(new RegExp(DYNAMIC_BUNDLE_REFERENCE, 'g'), '')
        .replace(/\[\s*,/g, '[')
        .replace(/,\s*\]/g, ']')
        .replace(/,\s*,/g, ',');
}

/**
 * Normalize build-specific values using the same invariants as the CLI snapshot
 * fixtures (`platformless`, `hashless`, and `bundleless`).  Keep this generic:
 * the base and head builds intentionally use different CLI manifests.
 * @param {string} content - Artifact path or textual artifact content.
 * @returns {string} Stable value for comparison.
 */
function normalizeBuildSpecificValues(content) {
    let inlineCodeIndex = 1;

    return stripDynamicBundleReferences(normalizeGeneratedReferences(content))
        .replace(/\r\n/g, '\n')
        .replace(
            /_bundle\/([a-z][a-z0-9]*)-[a-f0-9]{12,16}((?:\.[a-z0-9]+)*)\.([a-z0-9]+)/gi,
            (_match, base, suffixes, extension) => {
                const suffix = suffixes.replace(/\./g, '-');
                return `_bundle/${base}${suffix}-${extension}`;
            },
        )
        .replace(/(\/|\\)[a-z0-9]{12,16}-(index|registry|resources)\./gi, '/hash-$2.')
        .replace(/-[a-z0-9]{12,16}\./gi, '-hash.')
        .replace(
            /\bDiplodoc Platform v\d+\.\d+\.\d+(?:-[\w-]+)?\b/g,
            'Diplodoc Platform vDIPLODOC-VERSION',
        )
        .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, 'UUID')
        .replace(
            /(aria-controls=\\":term_element\\" tabindex=\\"\d+\\" id=\\")[a-zA-Z0-9]{1,10}/g,
            '$1vTERM-ID',
        )
        .replace(
            /id=\\"inline-code-id-[a-zA-Z0-9]{8}\\"/g,
            () => `id=\\"inline-code-id-${inlineCodeIndex++}\\"`,
        );
}

/**
 * Map build-specific artifact names to a stable comparison identity.
 * The search resources filename contains a build timestamp, while its contents
 * still point to the content-addressed index and registry files.
 * @param {string} file - Relative artifact path.
 * @returns {string | null} Stable relative artifact path, or null for ignored dynamic chunks.
 */
function canonicalArtifactPath(file) {
    if (DYNAMIC_BUNDLE_PATH.test(file)) return null;

    return normalizeBuildSpecificValues(file);
}

/**
 * Index original paths by their stable comparison identity.
 * @param {string[]} files - Relative artifact paths.
 * @returns {Map<string, string>} Canonical path to original path.
 */
function indexArtifactPaths(files) {
    const groups = new Map();
    for (const file of files) {
        const canonical = canonicalArtifactPath(file);
        if (canonical === null) continue;
        groups.set(canonical, [...(groups.get(canonical) || []), file]);
    }

    const result = new Map();
    for (const [canonical, originals] of groups) {
        if (originals.length === 1) {
            result.set(canonical, originals[0]);
        } else {
            // Accumulated local output may contain resources from older builds.
            // Preserve those paths rather than hiding or conflating them.
            for (const original of originals) result.set(original, original);
        }
    }
    return result;
}

/**
 * Remove build timestamps from references embedded in generated text.
 * @param {string} content - Generated text content.
 * @returns {string} Stable content for comparison.
 */
function normalizeGeneratedReferences(content) {
    return content.replace(/\b\d{13}-resources\.js\b/g, '__generated__-resources.js');
}

/**
 * Normalize HTML for comparison:
 * - Collapse whitespace runs
 * - Sort attributes within tags
 * - Remove leading/trailing whitespace per line
 * - Preserve script content so runtime changes remain visible
 * - Normalize self-closing tags
 * @param {string} html - Raw HTML content.
 * @returns {string} Normalized HTML.
 */
function normalizeHtml(html) {
    return normalizeBuildSpecificValues(html)
        .replace(/<style[\s\S]*?<\/style>/g, (m) => {
            return m.replace(/\s+/g, ' ').trim();
        })
        .replace(/\s+/g, ' ')
        .replace(/>\s+/g, '>')
        .replace(/\s+</g, '<')
        .trim()
        .replace(/<(\w+)([^>]*)>/g, (match, tag, attrs) => {
            const sortedAttrs = sortAttributes(attrs);
            return `<${tag}${sortedAttrs}>`;
        })
        .replace(/\s+\/>/g, '/>');
}

/**
 * Sort attributes within an HTML tag's attribute string.
 * @param {string} attrString - Raw attribute string (e.g. ' class="foo" id="bar"').
 * @returns {string} Sorted attribute string.
 */
function sortAttributes(attrString) {
    const attrs = [];
    const re = /\s([\w-]+)(?:=(?:"[^"]*"|'[^']*'|\S+))?/g;
    let m;
    while ((m = re.exec(attrString)) !== null) {
        attrs.push(m[0].trim());
    }
    attrs.sort();
    return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

/**
 * Compare two HTML files and return a diff description.
 * @param {string} expectedPath - Path to expected HTML file.
 * @param {string} actualPath - Path to actual HTML file.
 * @returns {{identical: boolean, diff: string[]}}
 */
function compareHtmlFile(expectedPath, actualPath) {
    const expectedRaw = fs.readFileSync(expectedPath, 'utf-8');
    const actualRaw = fs.readFileSync(actualPath, 'utf-8');
    const expectedNorm = normalizeHtml(expectedRaw);
    const actualNorm = normalizeHtml(actualRaw);

    if (expectedNorm === actualNorm) {
        return {identical: true, diff: []};
    }

    const expectedLines = expectedNorm.split(/(?=<)/);
    const actualLines = actualNorm.split(/(?=<)/);
    const maxLen = Math.max(expectedLines.length, actualLines.length);
    const diff = [];
    for (let i = 0; i < maxLen; i++) {
        if (expectedLines[i] !== actualLines[i]) {
            if (expectedLines[i]) diff.push(`- ${truncate(expectedLines[i])}`);
            if (actualLines[i]) diff.push(`+ ${truncate(actualLines[i])}`);
        }
    }
    return {identical: false, diff};
}

/**
 * Truncate a string for display in diff output.
 * @param {string} s - String to truncate.
 * @param {number} max - Maximum length (default 200).
 * @returns {string}
 */
function truncate(s, max = 200) {
    s = s.trim();
    return s.length > max ? s.slice(0, max) + '...' : s;
}

/**
 * Extract asset link references from HTML.
 * @param {string} html - Raw HTML content.
 * @returns {string[]} Array of asset paths referenced (src/href).
 */
function extractAssetLinks(html) {
    const links = [];
    const re = /(?:src|href)=["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(html)) !== null) {
        links.push(normalizeBuildSpecificValues(m[1]));
    }
    return links.sort();
}

/**
 * Compare asset links between expected and actual HTML.
 * @param {string} expectedPath - Path to expected HTML file.
 * @param {string} actualPath - Path to actual HTML file.
 * @returns {{added: string[], removed: string[]}}
 */
function compareAssetLinks(expectedPath, actualPath) {
    const expectedRaw = fs.readFileSync(expectedPath, 'utf-8');
    const actualRaw = fs.readFileSync(actualPath, 'utf-8');
    const expectedLinks = new Set(extractAssetLinks(expectedRaw));
    const actualLinks = new Set(extractAssetLinks(actualRaw));
    const added = [...actualLinks].filter((l) => !expectedLinks.has(l));
    const removed = [...expectedLinks].filter((l) => !actualLinks.has(l));
    return {added, removed};
}

function fileHash(filePath, relativePath = '') {
    const raw = fs.readFileSync(filePath);
    let content = raw;
    if (/\.(?:css|html?|js|json|svg|txt|xml|yfm)$/i.test(relativePath)) {
        content = Buffer.from(normalizeBuildSpecificValues(raw.toString('utf-8')));
    }
    return createHash('sha256').update(content).digest('hex');
}

/**
 * Compare all artifacts between expected and actual directories.
 * @param {string} expectedDir - Expected (base) output directory.
 * @param {string} actualDir - Actual (head) output directory.
 * @returns {{fileTreeDiff: object, htmlDiffs: object[], assetLinkDiffs: object[], hasDifferences: boolean}}
 */
function compareArtifacts(expectedDir, actualDir) {
    if (!fs.existsSync(expectedDir) || !fs.statSync(expectedDir).isDirectory()) {
        throw new Error(`Expected artifact directory does not exist: ${expectedDir}`);
    }
    if (!fs.existsSync(actualDir) || !fs.statSync(actualDir).isDirectory()) {
        throw new Error(`Actual artifact directory does not exist: ${actualDir}`);
    }
    const expectedFiles = indexArtifactPaths(listFiles(expectedDir));
    const actualFiles = indexArtifactPaths(listFiles(actualDir));
    const fileTreeDiff = diffFileTree(
        [...expectedFiles.keys()].sort(),
        [...actualFiles.keys()].sort(),
    );

    const htmlDiffs = [];
    const assetLinkDiffs = [];
    const contentDiffs = [];

    for (const file of fileTreeDiff.common) {
        const expectedPath = path.join(expectedDir, expectedFiles.get(file));
        const actualPath = path.join(actualDir, actualFiles.get(file));
        if (!file.endsWith('.html')) {
            // CLI snapshot fixtures deliberately exclude generated client bundles.
            // Their content hashes change on every dependency rebuild; HTML links,
            // DOM checks, and screenshots provide the useful regression signal.
            if (file.startsWith('_bundle/')) continue;
            const expectedHash = fileHash(expectedPath, file);
            const actualHash = fileHash(actualPath, file);
            if (expectedHash !== actualHash) {
                contentDiffs.push({file, expectedHash, actualHash});
            }
            continue;
        }
        const result = compareHtmlFile(expectedPath, actualPath);
        if (!result.identical) {
            htmlDiffs.push({file, diff: result.diff});
        }
        const links = compareAssetLinks(expectedPath, actualPath);
        if (links.added.length > 0 || links.removed.length > 0) {
            assetLinkDiffs.push({file, ...links});
        }
    }

    const hasDifferences =
        fileTreeDiff.added.length > 0 ||
        fileTreeDiff.removed.length > 0 ||
        htmlDiffs.length > 0 ||
        assetLinkDiffs.length > 0 ||
        contentDiffs.length > 0;

    return {fileTreeDiff, htmlDiffs, assetLinkDiffs, contentDiffs, hasDifferences};
}

/**
 * Render the comparison results as a markdown report.
 * @param {object} result - Result from compareArtifacts.
 * @returns {string} Markdown report.
 */
// eslint-disable-next-line complexity -- report sections mirror independent diff categories.
function renderReport(result) {
    const lines = [];
    const contentDiffs = result.contentDiffs || [];
    lines.push('# Golden File Comparison Report\n');
    lines.push(`Generated: ${new Date().toISOString()}\n`);

    if (!result.hasDifferences) {
        lines.push('## No differences detected\n');
        lines.push('The expected and actual builds are identical.\n');
        return lines.join('\n');
    }

    lines.push('## Differences detected\n');

    if (result.fileTreeDiff.added.length > 0 || result.fileTreeDiff.removed.length > 0) {
        lines.push('### File Tree Differences\n');
        if (result.fileTreeDiff.added.length > 0) {
            lines.push('**Added files:**\n');
            for (const f of result.fileTreeDiff.added) {
                lines.push(`- \`${f}\``);
            }
            lines.push('');
        }
        if (result.fileTreeDiff.removed.length > 0) {
            lines.push('**Removed files:**\n');
            for (const f of result.fileTreeDiff.removed) {
                lines.push(`- \`${f}\``);
            }
            lines.push('');
        }
    }

    if (result.htmlDiffs.length > 0) {
        lines.push('### HTML Differences\n');
        lines.push(`**${result.htmlDiffs.length}** file(s) with HTML content differences:\n`);
        for (const hd of result.htmlDiffs) {
            lines.push(`#### ${hd.file}\n`);
            lines.push('```diff');
            for (const line of hd.diff.slice(0, 50)) {
                lines.push(line);
            }
            if (hd.diff.length > 50) {
                lines.push(`... (${hd.diff.length - 50} more lines)`);
            }
            lines.push('```\n');
        }
    }

    if (result.assetLinkDiffs.length > 0) {
        lines.push('### Asset Link Differences\n');
        for (const al of result.assetLinkDiffs) {
            lines.push(`#### \`${al.file}\`\n`);
            if (al.added.length > 0) {
                lines.push('**Added links:**');
                for (const l of al.added) lines.push(`- \`${l}\``);
            }
            if (al.removed.length > 0) {
                lines.push('**Removed links:**');
                for (const l of al.removed) lines.push(`- \`${l}\``);
            }
            lines.push('');
        }
    }

    if (contentDiffs.length > 0) {
        lines.push('### Asset Content Differences\n');
        for (const diff of contentDiffs) {
            lines.push(`- \`${diff.file}\` (SHA-256 changed)`);
        }
        lines.push('');
    }

    lines.push('## CODEOWNER Approval Required\n');
    lines.push(
        'Any golden-file change requires separate human CODEOWNER confirmation. ' +
            'Dependabot cannot update snapshots independently.\n',
    );

    return lines.join('\n');
}

function main() {
    const args = parseArgs();
    const expected = args.expected;
    const actual = args.actual;
    const report = args.report;

    if (!expected || !actual) {
        console.error(
            'Usage: compare-artifacts.js --expected <dir> --actual <dir> --report <path>',
        );
        process.exit(1);
    }

    const result = compareArtifacts(expected, actual);
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
    listFiles,
    diffFileTree,
    canonicalArtifactPath,
    indexArtifactPaths,
    normalizeGeneratedReferences,
    normalizeBuildSpecificValues,
    normalizeHtml,
    sortAttributes,
    compareHtmlFile,
    extractAssetLinks,
    compareAssetLinks,
    fileHash,
    compareArtifacts,
    renderReport,
    truncate,
};
