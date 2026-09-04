import {expect, test} from '@playwright/test';

const CONTENT = {
    PAGE_TITLE: '@diplodoc/translation',
    FRONTMATTER_DESCRIPTION: 'Markdown translation utilities for Diplodoc',
    PRESET_DESCRIPTION:
        'Markdown translation utilities — XLIFF extraction, skeleton generation, and composition',
    STAGE: 'new',
    TAGS: ['translation', 'xliff', 'localization', 'skeleton', 'markdown'],
} as const;

test.describe('Translation', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/translation');
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
            await expect(h1).toContainText('@diplodoc/translation');
        });

        test('should substitute version', async ({page}) => {
            const body = page.locator('.dc-doc-page__body').first();
            await expect(body).toContainText('1.7.31');
        });

        test('should substitute description', async ({page}) => {
            const firstParagraph = page.locator('.dc-doc-page__body p').first();
            await expect(firstParagraph).toBeVisible();
            await expect(firstParagraph).toContainText(CONTENT.PRESET_DESCRIPTION);
        });

        test('should not have unresolved Liquid markers', async ({page}) => {
            const body = page.locator('body');
            const text = await body.textContent();
            expect(text).not.toContain('{{');
            expect(text).not.toContain('{%');
        });
    });

    test.describe('Overview', () => {
        test('should render Overview section heading', async ({page}) => {
            const heading = page.locator('#overview');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('Overview');
        });

        test('should render key features list', async ({page}) => {
            const heading = page.locator('#key-features');
            await expect(heading).toBeVisible();
            const items = page.locator('#key-features + ul li');
            await expect(items).toHaveCount(10);
        });
    });

    test.describe('API', () => {
        test('should render API section heading', async ({page}) => {
            const heading = page.locator('#api');
            await expect(heading).toBeVisible();
        });

        test('should render extract subsection', async ({page}) => {
            const heading = page.locator('#extract');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('extract');
        });

        test('should render extract TypeScript code block', async ({page}) => {
            const codeBlock = page.locator('#extract + p + div pre code').first();
            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('extract');
            await expect(codeBlock).toContainText('@diplodoc/translation');
        });

        test('should render skeleton placeholder code block', async ({page}) => {
            const codeBlock = page.locator('#extract ~ div pre code').filter({hasText: '%%%'});
            await expect(codeBlock).toBeVisible();
            const code = await codeBlock.textContent();
            expect(code).toContain('%%%');
        });

        test('should render compose subsection', async ({page}) => {
            const heading = page.locator('#compose');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('compose');
        });

        test('should render compose TypeScript code block', async ({page}) => {
            const codeBlock = page.locator('#compose + p + div pre code').first();
            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('compose');
        });
    });

    test.describe('Extract Output', () => {
        test('should render Extract Output table', async ({page}) => {
            const heading = page.locator('#extract-output');
            await expect(heading).toBeVisible();
        });

        test('should have 3 rows in Extract Output table', async ({page}) => {
            const table = page.locator('#extract-output + table');
            await expect(table).toBeVisible();
            const rows = table.locator('tbody tr');
            await expect(rows).toHaveCount(3);
        });

        test('should list skeleton field', async ({page}) => {
            const table = page.locator('#extract-output + table');
            await expect(table).toContainText('skeleton');
        });

        test('should list xliff field', async ({page}) => {
            const table = page.locator('#extract-output + table');
            await expect(table).toContainText('xliff');
        });

        test('should list units field', async ({page}) => {
            const table = page.locator('#extract-output + table');
            await expect(table).toContainText('units');
        });
    });

    test.describe('Compose Options', () => {
        test('should render Compose Options table', async ({page}) => {
            const heading = page.locator('#compose-options');
            await expect(heading).toBeVisible();
        });

        test('should list useSource option', async ({page}) => {
            const table = page.locator('#compose-options + table');
            await expect(table).toBeVisible();
            await expect(table).toContainText('useSource');
        });
    });

    test.describe('Language Locale', () => {
        test('should render Language Locale table', async ({page}) => {
            const heading = page.locator('#language-locale');
            await expect(heading).toBeVisible();
        });

        test('should list language field with ISO 639-1', async ({page}) => {
            const table = page.locator('#language-locale + table');
            await expect(table).toBeVisible();
            await expect(table).toContainText('language');
            await expect(table).toContainText('ISO 639-1');
        });

        test('should list locale field with ISO 3166-1', async ({page}) => {
            const table = page.locator('#language-locale + table');
            await expect(table).toContainText('locale');
            await expect(table).toContainText('ISO 3166-1');
        });
    });

    test.describe('No-Translate Directive', () => {
        test('should render No-Translate Directive section heading', async ({page}) => {
            const heading = page.locator('#no-translate-directive');
            await expect(heading).toBeVisible();
        });

        test('should render noTranslate TypeScript code block', async ({page}) => {
            const codeBlock = page.locator('#no-translate-directive + p + div pre code').first();
            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('noTranslate');
            await expect(codeBlock).toContainText('MarkdownIt');
        });

        test('should render Directive Forms table', async ({page}) => {
            const heading = page.locator('#directive-forms');
            await expect(heading).toBeVisible();
        });

        test('should list all 3 directive forms', async ({page}) => {
            const table = page.locator('#directive-forms + table');
            await expect(table).toBeVisible();
            const rows = table.locator('tbody tr');
            await expect(rows).toHaveCount(3);
        });

        test('should document container directive', async ({page}) => {
            const table = page.locator('#directive-forms + table');
            await expect(table).toContainText('Container');
            await expect(table).toContainText(':::no-translate');
        });

        test('should document leaf block directive', async ({page}) => {
            const table = page.locator('#directive-forms + table');
            await expect(table).toContainText('Leaf block');
            await expect(table).toContainText('::no-translate');
        });

        test('should document inline directive', async ({page}) => {
            const table = page.locator('#directive-forms + table');
            await expect(table).toContainText('Inline');
            await expect(table).toContainText(':no-translate');
        });

        test('should render Modes table', async ({page}) => {
            const heading = page.locator('#modes');
            await expect(heading).toBeVisible();
            const table = page.locator('#modes + table');
            await expect(table).toBeVisible();
        });

        test('should document translate mode', async ({page}) => {
            const table = page.locator('#modes + table');
            await expect(table).toContainText('translate');
        });

        test('should document render mode', async ({page}) => {
            const table = page.locator('#modes + table');
            await expect(table).toContainText('render');
        });
    });

    test.describe('JSON Reference Resolution', () => {
        test('should render JSON Reference Resolution section heading', async ({page}) => {
            const heading = page.locator('#json-reference-resolution');
            await expect(heading).toBeVisible();
        });

        test('should render linkRefs TypeScript code block', async ({page}) => {
            const codeBlock = page.locator('#json-reference-resolution + p + div pre code').first();
            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('linkRefs');
            await expect(codeBlock).toContainText('unlinkRefs');
        });

        test('should render JSON Functions table', async ({page}) => {
            const heading = page.locator('#json-functions');
            await expect(heading).toBeVisible();
            const table = page.locator('#json-functions + table');
            await expect(table).toBeVisible();
        });

        test('should list linkRefs function', async ({page}) => {
            const table = page.locator('#json-functions + table');
            await expect(table).toContainText('linkRefs');
        });

        test('should list unlinkRefs function', async ({page}) => {
            const table = page.locator('#json-functions + table');
            await expect(table).toContainText('unlinkRefs');
        });
    });

    test.describe('Code Processing Modes', () => {
        test('should render Code Processing Modes table', async ({page}) => {
            const heading = page.locator('#code-processing-modes');
            await expect(heading).toBeVisible();
            const table = page.locator('#code-processing-modes + table');
            await expect(table).toBeVisible();
        });

        test('should list all 4 code processing modes', async ({page}) => {
            const table = page.locator('#code-processing-modes + table');
            const rows = table.locator('tbody tr');
            await expect(rows).toHaveCount(4);
        });

        test('should document no mode', async ({page}) => {
            const table = page.locator('#code-processing-modes + table');
            await expect(table).toContainText('no');
        });

        test('should document all mode', async ({page}) => {
            const table = page.locator('#code-processing-modes + table');
            await expect(table).toContainText('all');
        });

        test('should document precise mode', async ({page}) => {
            const table = page.locator('#code-processing-modes + table');
            await expect(table).toContainText('precise');
        });

        test('should document adaptive mode', async ({page}) => {
            const table = page.locator('#code-processing-modes + table');
            await expect(table).toContainText('adaptive');
        });
    });

    test.describe('Schemas', () => {
        test('should render Schemas section heading', async ({page}) => {
            const heading = page.locator('#schemas');
            await expect(heading).toBeVisible();
        });

        test('should render schema table with 3 entries', async ({page}) => {
            const table = page.locator('#schemas + p + table');
            await expect(table).toBeVisible();
            const rows = table.locator('tbody tr');
            await expect(rows).toHaveCount(3);
        });

        test('should list JSON Schema', async ({page}) => {
            const table = page.locator('#schemas + p + table');
            await expect(table).toContainText('JSON Schema');
            await expect(table).toContainText('json-schema.yaml');
        });

        test('should list OpenAPI 3.0', async ({page}) => {
            const table = page.locator('#schemas + p + table');
            await expect(table).toContainText('OpenAPI 3.0');
            await expect(table).toContainText('openapi-schema-30.yaml');
        });

        test('should list OpenAPI 3.1', async ({page}) => {
            const table = page.locator('#schemas + p + table');
            await expect(table).toContainText('OpenAPI 3.1');
            await expect(table).toContainText('openapi-schema-31.yaml');
        });
    });

    test.describe('Package Information', () => {
        test('should render Package Information section heading', async ({page}) => {
            const heading = page.locator('#package-information');
            await expect(heading).toBeVisible();
        });

        test('should render dependencies from presets for-loop', async ({page}) => {
            const section = page.locator('#dependencies + ul');
            await expect(section).toBeVisible();
            await expect(section).toContainText('@diplodoc/sentenizer');
            await expect(section).toContainText('@diplodoc/transform');
            await expect(section).toContainText('@diplodoc/directive');
            await expect(section).toContainText('@diplodoc/ajv');
            await expect(section).toContainText('markdown-it');
            await expect(section).toContainText('cheerio');
            await expect(section).toContainText('fast-xml-parser');
            await expect(section).toContainText('js-yaml');
        });

        test('should render exports from presets for-loop', async ({page}) => {
            const section = page.locator('#exports + ul');
            await expect(section).toBeVisible();
            await expect(section).toContainText('@diplodoc/translation');
            await expect(section).toContainText('@diplodoc/translation/package');
            await expect(section).toContainText('@diplodoc/translation/schemas/*');
        });

        test('should not have leaked liquid for-loop tags', async ({page}) => {
            const body = page.locator('body');
            const text = await body.textContent();
            expect(text).not.toContain('{% for');
            expect(text).not.toContain('{% endfor');
        });
    });

    test.describe('Format Support', () => {
        test('should render Format Support section heading', async ({page}) => {
            const heading = page.locator('#format-support');
            await expect(heading).toBeVisible();
        });

        test('should render format support table with 3 entries', async ({page}) => {
            const table = page.locator('#format-support + table');
            await expect(table).toBeVisible();
            const rows = table.locator('tbody tr');
            await expect(rows).toHaveCount(3);
        });

        test('should list Markdown stable format', async ({page}) => {
            const table = page.locator('#format-support + table');
            await expect(table).toContainText('Markdown (stable)');
            await expect(table).toContainText('md');
        });

        test('should list Markdown experimental format', async ({page}) => {
            const table = page.locator('#format-support + table');
            await expect(table).toContainText('Markdown (experimental)');
            await expect(table).toContainText('mdExp');
        });

        test('should list JSON format', async ({page}) => {
            const table = page.locator('#format-support + table');
            await expect(table).toContainText('JSON');
            await expect(table).toContainText('json');
        });
    });

    test.describe('Note directive', () => {
        test('should render note about Validation', async ({page}) => {
            const note = page.locator('.yfm-note').first();
            await expect(note).toBeVisible();
            await expect(note).toContainText('Validation');
        });

        test('should mention AJV in note content', async ({page}) => {
            const note = page.locator('.yfm-note').first();
            await expect(note).toContainText('AJV');
        });

        test('should mention ISO codes in note content', async ({page}) => {
            const note = page.locator('.yfm-note').first();
            await expect(note).toContainText('ISO 639-1');
            await expect(note).toContainText('ISO 3166-1');
        });
    });

    test.describe('Usage Example', () => {
        test('should render Usage Example section heading', async ({page}) => {
            const heading = page.locator('#usage-example');
            await expect(heading).toBeVisible();
        });

        test('should render complete workflow TypeScript code block', async ({page}) => {
            const codeBlock = page
                .locator('#complete-extract-and-compose-workflow + div pre code')
                .first();
            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('extract');
            await expect(codeBlock).toContainText('compose');
        });
    });

    test.describe('Cut directive', () => {
        test('should render cut block with XLIFF 1.2 Format summary', async ({page}) => {
            const cut = page.locator('.yfm-cut').first();
            await expect(cut).toBeVisible();
            const summary = cut.locator('.yfm-cut-title').first();
            await expect(summary).toContainText('XLIFF 1.2 Format');
        });

        test('should contain XLIFF XML in cut content', async ({page}) => {
            const cut = page.locator('.yfm-cut').first();
            const content = await cut.textContent();
            expect(content).toContain('xliff');
            expect(content).toContain('trans-unit');
            expect(content).toContain('source');
            expect(content).toContain('target');
        });
    });

    test.describe('TOC navigation', () => {
        test('should have Translation link in sidebar', async ({page}) => {
            const link = page.locator('.dc-toc a', {hasText: 'Translation'}).first();
            await expect(link).toBeVisible();
        });

        test('should navigate to translation page', async ({page}) => {
            const link = page.locator('.dc-toc a', {hasText: 'Translation'}).first();
            const href = await link.getAttribute('href');
            expect(href).toContain('translation');
        });
    });

    test.describe('Mini TOC', () => {
        test('should render mini TOC element', async ({page}) => {
            const miniToc = page.locator('.dc-mini-toc').first();
            await expect(miniToc).toBeVisible();
        });

        test('should have sections in mini TOC', async ({page}) => {
            const miniToc = page.locator('.dc-mini-toc').first();
            const sections = miniToc.locator('.dc-mini-toc__section');
            const count = await sections.count();
            expect(count).toBeGreaterThan(0);
        });
    });
});
