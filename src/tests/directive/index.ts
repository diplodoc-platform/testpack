import {expect, test} from '@playwright/test';

const CONTENT = {
    PAGE_TITLE: 'Directive',
    PAGE_DESCRIPTION:
        'Documentation for @diplodoc/directive — pluggable parser for directive syntax in markdown',
    STAGE_LABEL: 'NEW',
    TAGS: ['directive', 'parser', 'syntax', 'markdown-it'],
    DIRECTIVE_PACKAGE: '@diplodoc/directive',
    DIRECTIVE_VERSION: '0.3.6',
    DIRECTIVE_DESCRIPTION: 'Pluggable parser for directive syntax in markdown markup',
    SYNTAX_FORMS: ['Inline', 'Leaf block', 'Container block'],
    SYNTAX_MARKERS: [':name', '::name', ':::name'],
    H2_OVERVIEW: 'Overview',
    H2_DIRECTIVE_SYNTAX: 'Directive Syntax',
    H2_PACKAGE_INFO: 'Package Information',
    H2_API_EXPORTS: 'API Exports',
    H2_POWERED_EXTENSIONS: 'Directive-Powered Extensions',
    H2_PARAMETER_GROUPS: 'Parameter Groups',
    H2_QUICKSTART: 'Quickstart Example',
    H2_TOC_NAVIGATION: 'TOC Navigation',
    H3_PARSER_PLUGIN: 'Parser Plugin',
    H3_ENABLE_DISABLE: 'Enable / Disable Helpers',
    H3_REGISTRATION: 'Registration Helpers',
    H3_TOKENIZERS: 'Tokenizers',
    API_EXPORTS: [
        'directiveParser',
        'enableInlineDirectives',
        'disableInlineDirectives',
        'enableBlockDirectives',
        'disableBlockDirectives',
        'registerInlineDirective',
        'registerLeafBlockDirective',
        'registerContainerDirective',
        'tokenizeInlineContent',
        'tokenizeBlockContent',
        'createBlockInlineToken',
    ],
    EXTENSIONS: ['cut-extension', 'file-extension', 'html-extension', 'page-constructor'],
    PARAM_GROUPS: ['Square brackets', 'Parentheses', 'Curly braces'],
} as const;

test.describe('Directive', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/directive');
    });

    test.describe('Page title', () => {
        test('should display page title as h1 heading', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.DIRECTIVE_PACKAGE);
        });

        test('should set browser tab title from frontmatter', async ({page}) => {
            const title = await page.title();

            expect(title).toContain(CONTENT.PAGE_TITLE);
        });
    });

    test.describe('Frontmatter description', () => {
        test('should render meta description tag in HTML head', async ({page}) => {
            const metaDescription = page.locator('meta[name="description"]');

            await expect(metaDescription).toHaveAttribute('content', CONTENT.PAGE_DESCRIPTION);
        });
    });

    test.describe('Frontmatter stage', () => {
        test('should render stage badge for new stage', async ({page}) => {
            const mark = page.locator('.dc-mark');

            await expect(mark).toBeVisible();
            await expect(mark).toContainText(CONTENT.STAGE_LABEL);
        });

        test('should uppercase stage label text', async ({page}) => {
            const mark = page.locator('.dc-mark');
            const text = await mark.textContent();

            expect(text).toBe(text?.toUpperCase());
        });

        test('should render stage meta tag with new value', async ({page}) => {
            const stageMeta = page.locator('meta[name="stage"]');

            await expect(stageMeta).toHaveAttribute('content', 'new');
        });
    });

    test.describe('Frontmatter tags', () => {
        test('should render tags container', async ({page}) => {
            const tags = page.locator('.dc-tags');

            await expect(tags).toBeVisible();
        });

        test('should render all tags from frontmatter', async ({page}) => {
            const tagElements = page.locator('.dc-tags__tag');

            await expect(tagElements).toHaveCount(CONTENT.TAGS.length);

            for (const tag of CONTENT.TAGS) {
                await expect(tagElements.filter({hasText: tag})).toHaveCount(1);
            }
        });
    });

    test.describe('Preset variables', () => {
        test('should substitute package name variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.DIRECTIVE_PACKAGE);
        });

        test('should substitute version variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.DIRECTIVE_VERSION);
        });

        test('should not leave unresolved directive_info variable markers in output', async ({
            page,
        }) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).not.toContainText('{{ directive_info');
            await expect(body).not.toContainText('{% for');
        });
    });

    test.describe('Overview', () => {
        test('should render overview heading section', async ({page}) => {
            const section = page.locator('h2#overview');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_OVERVIEW);
        });

        test('should mention markdown-it-directive integration', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText('markdown-it-directive');
        });
    });

    test.describe('Directive Syntax', () => {
        test('should render directive syntax heading section', async ({page}) => {
            const section = page.locator('h2#directive-syntax');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_DIRECTIVE_SYNTAX);
        });

        test('should document all three directive forms', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            for (const marker of CONTENT.SYNTAX_MARKERS) {
                await expect(body).toContainText(marker);
            }
        });

        test('should document parameter groups with fixed order', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText('[]');
            await expect(body).toContainText('()');
            await expect(body).toContainText('{}');
        });

        test('should render container block code example', async ({page}) => {
            const codeBlock = page
                .locator('pre code')
                .filter({hasText: ':::name'});

            await expect(codeBlock).toBeVisible();
        });
    });

    test.describe('Package Information', () => {
        test('should render package info heading section', async ({page}) => {
            const section = page.locator('h2#package-information');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_PACKAGE_INFO);
        });

        test('should iterate over syntax forms from presets', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            for (const form of CONTENT.SYNTAX_FORMS) {
                await expect(body).toContainText(form);
            }
        });

        test('should not leave liquid for-loop tags in output', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).not.toContainText('{% endfor');
        });
    });

    test.describe('API Exports', () => {
        test('should render API exports heading section', async ({page}) => {
            const section = page.locator('h2#api-exports');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_API_EXPORTS);
        });

        test('should render parser plugin subsection', async ({page}) => {
            const section = page.locator('h3#parser-plugin');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_PARSER_PLUGIN);
        });

        test('should render enable/disable helpers subsection', async ({page}) => {
            const section = page.locator('h3[id="enable-/-disable-helpers"]');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_ENABLE_DISABLE);
        });

        test('should render registration helpers subsection', async ({page}) => {
            const section = page.locator('h3#registration-helpers');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_REGISTRATION);
        });

        test('should render tokenizers subsection', async ({page}) => {
            const section = page.locator('h3#tokenizers');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_TOKENIZERS);
        });

        test('should list all API exports in the body', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            for (const api of CONTENT.API_EXPORTS) {
                await expect(body).toContainText(api);
            }
        });

        test('should render TypeScript code block with directiveParser import', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body
                .locator('pre code')
                .filter({hasText: 'directiveParser'})
                .first();

            await expect(codeBlock).toBeVisible();
        });

        test('should render TypeScript code block with registerContainerDirective', async ({
            page,
        }) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body
                .locator('pre code')
                .filter({hasText: 'registerContainerDirective'})
                .first();

            await expect(codeBlock).toBeVisible();
        });
    });

    test.describe('Directive-Powered Extensions', () => {
        test('should render extensions heading section', async ({page}) => {
            const section = page.locator('h2#directive-powered-extensions');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_POWERED_EXTENSIONS);
        });

        test('should render table with extension entries', async ({page}) => {
            const table = page.locator('#directive-powered-extensions ~ table').first();

            await expect(table).toBeVisible();
        });

        test('should list all extensions in table rows', async ({page}) => {
            const table = page.locator('#directive-powered-extensions ~ table').first();

            for (const ext of CONTENT.EXTENSIONS) {
                await expect(table).toContainText(ext);
            }
        });

        test('should render table headers', async ({page}) => {
            const table = page.locator('#directive-powered-extensions ~ table').first();
            const headers = table.locator('th');

            await expect(headers).toHaveCount(4);
            await expect(headers.first()).toContainText('Extension');
            await expect(headers.nth(1)).toContainText('Directive Name');
        });
    });

    test.describe('Parameter Groups', () => {
        test('should render parameter groups heading section', async ({page}) => {
            const section = page.locator('h2#parameter-groups');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_PARAMETER_GROUPS);
        });

        test('should render table with parameter group entries', async ({page}) => {
            const table = page.locator('#parameter-groups ~ table').first();

            await expect(table).toBeVisible();
        });

        test('should list all parameter groups in table rows', async ({page}) => {
            const table = page.locator('#parameter-groups ~ table').first();

            for (const group of CONTENT.PARAM_GROUPS) {
                await expect(table).toContainText(group);
            }
        });
    });

    test.describe('Quickstart Example', () => {
        test('should render quickstart heading section', async ({page}) => {
            const section = page.locator('h2#quickstart-example');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_QUICKSTART);
        });

        test('should render TypeScript code block with simpleBlockPlugin', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: 'simpleBlockPlugin'});

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('tokenizeBlockContent');
        });

        test('should render HTML output code block', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const htmlBlock = body.locator('pre code').filter({hasText: 'Heading 3 inside'});

            await expect(htmlBlock).toBeVisible();
            await expect(htmlBlock).toContainText('<div');
        });
    });

    test.describe('Note directive', () => {
        test('should render note block for directive vs liquid', async ({page}) => {
            const note = page.locator('.yfm-note');

            await expect(note).toBeVisible();
            await expect(note).toContainText('Directive vs Liquid');
        });

        test('should mention directiveSyntax option in note content', async ({page}) => {
            const note = page.locator('.yfm-note');

            await expect(note).toContainText('directiveSyntax');
        });
    });

    test.describe('TOC navigation', () => {
        test('should render Directive link in sidebar', async ({page}) => {
            const navLink = page.locator('.dc-toc a').filter({
                hasText: CONTENT.PAGE_TITLE,
            });

            await expect(navLink).toBeVisible();
        });

        test('should mark Directive as active in TOC', async ({page}) => {
            const activeItem = page.locator('.dc-toc__list-item_active');

            await expect(activeItem).toBeVisible();
            await expect(activeItem).toContainText(CONTENT.PAGE_TITLE);
        });

        test('should render TOC navigation heading section', async ({page}) => {
            const section = page.locator('h2#toc-navigation');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_TOC_NAVIGATION);
        });
    });

    test.describe('Mini TOC', () => {
        test('should render mini-toc navigation element', async ({page}) => {
            const miniToc = page.locator('.dc-mini-toc');

            await expect(miniToc).toBeVisible();
        });

        test('should list page headings as sections', async ({page}) => {
            const sections = page.locator('.dc-mini-toc__section');

            const count = await sections.count();
            expect(count).toBeGreaterThan(0);
        });
    });
});
