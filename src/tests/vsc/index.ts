import {expect, test} from '@playwright/test';

const CONTENT = {
    PAGE_TITLE: 'VSC Extension',
    PAGE_DESCRIPTION:
        'Diplodoc VS Code Extension — schema validation, linting, and visual editors for YFM',
    STAGE_LABEL: 'PREVIEW',
    TAGS: ['vsc', 'vscode', 'extension', 'validation', 'linting', 'editor'],
    VSC_PACKAGE: 'diplodoc-vsc-extension',
    VSC_VERSION: '1.4.1',
    VSC_DESCRIPTION:
        'VS Code extension for Diplodoc — schema validation, linting, and visual editors',
    EDITOR_MODE: 'wysiwyg',
    H2_KEYBINDINGS: 'Keybindings',
    H2_YAML_CONFIG: 'YAML Language Configuration',
    H2_SETTINGS: 'Configuration Settings',
    H2_SCHEMA_VALIDATION: 'Schema Validation',
    H2_MARKDOWN_LINTING: 'Markdown Linting',
    H2_LINK_NAVIGATION: 'Link Navigation',
    H2_LIQUID_SUPPORT: 'Liquid Syntax Support',
    H2_COLOR_PROVIDER: 'Color Provider',
    H2_NOTE_DIRECTIVE: 'Note Directive',
    H2_CUT_DIRECTIVE: 'Cut Directive',
    H2_TOC_NAVIGATION: 'TOC Navigation',
    KEYBINDINGS: [
        {shortcut: 'Alt+T', command: 'Insert Table'},
        {shortcut: 'Alt+R', command: 'Insert Note'},
        {shortcut: 'Alt+C', command: 'Insert Cut'},
        {shortcut: 'Alt+A', command: 'Insert Tabs'},
        {shortcut: 'Alt+O', command: 'Insert Code Block'},
        {shortcut: 'Alt+Z', command: 'Insert Include'},
        {shortcut: 'Alt+Q', command: 'Insert Quote'},
        {shortcut: 'Alt+M', command: 'Insert Mermaid'},
        {shortcut: 'Alt+F', command: 'Insert Frontmatter'},
        {shortcut: 'Alt+P', command: 'Insert Page Constructor'},
        {shortcut: 'Alt+H', command: 'Insert HTML Block'},
        {shortcut: 'Alt+V', command: 'Insert Video'},
        {shortcut: 'Alt+G', command: 'Insert YFM Comment'},
    ],
    YAML_CONFIG_FILES: [
        '.yfm',
        '.yfmlint',
        'toc.yaml',
        'presets.yaml',
        'redirects.yaml',
        'theme.yaml',
    ],
    YAML_CONFIG_SCHEMAS: ['yfm', 'yfmlint', 'toc', 'presets', 'redirects', 'theme'],
    SETTINGS: [
        'diplodoc.editorMode',
        'diplodoc.isOnlyYfm',
        'diplodoc.excludedDirs',
        'diplodoc.excludedFiles',
        'diplodoc.lintRules',
    ],
    LINT_RULES_DISABLED: ['MD013', 'MD018', 'MD026', 'MD034', 'MD051'],
    VSC_COMMANDS: [
        'diplodoc.openMdEditor',
        'diplodoc.openTocEditor',
        'diplodoc.initProject',
        'diplodoc.insertTable',
        'diplodoc.insertNote',
        'diplodoc.insertCut',
        'diplodoc.insertTab',
        'diplodoc.insertCodeBlock',
        'diplodoc.insertInclude',
        'diplodoc.insertQuote',
        'diplodoc.insertMermaid',
        'diplodoc.insertFrontmatter',
        'diplodoc.insertPageConstructor',
        'diplodoc.insertHtmlBlock',
        'diplodoc.insertVideo',
        'diplodoc.insertComment',
        'diplodoc.findFileReferences',
    ],
} as const;

test.describe('VSC Extension', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/vsc');
    });

    test.describe('Page title', () => {
        test('should display page title as h1 heading', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.VSC_PACKAGE);
        });

        test('should set browser tab title from frontmatter', async ({page}) => {
            const title = await page.title();

            expect(title).toContain(CONTENT.PAGE_TITLE);
        });
    });

    test.describe('Frontmatter description', () => {
        test('should render meta description tag in HTML head', async ({page}) => {
            const metaDescription = page.locator('meta[name="description"]');

            await expect(metaDescription).toHaveAttribute(
                'content',
                CONTENT.PAGE_DESCRIPTION,
            );
        });
    });

    test.describe('Frontmatter stage', () => {
        test('should render stage badge for preview stage', async ({page}) => {
            const mark = page.locator('.dc-mark');

            await expect(mark).toBeVisible();
            await expect(mark).toContainText(CONTENT.STAGE_LABEL);
        });

        test('should uppercase stage label text', async ({page}) => {
            const mark = page.locator('.dc-mark');
            const text = await mark.textContent();

            expect(text).toBe(text?.toUpperCase());
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
                await expect(
                    tagElements.filter({hasText: new RegExp(`^${tag}$`)}),
                ).toHaveCount(1);
            }
        });
    });

    test.describe('Preset variables', () => {
        test('should substitute package name variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.VSC_PACKAGE);
        });

        test('should substitute version variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.VSC_VERSION);
        });

        test('should substitute description variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.VSC_DESCRIPTION);
        });

        test('should not leave unresolved vsc_info variable markers in output', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).not.toContainText('{{ vsc_info');
            await expect(body).not.toContainText('{% for');
            await expect(body).not.toContainText('{% endfor');
        });
    });

    test.describe('Keybindings', () => {
        test('should render keybindings heading section', async ({page}) => {
            const section = page.locator('h2#keybindings');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_KEYBINDINGS);
        });

        test('should render keybindings table', async ({page}) => {
            const table = page.locator('h2#keybindings ~ table').first();

            await expect(table).toBeVisible();
        });

        test('should list all shortcuts in table', async ({page}) => {
            const table = page.locator('h2#keybindings ~ table').first();

            for (const kb of CONTENT.KEYBINDINGS) {
                await expect(table).toContainText(kb.shortcut);
                await expect(table).toContainText(kb.command);
            }
        });

        test('should render table headers', async ({page}) => {
            const table = page.locator('h2#keybindings ~ table').first();
            const headers = table.locator('th');

            await expect(headers).toHaveCount(3);
            await expect(headers.first()).toContainText('Shortcut');
            await expect(headers.nth(1)).toContainText('Command');
        });
    });

    test.describe('YAML Language Configuration', () => {
        test('should render yaml config heading section', async ({page}) => {
            const section = page.locator('h2#yaml-config');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_YAML_CONFIG);
        });

        test('should render yaml config table with file entries', async ({page}) => {
            const table = page.locator('h2#yaml-config ~ table').first();

            await expect(table).toBeVisible();

            for (const file of CONTENT.YAML_CONFIG_FILES) {
                await expect(table).toContainText(file);
            }
        });

        test('should list all schema types in table', async ({page}) => {
            const table = page.locator('h2#yaml-config ~ table').first();

            for (const schema of CONTENT.YAML_CONFIG_SCHEMAS) {
                await expect(table).toContainText(schema);
            }
        });
    });

    test.describe('Configuration Settings', () => {
        test('should render settings heading section', async ({page}) => {
            const section = page.locator('h2#settings');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_SETTINGS);
        });

        test('should render settings table with all settings', async ({page}) => {
            const table = page.locator('h2#settings + table');

            await expect(table).toBeVisible();

            for (const setting of CONTENT.SETTINGS) {
                await expect(table).toContainText(setting);
            }
        });

        test('should list default values in table', async ({page}) => {
            const table = page.locator('h2#settings + table');

            await expect(table).toContainText('wysiwyg');
            await expect(table).toContainText('false');
        });
    });

    test.describe('Schema Validation', () => {
        test('should render schema validation heading section', async ({page}) => {
            const section = page.locator('h2#schema-validation');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_SCHEMA_VALIDATION);
        });

        test('should render yaml code block with frontmatter example', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: 'stage: new'});

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('title:');
            await expect(codeBlock).toContainText('tags:');
        });

        test('should render yaml code block with page-constructor example', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: 'blocks:'});

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('type: text');
        });
    });

    test.describe('Markdown Linting', () => {
        test('should render markdown linting heading section', async ({page}) => {
            const section = page.locator('h2#markdown-linting');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_MARKDOWN_LINTING);
        });

        test('should render json code block with default lint config', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: '"default": true'});

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('MD013');
        });

        test('should list all disabled rules in code block', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: '"default": true'});

            for (const rule of CONTENT.LINT_RULES_DISABLED) {
                await expect(codeBlock).toContainText(rule);
            }
        });

        test('should render yaml code block with yfmlint overrides', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: 'log-levels'});

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('YFM003');
            await expect(codeBlock).toContainText('disabled');
        });
    });

    test.describe('Link Navigation', () => {
        test('should render link navigation heading section', async ({page}) => {
            const section = page.locator('h2#link-navigation');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_LINK_NAVIGATION);
        });

        test('should mention supported YAML fields', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText('href');
            await expect(body).toContainText('url');
            await expect(body).toContainText('path');
            await expect(body).toContainText('src');
        });
    });

    test.describe('Liquid Syntax Support', () => {
        test('should render liquid support heading section', async ({page}) => {
            const section = page.locator('h2#liquid-support');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_LIQUID_SUPPORT);
        });

        test('should substitute liquid package variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.VSC_PACKAGE);
        });

        test('should render conditional content for wysiwyg mode', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText('Default editor mode is WYSIWYG.');
        });

        test('should not render else branch', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).not.toContainText('Default editor mode is markup.');
        });

        test('should not leave liquid tags in output', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).not.toContainText('{% if');
            await expect(body).not.toContainText('{% endif');
            await expect(body).not.toContainText('{% for');
            await expect(body).not.toContainText('{% endfor');
        });

        test('should iterate over commands from presets', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            for (const command of CONTENT.VSC_COMMANDS) {
                await expect(body).toContainText(command);
            }
        });
    });

    test.describe('Color Provider', () => {
        test('should render color provider heading section', async ({page}) => {
            const section = page.locator('h2#color-provider');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_COLOR_PROVIDER);
        });

        test('should render colorify markup with red color', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const redSpan = body.locator('.yfm-colorify--red');

            await expect(redSpan).toBeVisible();
            await expect(redSpan).toContainText('This text is red');
        });

        test('should render colorify markup with blue color', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const blueSpan = body.locator('.yfm-colorify--blue');

            await expect(blueSpan).toBeVisible();
            await expect(blueSpan).toContainText('this text is blue');
        });
    });

    test.describe('Note Directive', () => {
        test('should render note directive heading section', async ({page}) => {
            const section = page.locator('h2#note-directive');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_NOTE_DIRECTIVE);
        });

        test('should render note block with title', async ({page}) => {
            const note = page.locator('.yfm-note');

            await expect(note).toBeVisible();
            await expect(note).toContainText('Schema Validation');
        });

        test('should render note content', async ({page}) => {
            const note = page.locator('.yfm-note');

            await expect(note).toContainText('real time');
        });
    });

    test.describe('Cut Directive', () => {
        test('should render cut directive heading section', async ({page}) => {
            const section = page.locator('h2#cut-directive');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_CUT_DIRECTIVE);
        });

        test('should render cut block with title', async ({page}) => {
            const cut = page.locator('.yfm-cut');

            await expect(cut).toBeVisible();
            await expect(cut).toContainText('YFM Lint Rules');
        });

        test('should render cut content', async ({page}) => {
            const cut = page.locator('.yfm-cut');

            await expect(cut).toContainText('YFM001');
            await expect(cut).toContainText('YFM021');
        });
    });

    test.describe('TOC navigation', () => {
        test('should render VSC Extension link in sidebar', async ({page}) => {
            const navLink = page.locator('.dc-toc a, .yfm-sidebar a, nav a').filter({
                hasText: CONTENT.PAGE_TITLE,
            });

            await expect(navLink).toBeVisible();
        });

        test('should mark VSC Extension as active in TOC', async ({page}) => {
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
