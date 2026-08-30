import {expect, test} from '@playwright/test';

const CONTENT = {
    PAGE_TITLE: '@diplodoc/html-extension',
    FRONTMATTER_DESCRIPTION: 'HTML embedding extension for Diplodoc',
    PRESET_DESCRIPTION: 'HTML plugin for Diplodoc transformer and builder',
    STAGE: 'preview',
    TAGS: ['html', 'embedding', 'iframe', 'sandbox', 'extension'],
} as const;

test.describe('HTML Extension', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/html');
    });

    test.describe('Page title and frontmatter', () => {
        test('should render page title with package name', async ({page}) => {
            const h1 = page.locator('h1').first();
            await expect(h1).toBeVisible();
            await expect(h1).toContainText(CONTENT.PAGE_TITLE);
        });

        test('should render frontmatter description in meta tag', async ({page}) => {
            const meta = page.locator('meta[name="description"]');
            await expect(meta).toHaveAttribute('content', new RegExp(CONTENT.FRONTMATTER_DESCRIPTION, 'i'));
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
            await expect(h1).toContainText('@diplodoc/html-extension');
        });

        test('should substitute package description', async ({page}) => {
            const firstParagraph = page.locator('.dc-doc-page__body p').first();
            await expect(firstParagraph).toBeVisible();
            await expect(firstParagraph).toContainText(CONTENT.PRESET_DESCRIPTION);
        });

        test('should substitute version in Package Information section', async ({page}) => {
            const section = page.locator('#package-information ~ ul').first();
            await expect(section).toBeVisible();
            await expect(section).toContainText('2.9.13');
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
            const overview = page.locator('#overview');
            const list = overview.locator('~ ul, ~ p + ul').first();
            await expect(list).toBeVisible();
            const items = list.locator('li');
            await expect(items).toHaveCount(6);
        });
    });

    test.describe('Package Information', () => {
        test('should render Package Information section heading', async ({page}) => {
            const heading = page.locator('#package-information');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('Package Information');
        });

        test('should render dependencies from presets for-loop', async ({page}) => {
            const section = page.locator('#dependencies');
            await expect(section).toBeVisible();
            const deps = section.locator('~ ul').first().locator('li');
            await expect(deps).toHaveCount(4);
        });

        test('should render exports from presets for-loop', async ({page}) => {
            const section = page.locator('#exports');
            await expect(section).toBeVisible();
            const exports = section.locator('~ ul').first().locator('li');
            await expect(exports).toHaveCount(5);
        });

        test('should not leak liquid for-loop tags', async ({page}) => {
            const body = page.locator('body');
            const text = await body.textContent();
            expect(text).not.toContain('for dep in');
            expect(text).not.toContain('for export in');
            expect(text).not.toContain('endfor');
        });
    });

    test.describe('Embedding Modes', () => {
        test('should render Embedding Modes section heading', async ({page}) => {
            const heading = page.locator('#embedding-modes');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('Embedding Modes');
        });

        test('should render embedding modes table', async ({page}) => {
            const section = page.locator('#embedding-modes');
            const table = section.locator('~ table').first();
            await expect(table).toBeVisible();
            const rows = table.locator('tbody tr');
            await expect(rows).toHaveCount(3);
        });

        test('should document srcdoc mode', async ({page}) => {
            const section = page.locator('#embedding-modes');
            const table = section.locator('~ table').first();
            const firstRow = table.locator('tbody tr').first();
            await expect(firstRow).toContainText('srcdoc');
            await expect(firstRow).toContainText('iframe srcdoc');
        });

        test('should document shadow mode', async ({page}) => {
            const section = page.locator('#embedding-modes');
            const table = section.locator('~ table').first();
            const secondRow = table.locator('tbody tr').nth(1);
            await expect(secondRow).toContainText('shadow');
            await expect(secondRow).toContainText('ShadowRoot');
        });

        test('should document isolated mode', async ({page}) => {
            const section = page.locator('#embedding-modes');
            const table = section.locator('~ table').first();
            const thirdRow = table.locator('tbody tr').nth(2);
            await expect(thirdRow).toContainText('isolated');
            await expect(thirdRow).toContainText('cross-origin');
        });

        test('should render srcdoc mode subsection with code block', async ({page}) => {
            const heading = page.locator('#srcdoc-mode');
            await expect(heading).toBeVisible();
            const code = page.locator('#srcdoc-mode ~ div pre code').first();
            await expect(code).toBeVisible();
            await expect(code).toContainText('iframe');
            await expect(code).toContainText('srcdoc');
            await expect(code).toContainText('data-yfm-sandbox-mode');
        });

        test('should render shadow mode subsection with code block', async ({page}) => {
            const heading = page.locator('#shadow-mode');
            await expect(heading).toBeVisible();
            const code = page.locator('#shadow-mode ~ div pre code').first();
            await expect(code).toBeVisible();
            await expect(code).toContainText('div');
            await expect(code).toContainText('data-yfm-sandbox-mode');
        });

        test('should render isolated mode subsection with code block', async ({page}) => {
            const heading = page.locator('#isolated-mode');
            await expect(heading).toBeVisible();
            const code = page.locator('#isolated-mode ~ div pre code').first();
            await expect(code).toBeVisible();
            await expect(code).toContainText('iframe');
            await expect(code).toContainText('isolated');
        });
    });

    test.describe('Directive Syntax', () => {
        test('should render Directive Syntax section heading', async ({page}) => {
            const heading = page.locator('#directive-syntax');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('Directive Syntax');
        });

        test('should render markdown code block with directive example', async ({page}) => {
            const section = page.locator('#directive-syntax');
            const code = section.locator('~ div pre code').first();
            await expect(code).toBeVisible();
            await expect(code).toContainText('::: html');
            await expect(code).toContainText(':::');
        });

        test('should render token types table', async ({page}) => {
            const section = page.locator('#directive-syntax');
            const table = section.locator('~ table').first();
            await expect(table).toBeVisible();
            const rows = table.locator('tbody tr');
            await expect(rows).toHaveCount(3);
            await expect(rows.first()).toContainText('srcdoc');
            await expect(rows.first()).toContainText('yfm_html_block');
            await expect(rows.nth(1)).toContainText('shadow');
            await expect(rows.nth(1)).toContainText('yfm_html_block_shadow');
            await expect(rows.nth(2)).toContainText('isolated');
            await expect(rows.nth(2)).toContainText('yfm_html_block_isolated');
        });
    });

    test.describe('Data Attributes', () => {
        test('should render Data Attributes section heading', async ({page}) => {
            const heading = page.locator('#data-attributes');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('Data Attributes');
        });

        test('should render data attributes table', async ({page}) => {
            const section = page.locator('#data-attributes');
            const table = section.locator('~ table').first();
            await expect(table).toBeVisible();
            const rows = table.locator('tbody tr');
            await expect(rows).toHaveCount(5);
        });

        test('should document data-yfm-sandbox-mode attribute', async ({page}) => {
            const section = page.locator('#data-attributes');
            const table = section.locator('~ table').first();
            await expect(table.locator('tbody tr').first()).toContainText('data-yfm-sandbox-mode');
        });

        test('should document data-yfm-sandbox-content attribute', async ({page}) => {
            const section = page.locator('#data-attributes');
            const table = section.locator('~ table').first();
            await expect(table.locator('tbody tr').nth(1)).toContainText('data-yfm-sandbox-content');
        });

        test('should document data-yfm-embed-id attribute', async ({page}) => {
            const section = page.locator('#data-attributes');
            const table = section.locator('~ table').first();
            await expect(table.locator('tbody tr').last()).toContainText('data-yfm-embed-id');
        });
    });

    test.describe('Configuration Options', () => {
        test('should render Configuration Options section heading', async ({page}) => {
            const heading = page.locator('#configuration-options');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('Configuration Options');
        });

        test('should render configuration table with all options', async ({page}) => {
            const section = page.locator('#configuration-options');
            const table = section.locator('~ table').first();
            await expect(table).toBeVisible();
            const rows = table.locator('tbody tr');
            await expect(rows).toHaveCount(8);
        });

        test('should document embeddingMode option', async ({page}) => {
            const section = page.locator('#configuration-options');
            const table = section.locator('~ table').first();
            await expect(table.locator('tbody tr').first()).toContainText('embeddingMode');
            await expect(table.locator('tbody tr').first()).toContainText('srcdoc');
        });

        test('should document runtimeJsPath option', async ({page}) => {
            const section = page.locator('#configuration-options');
            const table = section.locator('~ table').first();
            await expect(table.locator('tbody tr').nth(1)).toContainText('runtimeJsPath');
        });

        test('should document bundle option', async ({page}) => {
            const section = page.locator('#configuration-options');
            const table = section.locator('~ table').first();
            const bundleRow = table.locator('tbody tr').filter({hasText: 'bundle'});
            await expect(bundleRow).toHaveCount(1);
        });

        test('should document sanitize option', async ({page}) => {
            const section = page.locator('#configuration-options');
            const table = section.locator('~ table').first();
            const sanitizeRow = table.locator('tbody tr').filter({hasText: 'sanitize'});
            await expect(sanitizeRow).toHaveCount(1);
        });
    });

    test.describe('API Exports', () => {
        test('should render API Exports section heading', async ({page}) => {
            const heading = page.locator('#api-exports');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('API Exports');
        });

        test('should render API exports table', async ({page}) => {
            const section = page.locator('#api-exports');
            const table = section.locator('~ table').first();
            await expect(table).toBeVisible();
            const rows = table.locator('tbody tr');
            await expect(rows).toHaveCount(9);
        });

        test('should document transform export', async ({page}) => {
            const section = page.locator('#api-exports');
            const table = section.locator('~ table').first();
            const transformRow = table.locator('tbody tr').filter({hasText: 'transform'});
            await expect(transformRow).toHaveCount(1);
            await expect(transformRow.first()).toContainText('MarkdownIt plugin');
        });

        test('should document HtmlController export', async ({page}) => {
            const section = page.locator('#api-exports');
            const table = section.locator('~ table').first();
            const controllerRow = table.locator('tbody tr').filter({hasText: 'HtmlController'});
            await expect(controllerRow).toHaveCount(1);
        });

        test('should document React hooks export', async ({page}) => {
            const section = page.locator('#api-exports');
            const table = section.locator('~ table').first();
            const reactRow = table.locator('tbody tr').filter({hasText: 'useDiplodocEmbeddedContent'});
            await expect(reactRow).toHaveCount(1);
        });
    });

    test.describe('Sanitizer', () => {
        test('should render Sanitizer section heading', async ({page}) => {
            const heading = page.locator('#sanitizer');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('Sanitizer');
        });

        test('should render TypeScript code block with sanitizer example', async ({page}) => {
            const section = page.locator('#sanitizer');
            const code = section.locator('~ div pre code').first();
            await expect(code).toBeVisible();
            await expect(code).toContainText('htmlBlockDefaultSanitizer');
        });

        test('should document parse5 canonicalizer', async ({page}) => {
            const section = page.locator('#sanitizer');
            const text = await section.locator('~ p').first().textContent();
            expect(text).toContain('parse5');
            expect(text).toContain('mutation XSS');
        });

        test('should render extended CSS whitelist table', async ({page}) => {
            const table = page.locator('#extended-css-whitelist + table, #extended-css-whitelist ~ table').first();
            await expect(table).toBeVisible();
            const rows = table.locator('tbody tr');
            await expect(rows).toHaveCount(5);
        });

        test('should document Flexbox CSS properties', async ({page}) => {
            const table = page.locator('#extended-css-whitelist + table, #extended-css-whitelist ~ table').first();
            await expect(table.locator('tbody tr').first()).toContainText('Flexbox');
            await expect(table.locator('tbody tr').first()).toContainText('flex');
        });

        test('should document Grid CSS properties', async ({page}) => {
            const table = page.locator('#extended-css-whitelist + table, #extended-css-whitelist ~ table').first();
            await expect(table.locator('tbody tr').nth(1)).toContainText('Grid');
        });
    });

    test.describe('Runtime', () => {
        test('should render Runtime section heading', async ({page}) => {
            const heading = page.locator('#runtime');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('Runtime');
        });

        test('should render runtime selectors table', async ({page}) => {
            const section = page.locator('#runtime');
            const table = section.locator('~ table').first();
            await expect(table).toBeVisible();
            const rows = table.locator('tbody tr');
            await expect(rows).toHaveCount(3);
        });

        test('should document SrcDocIFrameController', async ({page}) => {
            const section = page.locator('#runtime');
            const table = section.locator('~ table').first();
            await expect(table.locator('tbody tr').first()).toContainText('SrcDocIFrameController');
            await expect(table.locator('tbody tr').first()).toContainText('srcdoc');
        });

        test('should document ShadowRootController', async ({page}) => {
            const section = page.locator('#runtime');
            const table = section.locator('~ table').first();
            await expect(table.locator('tbody tr').nth(1)).toContainText('ShadowRootController');
            await expect(table.locator('tbody tr').nth(1)).toContainText('shadow');
        });

        test('should document EmbeddedIFrameController', async ({page}) => {
            const section = page.locator('#runtime');
            const table = section.locator('~ table').first();
            await expect(table.locator('tbody tr').nth(2)).toContainText('EmbeddedIFrameController');
            await expect(table.locator('tbody tr').nth(2)).toContainText('isolated');
        });

        test('should render TypeScript code block with runtime example', async ({page}) => {
            const section = page.locator('#runtime');
            const code = section.locator('~ div pre code').first();
            await expect(code).toBeVisible();
            await expect(code).toContainText('HtmlController');
        });
    });

    test.describe('React Integration', () => {
        test('should render React Integration section heading', async ({page}) => {
            const heading = page.locator('#react-integration');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('React Integration');
        });

        test('should render TypeScript code block with React example', async ({page}) => {
            const section = page.locator('#react-integration');
            const code = section.locator('~ div pre code').first();
            await expect(code).toBeVisible();
            await expect(code).toContainText('useDiplodocEmbeddedContent');
            await expect(code).toContainText('EmbeddedContentRuntime');
        });
    });

    test.describe('RPC Adapter', () => {
        test('should render RPC Adapter section heading', async ({page}) => {
            const heading = page.locator('#rpc-adapter');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('RPC Adapter');
        });

        test('should render RPC components table', async ({page}) => {
            const section = page.locator('#rpc-adapter');
            const table = section.locator('~ table').first();
            await expect(table).toBeVisible();
            const rows = table.locator('tbody tr');
            await expect(rows).toHaveCount(3);
        });

        test('should document RPCConsumer', async ({page}) => {
            const section = page.locator('#rpc-adapter');
            const table = section.locator('~ table').first();
            await expect(table.locator('tbody tr').first()).toContainText('RPCConsumer');
        });

        test('should document APIPublisher', async ({page}) => {
            const section = page.locator('#rpc-adapter');
            const table = section.locator('~ table').first();
            await expect(table.locator('tbody tr').nth(1)).toContainText('APIPublisher');
        });
    });

    test.describe('Quickstart', () => {
        test('should render Quickstart section heading', async ({page}) => {
            const heading = page.locator('#quickstart');
            await expect(heading).toBeVisible();
            await expect(heading).toContainText('Quickstart');
        });

        test('should render TypeScript code block with quickstart example', async ({page}) => {
            const section = page.locator('#quickstart');
            const code = section.locator('~ div pre code').first();
            await expect(code).toBeVisible();
            await expect(code).toContainText('transform');
            await expect(code).toContainText('embeddingMode');
            await expect(code).toContainText('MarkdownIt');
        });
    });

    test.describe('Note directive', () => {
        test('should render note block with directive syntax info', async ({page}) => {
            const note = page.locator('.yfm-note').first();
            await expect(note).toBeVisible();
            await expect(note).toContainText('Directive syntax');
            await expect(note).toContainText('container block directive');
        });
    });

    test.describe('Cut directive', () => {
        test('should render cut block with security considerations', async ({page}) => {
            const cut = page.locator('.yfm-cut').first();
            await expect(cut).toBeVisible();
            const summary = cut.locator('.yfm-cut-title');
            await expect(summary).toContainText('Security considerations');
        });

        test('should mention targetOrigin in cut content', async ({page}) => {
            const cut = page.locator('.yfm-cut').first();
            const content = cut.locator('.yfm-cut-content');
            await expect(content).toContainText('targetOrigin');
            await expect(content).toContainText('isolated');
        });
    });

    test.describe('TOC navigation', () => {
        test('should have HTML Extension link in sidebar', async ({page}) => {
            const sidebar = page.locator('.dc-toc').first();
            const link = sidebar.locator('a').filter({hasText: 'HTML Extension'});
            await expect(link).toHaveCount(1);
        });

        test('should link to correct href', async ({page}) => {
            const sidebar = page.locator('.dc-toc').first();
            const link = sidebar.locator('a').filter({hasText: 'HTML Extension'});
            await expect(link).toHaveAttribute('href', /ru\/syntax\/html/);
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
