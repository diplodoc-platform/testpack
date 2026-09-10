import {execSync} from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {expect, test} from '@playwright/test';

/* eslint-disable @typescript-eslint/no-require-imports */
const compareArtifacts = require('../../../scripts/compare-artifacts.js');
const compareSvgDom = require('../../../scripts/compare-svg-dom.js');
/* eslint-enable @typescript-eslint/no-require-imports */

const DOCS_OUTPUT = path.join(__dirname, '..', '..', '..', 'docs', 'output');

test.describe('Golden File Comparison', () => {
    test.describe('compare-artifacts — normalizeHtml', () => {
        test('should collapse whitespace', () => {
            const input = '<div>\n  <p>  hello  world  </p>\n</div>';
            const result = compareArtifacts.normalizeHtml(input);
            expect(result).toBe('<div><p>hello world</p></div>');
        });

        test('should sort attributes', () => {
            const input = '<div z="1" a="2" m="3">text</div>';
            const result = compareArtifacts.normalizeHtml(input);
            expect(result).toContain('a="2"');
            expect(result).toContain('m="3"');
            expect(result).toContain('z="1"');
            const aIdx = result.indexOf('a=');
            const mIdx = result.indexOf('m=');
            const zIdx = result.indexOf('z=');
            expect(aIdx).toBeLessThan(mIdx);
            expect(mIdx).toBeLessThan(zIdx);
        });

        test('should preserve script content so runtime changes are detected', () => {
            const input = '<script>var x = 12345;</script><p>text</p>';
            const result = compareArtifacts.normalizeHtml(input);
            expect(result).toContain('var x = 12345;');
        });

        test('should collapse style whitespace', () => {
            const input = '<style>\n  .foo {\n    color: red;\n  }\n</style>';
            const result = compareArtifacts.normalizeHtml(input);
            expect(result).not.toContain('\n  ');
        });

        test('should be idempotent', () => {
            const input = '<div class="a" id="b">text</div>';
            const once = compareArtifacts.normalizeHtml(input);
            const twice = compareArtifacts.normalizeHtml(once);
            expect(once).toBe(twice);
        });
    });

    test.describe('compare-artifacts — sortAttributes', () => {
        test('should sort attributes alphabetically', () => {
            const result = compareArtifacts.sortAttributes(' class="foo" id="bar"');
            expect(result).toBe(' class="foo" id="bar"');
        });

        test('should sort reversed attributes', () => {
            const result = compareArtifacts.sortAttributes(' id="bar" class="foo"');
            expect(result).toBe(' class="foo" id="bar"');
        });

        test('should handle empty attribute string', () => {
            const result = compareArtifacts.sortAttributes('');
            expect(result).toBe('');
        });

        test('should handle no attributes', () => {
            const result = compareArtifacts.sortAttributes('  ');
            expect(result).toBe('');
        });
    });

    test.describe('compare-artifacts — listFiles', () => {
        test('should list files in docs/output', () => {
            if (!fs.existsSync(DOCS_OUTPUT)) {
                test.skip(true, 'docs/output does not exist');
                return;
            }
            const files = compareArtifacts.listFiles(DOCS_OUTPUT);
            expect(files.length).toBeGreaterThan(0);
            expect(files.some((f: string) => f.endsWith('.html'))).toBe(true);
        });

        test('should return empty for non-existent directory', () => {
            const files = compareArtifacts.listFiles('/nonexistent/path/12345');
            expect(files).toEqual([]);
        });
    });

    test.describe('compare-artifacts — diffFileTree', () => {
        test('should detect added files', () => {
            const result = compareArtifacts.diffFileTree(
                ['a.html', 'b.html'],
                ['a.html', 'b.html', 'c.html'],
            );
            expect(result.added).toEqual(['c.html']);
            expect(result.removed).toEqual([]);
            expect(result.common).toEqual(['a.html', 'b.html']);
        });

        test('should detect removed files', () => {
            const result = compareArtifacts.diffFileTree(
                ['a.html', 'b.html', 'c.html'],
                ['a.html'],
            );
            expect(result.added).toEqual([]);
            expect(result.removed).toEqual(['b.html', 'c.html']);
            expect(result.common).toEqual(['a.html']);
        });

        test('should detect no changes', () => {
            const result = compareArtifacts.diffFileTree(
                ['a.html', 'b.html'],
                ['a.html', 'b.html'],
            );
            expect(result.added).toEqual([]);
            expect(result.removed).toEqual([]);
            expect(result.common).toEqual(['a.html', 'b.html']);
        });
    });

    test.describe('compare-artifacts — extractAssetLinks', () => {
        test('should extract src and href links', () => {
            const html = '<img src="foo.png"><a href="bar.html">link</a>';
            const links = compareArtifacts.extractAssetLinks(html);
            expect(links).toContain('foo.png');
            expect(links).toContain('bar.html');
        });

        test('should handle single-quoted attributes', () => {
            const html = "<img src='baz.png'>";
            const links = compareArtifacts.extractAssetLinks(html);
            expect(links).toContain('baz.png');
        });

        test('should return empty for no links', () => {
            const html = '<div>no links here</div>';
            const links = compareArtifacts.extractAssetLinks(html);
            expect(links).toEqual([]);
        });

        test('should sort links', () => {
            const html = '<img src="z.png"><img src="a.png">';
            const links = compareArtifacts.extractAssetLinks(html);
            expect(links).toEqual(['a.png', 'z.png']);
        });
    });

    test.describe('compare-artifacts — compareArtifacts (integration)', () => {
        test('should detect no differences when comparing same directory', () => {
            if (!fs.existsSync(DOCS_OUTPUT)) {
                test.skip(true, 'docs/output does not exist');
                return;
            }
            const result = compareArtifacts.compareArtifacts(DOCS_OUTPUT, DOCS_OUTPUT);
            expect(result.hasDifferences).toBe(false);
        });

        test('should detect differences with modified content', () => {
            const tmpDir = path.join(__dirname, '..', '..', '..', '.tmp-golden-test');
            const expectedDir = path.join(tmpDir, 'expected');
            const actualDir = path.join(tmpDir, 'actual');

            try {
                fs.mkdirSync(expectedDir, {recursive: true});
                fs.mkdirSync(actualDir, {recursive: true});

                fs.writeFileSync(path.join(expectedDir, 'test.html'), '<p>hello</p>');
                fs.writeFileSync(path.join(actualDir, 'test.html'), '<p>world</p>');

                const result = compareArtifacts.compareArtifacts(expectedDir, actualDir);
                expect(result.hasDifferences).toBe(true);
                expect(result.htmlDiffs.length).toBe(1);
                expect(result.htmlDiffs[0].file).toBe('test.html');
            } finally {
                fs.rmSync(tmpDir, {recursive: true, force: true});
            }
        });

        test('should detect changed non-HTML asset bytes', () => {
            const tmpDir = path.join(__dirname, '..', '..', '..', '.tmp-golden-binary');
            const expectedDir = path.join(tmpDir, 'expected');
            const actualDir = path.join(tmpDir, 'actual');

            try {
                fs.mkdirSync(expectedDir, {recursive: true});
                fs.mkdirSync(actualDir, {recursive: true});
                fs.writeFileSync(path.join(expectedDir, 'image.png'), Buffer.from([1, 2, 3]));
                fs.writeFileSync(path.join(actualDir, 'image.png'), Buffer.from([1, 2, 4]));

                const result = compareArtifacts.compareArtifacts(expectedDir, actualDir);
                expect(result.hasDifferences).toBe(true);
                expect(result.contentDiffs).toHaveLength(1);
                expect(result.contentDiffs[0].file).toBe('image.png');
            } finally {
                fs.rmSync(tmpDir, {recursive: true, force: true});
            }
        });

        test('should fail closed when either corpus directory is missing', () => {
            expect(() =>
                compareArtifacts.compareArtifacts('/missing/expected', DOCS_OUTPUT),
            ).toThrow(/Expected artifact directory does not exist/);
            expect(() => compareArtifacts.compareArtifacts(DOCS_OUTPUT, '/missing/actual')).toThrow(
                /Actual artifact directory does not exist/,
            );
        });

        test('should detect added files', () => {
            const tmpDir = path.join(__dirname, '..', '..', '..', '.tmp-golden-test2');
            const expectedDir = path.join(tmpDir, 'expected');
            const actualDir = path.join(tmpDir, 'actual');

            try {
                fs.mkdirSync(expectedDir, {recursive: true});
                fs.mkdirSync(actualDir, {recursive: true});

                fs.writeFileSync(path.join(expectedDir, 'a.html'), '<p>a</p>');
                fs.writeFileSync(path.join(actualDir, 'a.html'), '<p>a</p>');
                fs.writeFileSync(path.join(actualDir, 'b.html'), '<p>b</p>');

                const result = compareArtifacts.compareArtifacts(expectedDir, actualDir);
                expect(result.hasDifferences).toBe(true);
                expect(result.fileTreeDiff.added).toEqual(['b.html']);
            } finally {
                fs.rmSync(tmpDir, {recursive: true, force: true});
            }
        });
    });

    test.describe('compare-artifacts — renderReport', () => {
        test('should render no-differences report', () => {
            const result = {
                fileTreeDiff: {added: [], removed: [], common: []},
                htmlDiffs: [],
                assetLinkDiffs: [],
                hasDifferences: false,
            };
            const md = compareArtifacts.renderReport(result);
            expect(md).toContain('No differences detected');
        });

        test('should render differences report', () => {
            const result = {
                fileTreeDiff: {added: ['new.html'], removed: ['old.html'], common: ['keep.html']},
                htmlDiffs: [{file: 'keep.html', diff: ['- old', '+ new']}],
                assetLinkDiffs: [],
                hasDifferences: true,
            };
            const md = compareArtifacts.renderReport(result);
            expect(md).toContain('Differences detected');
            expect(md).toContain('Added files');
            expect(md).toContain('new.html');
            expect(md).toContain('Removed files');
            expect(md).toContain('old.html');
            expect(md).toContain('HTML Differences');
            expect(md).toContain('CODEOWNER Approval');
        });
    });

    test.describe('compare-svg-dom — extractSvgStructure', () => {
        test('should extract viewBox from svg element', () => {
            const svg = '<svg viewBox="0 0 100 100"><rect width="50" height="50"/></svg>';
            const struct = compareSvgDom.extractSvgStructure(svg);
            expect(struct.viewBox).toBe('0 0 100 100');
        });

        test('should extract gradients', () => {
            const svg =
                '<svg>' +
                '<defs>' +
                '<linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">' +
                '<stop offset="0%" stop-color="red"/>' +
                '</linearGradient>' +
                '</defs>' +
                '</svg>';
            const struct = compareSvgDom.extractSvgStructure(svg);
            expect(struct.gradients.length).toBe(1);
            expect(struct.gradients[0].tag).toBe('linearGradient');
            expect(struct.gradients[0].id).toBe('grad1');
        });

        test('should extract masks', () => {
            const svg =
                '<svg>' +
                '<defs>' +
                '<mask id="mask1">' +
                '<rect width="100" height="100" fill="white"/>' +
                '</mask>' +
                '</defs>' +
                '</svg>';
            const struct = compareSvgDom.extractSvgStructure(svg);
            expect(struct.masks.length).toBe(1);
            expect(struct.masks[0].id).toBe('mask1');
        });

        test('should extract links from use elements', () => {
            const svg = '<svg><use href="#mySymbol"/></svg>';
            const struct = compareSvgDom.extractSvgStructure(svg);
            expect(struct.links.length).toBe(1);
            expect(struct.links[0].href).toBe('#mySymbol');
        });

        test('should extract elements with critical attributes', () => {
            const svg =
                '<svg viewBox="0 0 200 200">' +
                '<rect id="r1" width="100" height="100" fill="red"/>' +
                '</svg>';
            const struct = compareSvgDom.extractSvgStructure(svg);
            const rect = struct.elements.find((e: {tag: string}) => e.tag === 'rect');
            expect(rect).toBeDefined();
            expect(rect.attrs.id).toBe('r1');
            expect(rect.attrs.fill).toBe('red');
        });

        test('should preserve sibling depth after a closing tag', () => {
            const struct = compareSvgDom.extractSvgStructure(
                '<svg><g><path id="nested"/></g><rect id="sibling"/></svg>',
            );
            expect(
                struct.elements.map((element: {tag: string; depth: number}) => [
                    element.tag,
                    element.depth,
                ]),
            ).toEqual([
                ['svg', 0],
                ['g', 1],
                ['path', 2],
                ['rect', 1],
            ]);
        });
    });

    test.describe('compare-svg-dom — compareSvgStructure', () => {
        test('should report identical structures', () => {
            const struct = {
                viewBox: '0 0 100 100',
                elements: [{tag: 'rect', depth: 1, attrs: {id: 'r1'}}],
                gradients: [],
                masks: [],
                links: [],
            };
            const result = compareSvgDom.compareSvgStructure(struct, struct);
            expect(result.identical).toBe(true);
            expect(result.diffs).toEqual([]);
        });

        test('should detect viewBox mismatch', () => {
            const expected = {
                viewBox: '0 0 100 100',
                elements: [],
                gradients: [],
                masks: [],
                links: [],
            };
            const actual = {
                viewBox: '0 0 200 200',
                elements: [],
                gradients: [],
                masks: [],
                links: [],
            };
            const result = compareSvgDom.compareSvgStructure(expected, actual);
            expect(result.identical).toBe(false);
            expect(result.diffs.some((d: string) => d.includes('viewBox'))).toBe(true);
        });

        test('should detect element count mismatch', () => {
            const expected = {
                viewBox: null,
                elements: [{tag: 'rect', depth: 1, attrs: {}}],
                gradients: [],
                masks: [],
                links: [],
            };
            const actual = {
                viewBox: null,
                elements: [
                    {tag: 'rect', depth: 1, attrs: {}},
                    {tag: 'circle', depth: 1, attrs: {}},
                ],
                gradients: [],
                masks: [],
                links: [],
            };
            const result = compareSvgDom.compareSvgStructure(expected, actual);
            expect(result.identical).toBe(false);
            expect(result.diffs.some((d: string) => d.includes('element count'))).toBe(true);
        });

        test('should detect attribute mismatch', () => {
            const expected = {
                viewBox: null,
                elements: [{tag: 'rect', depth: 1, attrs: {id: 'r1', fill: 'red'}}],
                gradients: [],
                masks: [],
                links: [],
            };
            const actual = {
                viewBox: null,
                elements: [{tag: 'rect', depth: 1, attrs: {id: 'r1', fill: 'blue'}}],
                gradients: [],
                masks: [],
                links: [],
            };
            const result = compareSvgDom.compareSvgStructure(expected, actual);
            expect(result.identical).toBe(false);
            expect(result.diffs.some((d: string) => d.includes('fill'))).toBe(true);
        });

        test('should detect gradient count mismatch', () => {
            const expected = {
                viewBox: null,
                elements: [],
                gradients: [{tag: 'linearGradient', id: 'g1'}],
                masks: [],
                links: [],
            };
            const actual = {viewBox: null, elements: [], gradients: [], masks: [], links: []};
            const result = compareSvgDom.compareSvgStructure(expected, actual);
            expect(result.identical).toBe(false);
            expect(result.diffs.some((d: string) => d.includes('gradient count'))).toBe(true);
        });
    });

    test.describe('compare-svg-dom — listSvgFiles', () => {
        test('should list SVG files in docs/output', () => {
            if (!fs.existsSync(DOCS_OUTPUT)) {
                test.skip(true, 'docs/output does not exist');
                return;
            }
            const files = compareSvgDom.listSvgFiles(DOCS_OUTPUT);
            expect(files.length).toBeGreaterThan(0);
            expect(files.every((f: string) => f.endsWith('.svg'))).toBe(true);
        });

        test('should return empty for non-existent directory', () => {
            const files = compareSvgDom.listSvgFiles('/nonexistent/svg/path');
            expect(files).toEqual([]);
        });
    });

    test.describe('compare-svg-dom — compareSvgDoms (integration)', () => {
        test('should detect no differences when comparing same directory', () => {
            if (!fs.existsSync(DOCS_OUTPUT)) {
                test.skip(true, 'docs/output does not exist');
                return;
            }
            const result = compareSvgDom.compareSvgDoms(DOCS_OUTPUT, DOCS_OUTPUT);
            expect(result.hasDifferences).toBe(false);
        });

        test('should compare inline SVGs embedded in HTML', () => {
            const tmpDir = path.join(__dirname, '..', '..', '..', '.tmp-inline-svg');
            const expectedDir = path.join(tmpDir, 'expected');
            const actualDir = path.join(tmpDir, 'actual');
            try {
                fs.mkdirSync(expectedDir, {recursive: true});
                fs.mkdirSync(actualDir, {recursive: true});
                fs.writeFileSync(
                    path.join(expectedDir, 'index.html'),
                    '<svg viewBox="0 0 10 10"><rect fill="red"/></svg>',
                );
                fs.writeFileSync(
                    path.join(actualDir, 'index.html'),
                    '<svg viewBox="0 0 10 10"><rect fill="blue"/></svg>',
                );

                const result = compareSvgDom.compareSvgDoms(expectedDir, actualDir);
                expect(result.hasDifferences).toBe(true);
                expect(result.svgDiffs[0].file).toBe('index.html#inline-svg-0');
            } finally {
                fs.rmSync(tmpDir, {recursive: true, force: true});
            }
        });

        test('should fail closed when either SVG corpus directory is missing', () => {
            expect(() => compareSvgDom.compareSvgDoms('/missing/expected', DOCS_OUTPUT)).toThrow(
                /Expected SVG artifact directory does not exist/,
            );
            expect(() => compareSvgDom.compareSvgDoms(DOCS_OUTPUT, '/missing/actual')).toThrow(
                /Actual SVG artifact directory does not exist/,
            );
        });
    });

    test.describe('CLI scripts — execution', () => {
        test('compare-artifacts.js should exit 0 for identical dirs', () => {
            if (!fs.existsSync(DOCS_OUTPUT)) {
                test.skip(true, 'docs/output does not exist');
                return;
            }
            const script = path.join(
                __dirname,
                '..',
                '..',
                '..',
                'scripts',
                'compare-artifacts.js',
            );
            const cmd = `node "${script}" --expected "${DOCS_OUTPUT}" --actual "${DOCS_OUTPUT}"`;
            expect(() => execSync(cmd, {encoding: 'utf-8'})).not.toThrow();
        });

        test('compare-svg-dom.js should exit 0 for identical dirs', () => {
            if (!fs.existsSync(DOCS_OUTPUT)) {
                test.skip(true, 'docs/output does not exist');
                return;
            }
            const script = path.join(__dirname, '..', '..', '..', 'scripts', 'compare-svg-dom.js');
            const cmd = `node "${script}" --expected "${DOCS_OUTPUT}" --actual "${DOCS_OUTPUT}"`;
            expect(() => execSync(cmd, {encoding: 'utf-8'})).not.toThrow();
        });

        test('compare-artifacts.js should exit 1 for different dirs', () => {
            const tmpDir = path.join(__dirname, '..', '..', '..', '.tmp-cli-test');
            const expectedDir = path.join(tmpDir, 'expected');
            const actualDir = path.join(tmpDir, 'actual');

            try {
                fs.mkdirSync(expectedDir, {recursive: true});
                fs.mkdirSync(actualDir, {recursive: true});
                fs.writeFileSync(path.join(expectedDir, 'test.html'), '<p>a</p>');
                fs.writeFileSync(path.join(actualDir, 'test.html'), '<p>b</p>');

                const script = path.join(
                    __dirname,
                    '..',
                    '..',
                    '..',
                    'scripts',
                    'compare-artifacts.js',
                );
                const cmd = `node "${script}" --expected "${expectedDir}" --actual "${actualDir}"`;
                expect(() => execSync(cmd, {encoding: 'utf-8'})).toThrow();
            } finally {
                fs.rmSync(tmpDir, {recursive: true, force: true});
            }
        });
    });

    test.describe('build-corpus — module exports', () => {
        test('should export expected functions', () => {
            const buildCorpus = require('../../../scripts/build-corpus.js');
            expect(typeof buildCorpus.parseArgs).toBe('function');
            expect(typeof buildCorpus.resolveSha).toBe('function');
            expect(typeof buildCorpus.copyDir).toBe('function');
            expect(typeof buildCorpus.rmrf).toBe('function');
            expect(typeof buildCorpus.writeMetadata).toBe('function');
            expect(typeof buildCorpus.buildCorpus).toBe('function');
        });

        test('parseArgs should parse --ref and --output', () => {
            const buildCorpus = require('../../../scripts/build-corpus.js');
            const origArgv = process.argv;
            process.argv = ['node', 'script', '--ref', 'HEAD', '--output', 'artifacts/'];
            const args = buildCorpus.parseArgs();
            process.argv = origArgv;
            expect(args.ref).toBe('HEAD');
            expect(args.output).toBe('artifacts/');
        });

        test('resolveSha should not interpret the ref as a shell command', () => {
            const buildCorpus = require('../../../scripts/build-corpus.js');
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-corpus-ref-'));
            const marker = path.join(tmpDir, 'injected');
            try {
                const maliciousRef = `HEAD"; touch "${marker}"; echo "`;
                expect(() => buildCorpus.resolveSha(maliciousRef)).toThrow();
                expect(fs.existsSync(marker)).toBe(false);
            } finally {
                fs.rmSync(tmpDir, {recursive: true, force: true});
            }
        });
    });

    test.describe('Verification profile integration', () => {
        test('document-rendering profile should reference build-corpus script', () => {
            const vp = require('../../../src/verification-profiles/index.js');
            const profile = vp.getProfile('document-rendering');
            const corpusSteps = profile.steps.filter(
                (s: {id: string}) => s.id.startsWith('corpus-build') || s.id === 'artifact-compare',
            );
            expect(corpusSteps.length).toBeGreaterThanOrEqual(3);
        });

        test('document-rendering profile should reference svg-dom-compare step', () => {
            const vp = require('../../../src/verification-profiles/index.js');
            expect(vp.hasStep('document-rendering', 'svg-dom-compare')).toBe(true);
        });

        test('document-rendering profile should reference screenshot-capture step', () => {
            const vp = require('../../../src/verification-profiles/index.js');
            expect(vp.hasStep('document-rendering', 'screenshot-capture')).toBe(true);
        });
    });
});
