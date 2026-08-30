import {expect, test} from '@playwright/test';

const CONTENT = {
    PAGE_TITLE: '@diplodoc/latex-extension',
    FRONTMATTER_DESCRIPTION: 'LaTeX math rendering extension for Diplodoc using KaTeX',
    STAGE: 'preview',
    TAGS: ['latex', 'math', 'katex', 'equations', 'extension'],
} as const;

function decodeContent(raw: string | null): string {
    if (!raw) {
        return '';
    }
    return decodeURIComponent(raw);
}

function decodeOptions(raw: string | null): Record<string, unknown> {
    if (!raw) {
        return {};
    }
    return JSON.parse(decodeURIComponent(raw));
}

test.describe('Latex Extension', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/latex');
    });

    test.describe('Page title and frontmatter', () => {
        test('should render page title with package name', async ({page}) => {
            const h1 = page.locator('h1').first();
            await expect(h1).toBeVisible();
            await expect(h1).toContainText(CONTENT.PAGE_TITLE);
        });

        test('should render frontmatter description in meta tag', async ({page}) => {
            const meta = page.locator('meta[name="description"]');
            await expect(meta).toHaveAttribute(
                'content',
                new RegExp(CONTENT.FRONTMATTER_DESCRIPTION, 'i'),
            );
        });

        test('should render stage badge', async ({page}) => {
            const mark = page.locator('.dc-mark').first();
            await expect(mark).toBeVisible();
        });

        test('should render uppercased stage text', async ({page}) => {
            const mark = page.locator('.dc-mark').first();
            const text = await mark.textContent();
            expect(text?.trim().toUpperCase()).toBe(text?.trim());
        });

        test('should render all frontmatter tags', async ({page}) => {
            const tags = page.locator('.dc-tags__tag');
            await expect(tags).toHaveCount(CONTENT.TAGS.length);
            for (const tag of CONTENT.TAGS) {
                await expect(tags.filter({hasText: new RegExp(`^${tag}$`)})).toHaveCount(1);
            }
        });
    });

    test.describe('Preset variables', () => {
        test('should substitute package name', async ({page}) => {
            const h1 = page.locator('h1').first();
            await expect(h1).toContainText('@diplodoc/latex-extension');
        });

        test('should substitute description', async ({page}) => {
            const body = page.locator('.dc-doc-page__body').first();
            await expect(body).toContainText('LaTeX math rendering extension');
        });

        test('should substitute version', async ({page}) => {
            const body = page.locator('.dc-doc-page__body').first();
            await expect(body).toContainText('2.0.2');
        });

        test('should not have unresolved Liquid markers', async ({page}) => {
            const body = page.locator('body');
            const text = await body.textContent();
            expect(text).not.toContain('{{');
            expect(text).not.toContain('{%');
        });
    });

    test.describe('Inline math', () => {
        test('should render inline math span with correct class', async ({page}) => {
            const span = page.locator('#inline-area + p .yfm-latex').first();
            await expect(span).toBeVisible();
        });

        test('should encode pi r^2 in data-content', async ({page}) => {
            const span = page.locator('#inline-area + p .yfm-latex').first();
            const raw = await span.getAttribute('data-content');
            const content = decodeContent(raw);
            expect(content).toContain('\\pi');
            expect(content).toContain('r^2');
        });

        test('should encode displayMode false in data-options', async ({page}) => {
            const span = page.locator('#inline-area + p .yfm-latex').first();
            const raw = await span.getAttribute('data-options');
            const options = decodeOptions(raw);
            expect(options.displayMode).toBe(false);
        });

        test('should render KaTeX HTML after runtime', async ({page}) => {
            const span = page.locator('#inline-area + p .yfm-latex').first();
            await expect(span.locator('.katex')).toBeVisible({timeout: 15000});
        });

        test('should encode Euler identity', async ({page}) => {
            const span = page.locator('#inline-euler + p .yfm-latex').first();
            const raw = await span.getAttribute('data-content');
            const content = decodeContent(raw);
            expect(content).toContain('e^{i\\pi}');
            expect(content).toContain('+ 1 = 0');
        });

        test('should render Euler identity KaTeX', async ({page}) => {
            const span = page.locator('#inline-euler + p .yfm-latex').first();
            await expect(span.locator('.katex')).toBeVisible({timeout: 15000});
        });

        test('should encode quadratic formula', async ({page}) => {
            const span = page.locator('#inline-quadratic + p .yfm-latex').first();
            const raw = await span.getAttribute('data-content');
            const content = decodeContent(raw);
            expect(content).toContain('frac');
            expect(content).toContain('sqrt');
        });

        test('should render quadratic formula KaTeX', async ({page}) => {
            const span = page.locator('#inline-quadratic + p .yfm-latex').first();
            await expect(span.locator('.katex')).toBeVisible({timeout: 15000});
        });

        test('should be a span element (inline)', async ({page}) => {
            const span = page.locator('#inline-area + p .yfm-latex').first();
            const tagName = await span.evaluate((el) => el.tagName.toLowerCase());
            expect(tagName).toBe('span');
        });
    });

    test.describe('Block math', () => {
        test('should render block math with correct class', async ({page}) => {
            const block = page.locator('#block-integral + p.yfm-latex').first();
            await expect(block).toBeVisible();
        });

        test('should be a p element (block)', async ({page}) => {
            const block = page.locator('#block-integral + p.yfm-latex').first();
            const tagName = await block.evaluate((el) => el.tagName.toLowerCase());
            expect(tagName).toBe('p');
        });

        test('should encode displayMode true in data-options', async ({page}) => {
            const block = page.locator('#block-integral + p.yfm-latex').first();
            const raw = await block.getAttribute('data-options');
            const options = decodeOptions(raw);
            expect(options.displayMode).toBe(true);
        });

        test('should encode integral in data-content', async ({page}) => {
            const block = page.locator('#block-integral + p.yfm-latex').first();
            const raw = await block.getAttribute('data-content');
            const content = decodeContent(raw);
            expect(content).toContain('int');
            expect(content).toContain('e^{-x^2}');
            expect(content).toContain('sqrt{\\pi}');
        });

        test('should render integral KaTeX', async ({page}) => {
            const block = page.locator('#block-integral + p.yfm-latex').first();
            await expect(block.locator('.katex')).toBeVisible({timeout: 15000});
            await expect(block.locator('.katex-display')).toBeVisible();
        });

        test('should encode sum formula', async ({page}) => {
            const block = page.locator('#block-sum + p.yfm-latex').first();
            const raw = await block.getAttribute('data-content');
            const content = decodeContent(raw);
            expect(content).toContain('sum');
            expect(content).toContain('frac{1}{n^2}');
            expect(content).toContain('frac{\\pi^2}{6}');
        });

        test('should render sum KaTeX', async ({page}) => {
            const block = page.locator('#block-sum + p.yfm-latex').first();
            await expect(block.locator('.katex')).toBeVisible({timeout: 15000});
        });

        test('should encode energy equation', async ({page}) => {
            const block = page.locator('#block-energy + p.yfm-latex').first();
            const raw = await block.getAttribute('data-content');
            const content = decodeContent(raw);
            expect(content).toContain('E = mc^2');
        });

        test('should render energy KaTeX', async ({page}) => {
            const block = page.locator('#block-energy + p.yfm-latex').first();
            await expect(block.locator('.katex')).toBeVisible({timeout: 15000});
        });
    });

    test.describe('Single-line block', () => {
        test('should render single-line block with correct class', async ({page}) => {
            const block = page.locator('#single-line-block + p.yfm-latex').first();
            await expect(block).toBeVisible();
        });

        test('should be a p element', async ({page}) => {
            const block = page.locator('#single-line-block + p.yfm-latex').first();
            const tagName = await block.evaluate((el) => el.tagName.toLowerCase());
            expect(tagName).toBe('p');
        });

        test('should encode displayMode true', async ({page}) => {
            const block = page.locator('#single-line-block + p.yfm-latex').first();
            const raw = await block.getAttribute('data-options');
            const options = decodeOptions(raw);
            expect(options.displayMode).toBe(true);
        });

        test('should encode nabla cross product', async ({page}) => {
            const block = page.locator('#single-line-block + p.yfm-latex').first();
            const raw = await block.getAttribute('data-content');
            const content = decodeContent(raw);
            expect(content).toContain('nabla');
            expect(content).toContain('mathbf{B}');
        });

        test('should render single-line block KaTeX', async ({page}) => {
            const block = page.locator('#single-line-block + p.yfm-latex').first();
            await expect(block.locator('.katex')).toBeVisible({timeout: 15000});
        });
    });

    test.describe('All inline formulas', () => {
        test('should render multiple inline formulas in one paragraph', async ({page}) => {
            const spans = page.locator('#all-inline + p .yfm-latex');
            await expect(spans).toHaveCount(4);
        });

        test('should all render KaTeX after runtime', async ({page}) => {
            const spans = page.locator('#all-inline + p .yfm-latex .katex');
            await expect(spans).toHaveCount(4, {timeout: 15000});
        });

        test('should all have non-empty data-content', async ({page}) => {
            const spans = page.locator('#all-inline + p .yfm-latex');
            const count = await spans.count();
            for (let i = 0; i < count; i++) {
                const raw = await spans.nth(i).getAttribute('data-content');
                expect(raw).toBeTruthy();
                expect(decodeContent(raw).length).toBeGreaterThan(0);
            }
        });
    });

    test.describe('All latex elements', () => {
        test('should render all latex elements with correct class', async ({page}) => {
            const elements = page.locator('.yfm-latex');
            const count = await elements.count();
            expect(count).toBeGreaterThanOrEqual(8);
        });

        test('should all have data-content attribute', async ({page}) => {
            const elements = page.locator('.yfm-latex');
            const count = await elements.count();
            for (let i = 0; i < count; i++) {
                const raw = await elements.nth(i).getAttribute('data-content');
                expect(raw).toBeTruthy();
            }
        });

        test('should all have data-options attribute', async ({page}) => {
            const elements = page.locator('.yfm-latex');
            const count = await elements.count();
            for (let i = 0; i < count; i++) {
                const raw = await elements.nth(i).getAttribute('data-options');
                expect(raw).toBeTruthy();
            }
        });

        test('should all render KaTeX after runtime', async ({page}) => {
            const katexElements = page.locator('.yfm-latex .katex');
            await expect(katexElements.first()).toBeVisible({timeout: 15000});
            const count = await katexElements.count();
            expect(count).toBeGreaterThanOrEqual(8);
        });
    });

    test.describe('Configuration table', () => {
        test('should render Configuration section heading', async ({page}) => {
            const heading = page.locator('#configuration');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('Configuration');
        });

        test('should render configuration options table', async ({page}) => {
            const table = page.locator('#configuration ~ table').first();
            await expect(table).toBeVisible();
        });

        test('should list classes option', async ({page}) => {
            const table = page.locator('#configuration ~ table').first();
            await expect(table).toContainText('classes');
            await expect(table).toContainText('yfm-latex');
        });

        test('should list bundle option', async ({page}) => {
            const table = page.locator('#configuration ~ table').first();
            await expect(table).toContainText('bundle');
        });

        test('should list validate option', async ({page}) => {
            const table = page.locator('#configuration ~ table').first();
            await expect(table).toContainText('validate');
        });

        test('should list katexOptions option', async ({page}) => {
            const table = page.locator('#configuration ~ table').first();
            await expect(table).toContainText('katexOptions');
        });
    });

    test.describe('Token Types', () => {
        test('should render Token Types section heading', async ({page}) => {
            const heading = page.locator('#token-types');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('Token Types');
        });

        test('should list math_inline token', async ({page}) => {
            const table = page.locator('#token-types ~ table').first();
            await expect(table).toContainText('math_inline');
        });

        test('should list math_block token', async ({page}) => {
            const table = page.locator('#token-types ~ table').first();
            await expect(table).toContainText('math_block');
        });
    });

    test.describe('Data Attributes', () => {
        test('should render Data Attributes section heading', async ({page}) => {
            const heading = page.locator('#data-attributes');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('Data Attributes');
        });

        test('should document data-content attribute', async ({page}) => {
            const table = page.locator('#data-attributes ~ table').first();
            await expect(table).toContainText('data-content');
        });

        test('should document data-options attribute', async ({page}) => {
            const table = page.locator('#data-attributes ~ table').first();
            await expect(table).toContainText('data-options');
        });
    });

    test.describe('Runtime', () => {
        test('should render Runtime section heading', async ({page}) => {
            const heading = page.locator('#runtime');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('Runtime');
        });

        test('should document KaTeX rendering', async ({page}) => {
            const body = page.locator('.dc-doc-page__body').first();
            await expect(body).toContainText('katex.renderToString');
        });

        test('should document JSONP queue pattern', async ({page}) => {
            const body = page.locator('.dc-doc-page__body').first();
            await expect(body).toContainText('latexJsonp');
        });
    });

    test.describe('API Exports', () => {
        test('should render API Exports section heading', async ({page}) => {
            const heading = page.locator('#api-exports');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('API Exports');
        });

        test('should list main plugin export', async ({page}) => {
            const table = page.locator('#api-exports ~ table').first();
            await expect(table).toContainText('@diplodoc/latex-extension');
        });

        test('should list runtime export', async ({page}) => {
            const table = page.locator('#api-exports ~ table').first();
            await expect(table).toContainText('runtime');
        });

        test('should list react export', async ({page}) => {
            const table = page.locator('#api-exports ~ table').first();
            await expect(table).toContainText('react');
        });
    });

    test.describe('Usage Example', () => {
        test('should render Usage Example section heading', async ({page}) => {
            const heading = page.locator('#usage-example');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('Usage Example');
        });

        test('should render TypeScript code block with transform import', async ({page}) => {
            const codeBlock = page.locator('#usage-example ~ div pre code').first();
            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('transform');
            await expect(codeBlock).toContainText('@diplodoc/latex-extension');
        });
    });

    test.describe('Package Information', () => {
        test('should render Package Information section heading', async ({page}) => {
            const heading = page.locator('#package-information');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('Package Information');
        });

        test('should list dependencies from presets for-loop', async ({page}) => {
            const body = page.locator('.dc-doc-page__body').first();
            await expect(body).toContainText('katex');
            await expect(body).toContainText('markdown-it');
        });

        test('should list exports from presets for-loop', async ({page}) => {
            const body = page.locator('.dc-doc-page__body').first();
            await expect(body).toContainText('@diplodoc/latex-extension/plugin');
            await expect(body).toContainText('@diplodoc/latex-extension/runtime');
            await expect(body).toContainText('@diplodoc/latex-extension/react');
        });

        test('should not have liquid for-loop tags leaked', async ({page}) => {
            const body = page.locator('body');
            const text = await body.textContent();
            expect(text).not.toContain('{% for');
            expect(text).not.toContain('{% endfor');
        });
    });

    test.describe('Rendering note', () => {
        test('should render blockquote with Rendering text', async ({page}) => {
            const blockquote = page.locator('blockquote').first();
            await expect(blockquote).toBeVisible();
            await expect(blockquote).toContainText('Rendering');
        });

        test('should mention client-side rendering', async ({page}) => {
            const blockquote = page.locator('blockquote').first();
            await expect(blockquote).toContainText('client-side');
        });
    });

    test.describe('TOC navigation', () => {
        test('should have Latex Extension link in sidebar', async ({page}) => {
            const tocLink = page.locator('.dc-toc a', {hasText: 'Latex Extension'}).first();
            await expect(tocLink).toBeVisible();
        });

        test('should navigate to latex page', async ({page}) => {
            const tocLink = page.locator('.dc-toc a', {hasText: 'Latex Extension'}).first();
            const href = await tocLink.getAttribute('href');
            expect(href).toContain('latex');
        });
    });

    test.describe('Mini TOC', () => {
        test('should render mini TOC element', async ({page}) => {
            const miniToc = page.locator('.dc-mini-toc').first();
            await expect(miniToc).toBeVisible();
        });

        test('should have sections in mini TOC', async ({page}) => {
            const sections = page.locator('.dc-mini-toc__section');
            const count = await sections.count();
            expect(count).toBeGreaterThan(0);
        });
    });
});
