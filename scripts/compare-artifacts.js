#!/usr/bin/env node

/**
 * Compare build artifacts (file tree + normalized HTML/Markdown) between expected
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
 * 3. Normalized Markdown and other text artifacts — content and readable diffs
 * 4. Asset links — references to assets in HTML are checked for consistency
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

const DYNAMIC_BUNDLE_REFERENCE = String.raw`_bundle\/\d+-[a-f0-9]{12,16}(?:\.[a-z0-9]+)*\.[a-z0-9]+`;
const TEXT_ARTIFACT_PATH = /\.(?:css|html?|js|json|md|svg|txt|xml|ya?ml|yfm)$/i;
const READABLE_DIFF_PATH = /\.(?:css|js|json|md|svg|txt|ya?ml|yfm)$/i;

function normalizeDynamicBundleReferences(content) {
    // Preserve chunk identity, references and tag attributes. Only the build hash
    // is nondeterministic; removing tags or entire files hides runtime changes.
    return content.replace(new RegExp(DYNAMIC_BUNDLE_REFERENCE, 'gi'), (reference) =>
        reference.replace(/-[a-f0-9]{12,16}(?=\.)/i, '-hash'),
    );
}

/**
 * Normalize build-specific values using the same invariants as the CLI snapshot
 * fixtures (`platformless` and `hashless`). Keep runtime bundle contents and
 * references comparable rather than adopting the snapshot-only `bundleless`:
 * the base and head builds intentionally use different CLI manifests.
 * @param {string} content - Artifact path or textual artifact content.
 * @returns {string} Stable value for comparison.
 */
function normalizeBuildSpecificValues(content) {
    let inlineCodeIndex = 1;
    const runtimeIds = new Map();
    const runtimeIdCounters = new Map();

    return normalizeDynamicBundleReferences(normalizeGeneratedReferences(content))
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
        .replace(/\b(rnd|svg)-[a-z0-9]{3,8}__/gi, 'rnd-hash__')
        .replace(
            /\bDiplodoc Platform v\d+\.\d+\.\d+(?:-[\w-]+)?\b/g,
            'Diplodoc Platform vDIPLODOC-VERSION',
        )
        .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, 'UUID')
        .replace(
            /\b(defaultTabsGroup|regular|radio|dropdown|accordion|heading-section)-[a-z0-9]{8}\b/gi,
            (value, prefix) => {
                if (!runtimeIds.has(value)) {
                    const index = (runtimeIdCounters.get(prefix) || 0) + 1;
                    runtimeIdCounters.set(prefix, index);
                    runtimeIds.set(value, `${prefix}-RUNTIME-ID-${index}`);
                }
                return runtimeIds.get(value);
            },
        )
        .replace(
            /(aria-controls=\\":term_element\\" tabindex=\\"\d+\\" id=\\")[a-zA-Z0-9]{1,10}/g,
            '$1vTERM-ID',
        )
        .replace(
            /(aria-controls=\\":([a-zA-Z0-9-]+)_element\\" tabindex=\\"\d+\\" id=\\"\2-)[a-zA-Z0-9]{8}/g,
            '$1TERM-ID',
        )
        .replace(
            /id=\\"inline-code-id-[a-zA-Z0-9]{8}\\"/g,
            () => `id=\\"inline-code-id-${inlineCodeIndex++}\\"`,
        );
}

/**
 * Normalize diagnostic-only values in generated Markdown build metadata.
 * Structural fields and counters remain comparable, while timestamps, paths,
 * timings, byte sizes, hashes, and host details do not create false diffs.
 * @param {string} content - JSON artifact content.
 * @param {string} relativePath - Artifact path.
 * @returns {string} Stable JSON or the original content when it cannot be parsed.
 */
function normalizeGeneratedJson(content, relativePath) {
    if (relativePath !== 'yfm-build-stats.json' && relativePath !== 'yfm-build-content.json') {
        return content;
    }

    try {
        const value = JSON.parse(content);
        if (relativePath === 'yfm-build-stats.json') {
            if (value.cli) {
                value.cli = {
                    ...value.cli,
                    version: 'DIPLODOC-VERSION',
                    node: 'NODE-VERSION',
                    platform: 'PLATFORM',
                    arch: 'ARCH',
                    osRelease: 'OS-RELEASE',
                };
            }
            if (value.build) {
                value.build.startedAt = 'TIMESTAMP';
                value.build.finishedAt = 'TIMESTAMP';
                value.build.durationMs = 0;
                value.build.phasesMs = Object.fromEntries(
                    Object.keys(value.build.phasesMs || {}).map((key) => [key, 0]),
                );
                value.build.inputDir = 'INPUT-DIR';
                value.build.outputDir = 'OUTPUT-DIR';
                value.build.memoryUsageMb = 0;
            }
            if (value.counters) value.counters.contentBytes = 0;
            if (value.output) {
                value.output.totalBytes = 0;
                value.output.bytesByExtension = Object.fromEntries(
                    Object.keys(value.output.bytesByExtension || {}).map((key) => [key, 0]),
                );
            }
        } else {
            for (const entry of Object.values(value.contentHashes || {})) {
                entry.hash = 'sha256-HASH';
                entry.size = 0;
            }
        }
        return JSON.stringify(sortJsonKeys(value), null, 2);
    } catch {
        return content;
    }
}

/**
 * Recursively sort JSON object keys so concurrent build insertion order does
 * not become a semantic corpus difference.
 * @param {unknown} value - Parsed JSON value.
 * @returns {unknown} Value with recursively sorted object keys.
 */
function sortJsonKeys(value) {
    if (Array.isArray(value)) return value.map(sortJsonKeys);
    if (value === null || typeof value !== 'object') return value;

    return Object.fromEntries(
        Object.entries(value)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, child]) => [key, sortJsonKeys(child)]),
    );
}

/**
 * Normalize a textual artifact using the same build invariants for both HTML
 * and Markdown corpus output.
 * @param {string} content - Raw textual artifact.
 * @param {string} [relativePath=''] - Artifact path.
 * @returns {string} Stable content for comparison.
 */
function normalizeArtifactContent(content, relativePath = '') {
    return normalizeGeneratedJson(
        normalizeBuildSpecificValues(normalizeSearchArtifact(content, relativePath)),
        relativePath,
    );
}

/**
 * Normalize search data without executing JavaScript or discarding search behavior.
 * @param {string} content - Raw generated script.
 * @param {string} relativePath - Corpus-relative script path.
 * @returns {string} Canonical data assignment or the unchanged unknown script.
 */
function normalizeSearchArtifact(content, relativePath) {
    if (!/^_search\/[^/]+\/(?:hash|[a-f0-9]{12,16})-(?:index|registry)\.js$/i.test(relativePath))
        return content;
    const assignment = content.match(/^(self\.(?:registry|index)\s*=\s*)([\s\S]*?)(;?\s*)$/);
    if (!assignment) return content;
    try {
        const value = JSON.parse(assignment[2]);
        if (assignment[1].startsWith('self.index') && value.version === '2.3.9') {
            const terms = value.invertedIndex
                .slice()
                .sort(([left], [right]) => left.localeCompare(right));
            const ids = new Map();
            terms.forEach(([, data], id) => {
                if (!Number.isSafeInteger(data._index) || ids.has(data._index))
                    throw new Error('Invalid search term identity');
                ids.set(data._index, id);
            });
            value.invertedIndex = terms.map(([term, data], id) => [term, {...data, _index: id}]);
            value.fieldVectors = value.fieldVectors
                .map(([field, vector]) => {
                    if (!Array.isArray(vector) || vector.length % 2)
                        throw new Error('Invalid search vector');
                    const pairs = [];
                    const seen = new Set();
                    for (let index = 0; index < vector.length; index += 2) {
                        if (!ids.has(vector[index]) || seen.has(vector[index]))
                            throw new Error('Unknown search term');
                        seen.add(vector[index]);
                        pairs.push([ids.get(vector[index]), vector[index + 1]]);
                    }
                    return [field, pairs.sort(([left], [right]) => left - right).flat()];
                })
                .sort(([left], [right]) => left.localeCompare(right));
        }
        return assignment[1] + JSON.stringify(sortJsonKeys(value)) + assignment[3];
    } catch {
        // Unknown formats, malformed data or executable tails are compared verbatim.
        return content;
    }
}

/**
 * Map build-specific artifact names to a stable comparison identity.
 * The search resources filename contains a build timestamp, while its contents
 * still point to the content-addressed index and registry files.
 * @param {string} file - Relative artifact path.
 * @returns {string} Stable relative artifact path, including runtime chunks.
 */
function canonicalArtifactPath(file) {
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
    return normalizeArtifactContent(html)
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
 * @returns {{identical: boolean, diff: string[], stateDiffs: object[]}}
 */
function compareHtmlFile(expectedPath, actualPath) {
    const expectedRaw = fs.readFileSync(expectedPath, 'utf-8');
    const actualRaw = fs.readFileSync(actualPath, 'utf-8');
    const expectedNorm = normalizeHtml(expectedRaw);
    const actualNorm = normalizeHtml(actualRaw);

    if (expectedNorm === actualNorm) {
        return {identical: true, diff: [], stateDiffs: []};
    }

    const expectedLines = expectedNorm.split(/(?=<)/);
    const actualLines = actualNorm.split(/(?=<)/);
    const maxLen = Math.max(expectedLines.length, actualLines.length);
    const diff = [];
    for (let i = 0; i < maxLen; i++) {
        if (expectedLines[i] !== actualLines[i]) {
            const [expectedExcerpt, actualExcerpt] = contextualDiff(
                expectedLines[i] || '',
                actualLines[i] || '',
            );
            if (expectedLines[i]) diff.push(`- ${expectedExcerpt}`);
            if (actualLines[i]) diff.push(`+ ${actualExcerpt}`);
        }
    }
    return {
        identical: false,
        diff,
        stateDiffs: compareDiplodocState(expectedNorm, actualNorm),
    };
}

/**
 * Return compact excerpts around the first and last changed characters.
 * @param {string} expected - Expected value.
 * @param {string} actual - Actual value.
 * @param {number} max - Maximum excerpt length.
 * @returns {[string, string]} Expected and actual excerpts.
 */
function contextualDiff(expected, actual, max = 240) {
    let prefix = 0;
    while (
        prefix < expected.length &&
        prefix < actual.length &&
        expected[prefix] === actual[prefix]
    ) {
        prefix++;
    }

    let suffix = 0;
    while (
        suffix < expected.length - prefix &&
        suffix < actual.length - prefix &&
        expected[expected.length - 1 - suffix] === actual[actual.length - 1 - suffix]
    ) {
        suffix++;
    }

    return [
        diffExcerpt(expected, prefix, expected.length - suffix, max),
        diffExcerpt(actual, prefix, actual.length - suffix, max),
    ];
}

function diffExcerpt(value, changeStart, changeEnd, max) {
    const context = 70;
    const start = Math.max(0, changeStart - context);
    const end = Math.min(value.length, Math.max(changeEnd + context, changeStart + context));
    const segment = value.slice(start, end);
    const leading = start > 0 ? '…' : '';
    const trailing = end < value.length ? '…' : '';

    if (segment.length <= max) return `${leading}${segment}${trailing}`.trim();

    const edge = Math.floor((max - 30) / 2);
    const omitted = segment.length - edge * 2;
    return `${leading}${segment.slice(0, edge)}…[${omitted} chars]…${segment.slice(-edge)}${trailing}`.trim();
}

function extractDiplodocState(html) {
    const match = html.match(/<script\b[^>]*\bid=["']diplodoc-state["'][^>]*>([\s\S]*?)<\/script>/);
    if (!match) return undefined;

    try {
        return JSON.parse(match[1]);
    } catch {
        return undefined;
    }
}

function compareDiplodocState(expectedHtml, actualHtml) {
    const expected = extractDiplodocState(expectedHtml);
    const actual = extractDiplodocState(actualHtml);
    if (expected === undefined || actual === undefined) return [];

    const result = [];
    collectJsonDiffs(expected, actual, '$', result);
    return result;
}

// eslint-disable-next-line complexity -- recursive JSON comparison handles each value kind explicitly.
function collectJsonDiffs(expected, actual, jsonPath, result) {
    if (JSON.stringify(expected) === JSON.stringify(actual)) return;

    const expectedObject = expected !== null && typeof expected === 'object';
    const actualObject = actual !== null && typeof actual === 'object';
    if (!expectedObject || !actualObject || Array.isArray(expected) || Array.isArray(actual)) {
        result.push({path: jsonPath, expected, actual});
        return;
    }

    const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    for (const key of keys) {
        collectJsonDiffs(expected[key], actual[key], `${jsonPath}.${key}`, result);
    }
}

function formatJsonValue(value) {
    if (value === undefined) return '`<missing>`';
    if (Array.isArray(value) && value.length > 6) {
        return `\`${truncate(JSON.stringify(value.slice(0, 3)), 140)} … (${value.length} items)\``;
    }

    return `\`${truncate(JSON.stringify(value), 180)}\``;
}

function renderStateDiffs(stateDiffs) {
    if (!stateDiffs || stateDiffs.length === 0) return [];

    const lines = ['**Structured `diplodoc-state` changes:**', ''];
    for (const diff of stateDiffs) {
        if (typeof diff.expected === 'string' && typeof diff.actual === 'string') {
            const [expectedExcerpt, actualExcerpt] = contextualDiff(
                diff.expected,
                diff.actual,
                320,
            );
            lines.push(
                `- \`${diff.path}\`:`,
                '  ```diff',
                `  - ${expectedExcerpt}`,
                `  + ${actualExcerpt}`,
                '  ```',
            );
        } else {
            lines.push(
                `- \`${diff.path}\`: ${formatJsonValue(diff.expected)} → ${formatJsonValue(diff.actual)}`,
            );
        }
    }
    lines.push('');
    return lines;
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

/**
 * Compare normalized text and return a compact diff around the changed lines.
 * @param {string} expectedPath - Expected artifact path.
 * @param {string} actualPath - Actual artifact path.
 * @param {string} relativePath - Relative artifact path.
 * @returns {string[]} Readable diff lines.
 */
function compareTextFile(expectedPath, actualPath, relativePath) {
    const expected = normalizeArtifactContent(fs.readFileSync(expectedPath, 'utf-8'), relativePath);
    const actual = normalizeArtifactContent(fs.readFileSync(actualPath, 'utf-8'), relativePath);
    if (expected === actual) return [];

    const expectedLines = expected.split('\n');
    const actualLines = actual.split('\n');
    let prefix = 0;
    while (
        prefix < expectedLines.length &&
        prefix < actualLines.length &&
        expectedLines[prefix] === actualLines[prefix]
    ) {
        prefix++;
    }

    let suffix = 0;
    while (
        suffix < expectedLines.length - prefix &&
        suffix < actualLines.length - prefix &&
        expectedLines[expectedLines.length - 1 - suffix] ===
            actualLines[actualLines.length - 1 - suffix]
    ) {
        suffix++;
    }

    const expectedChanged = expectedLines.slice(prefix, expectedLines.length - suffix).join('\n');
    const actualChanged = actualLines.slice(prefix, actualLines.length - suffix).join('\n');
    const [expectedExcerpt, actualExcerpt] = contextualDiff(expectedChanged, actualChanged, 1200);
    return [`@@ line ${prefix + 1} @@`, `- ${expectedExcerpt}`, `+ ${actualExcerpt}`];
}

function fileHash(filePath, relativePath = '') {
    const raw = fs.readFileSync(filePath);
    let content = raw;
    if (TEXT_ARTIFACT_PATH.test(relativePath)) {
        content = Buffer.from(normalizeArtifactContent(raw.toString('utf-8'), relativePath));
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
            const expectedHash = fileHash(expectedPath, expectedFiles.get(file));
            const actualHash = fileHash(actualPath, actualFiles.get(file));
            if (expectedHash !== actualHash) {
                const diff = READABLE_DIFF_PATH.test(expectedFiles.get(file))
                    ? compareTextFile(expectedPath, actualPath, file)
                    : [];
                contentDiffs.push({file, expectedHash, actualHash, diff});
            }
            continue;
        }
        const result = compareHtmlFile(expectedPath, actualPath);
        if (!result.identical) {
            htmlDiffs.push({file, diff: result.diff, stateDiffs: result.stateDiffs});
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
            lines.push(...renderStateDiffs(hd.stateDiffs));
            lines.push('**Contextual HTML diff:**', '');
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
            if (diff.diff && diff.diff.length > 0) {
                lines.push('', '  ```diff');
                for (const line of diff.diff) lines.push(`  ${line}`);
                lines.push('  ```');
            }
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
    normalizeGeneratedJson,
    sortJsonKeys,
    normalizeArtifactContent,
    normalizeSearchArtifact,
    normalizeHtml,
    contextualDiff,
    compareDiplodocState,
    renderStateDiffs,
    sortAttributes,
    compareHtmlFile,
    extractAssetLinks,
    compareAssetLinks,
    compareTextFile,
    fileHash,
    compareArtifacts,
    renderReport,
    truncate,
};
