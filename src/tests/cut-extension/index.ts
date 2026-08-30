import {expect, test} from '@playwright/test';

const selectors = {
    tocLink: '.dc-toc a',
    codeBlock: 'pre code',
    body: '.dc-doc-page__body',
} as const;

const CONTENT = {
    PAGE_TITLE: 'Cut Extension',
    DESCRIPTION: 'Testpack fixture exercising the @diplodoc/cut-extension plugin rendering and documentation.',
    STAGE: 'preview',
    STAGE_UPPER: 'PREVIEW',
    TAGS: ['cut', 'collapsible', 'details', 'extension'],
    PACKAGE: '@diplodoc/cut-extension',
    VERSION: '1.1.7',
    LIQUID_SYNTAX: '{% cut',
    DIRECTIVE_SYNTAX: ':::cut',
    DIRECTIVE_DISABLED: 'disabled',
    DIRECTIVE_ENABLED: 'enabled',
    DIRECTIVE_ONLY: 'only',
    TOKEN_CUT: 'yfm_cut',
    TOKEN_TITLE: 'yfm_cut_title',
    TOKEN_CONTENT: 'yfm_cut_content',
    CLASS_CUT: 'yfm-cut',
    CLASS_TITLE: 'yfm-cut-title',
    CLASS_CONTENT: 'yfm-cut-content',
    CLASS_HIGHLIGHT: 'yfm-cut-highlight',
    TAG_DETAILS: 'details',
    TAG_SUMMARY: 'summary',
    TAG_DIV: 'div',
    TRANSFORM_FN: 'transform',
    TRANSFORM_OPTIONS: 'TransformOptions',
    RUNTIME_CLASS: 'YfmCutController',
    ENV_FLAG: 'has-yfm-cut',
    DEP_DIRECTIVE: '@diplodoc/directive',
    DEP_UTILS: '@diplodoc/utils',
    EXPORT_RUNTIME: '@diplodoc/cut-extension/runtime',
    GROUPED_NOTE: 'Grouped cuts',
    LIVE_BASIC_TITLE: 'Expand me',
    LIVE_CODE_TITLE: 'Show code',
    LIVE_OPEN_TITLE: 'Already open',
} as const;

test.describe('Cut Extension', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/cut-extension');
    });

    test.describe('Page title', () => {
        test('should display Cut Extension heading on page', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.PAGE_TITLE);
        });

        test('should set browser tab title to Cut Extension', async ({page}) => {
            const title = await page.title();

            expect(title).toContain('Cut Extension');
        });
    });

    test.describe('Frontmatter description', () => {
        test('should render meta description tag', async ({page}) => {
            const meta = page.locator('meta[name="description"]');

            await expect(meta).toHaveAttribute('content', CONTENT.DESCRIPTION);
        });
    });

    test.describe('Frontmatter stage', () => {
        test('should render visible stage badge', async ({page}) => {
            const badge = page.locator('.dc-mark').first();

            await expect(badge).toBeVisible();
        });

        test('should uppercase the stage text', async ({page}) => {
            const badge = page.locator('.dc-mark').first();

            const text = (await badge.textContent()) ?? '';
            expect(text.trim().toUpperCase()).toBe(CONTENT.STAGE_UPPER);
        });
    });

    test.describe('Frontmatter tags', () => {
        test('should render tags container', async ({page}) => {
            const tags = page.locator('.dc-tags').first();

            await expect(tags).toBeVisible();
        });

        test('should render all tags', async ({page}) => {
            for (const tag of CONTENT.TAGS) {
                const tagEl = page
                    .locator('.dc-tags__list .dc-tags__tag')
                    .filter({hasText: new RegExp(`^${tag}$`)});

                await expect(tagEl).toHaveCount(1);
            }
        });
    });

    test.describe('Preset variables', () => {
        test('should substitute package name from presets', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.PACKAGE);
        });

        test('should substitute version from presets', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.VERSION);
        });

        test('should not leave unresolved liquid markers', async ({page}) => {
            const body = page.locator(selectors.body);

            const text = (await body.textContent()) ?? '';
            expect(text).not.toContain('{{');
            expect(text).not.toContain('}}');
        });
    });

    test.describe('Overview', () => {
        test('should render Overview section heading', async ({page}) => {
            const heading = page.locator('h2#overview');

            await expect(heading).toBeVisible();
        });

        test('should mention collapsible sections', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('collapsible');
        });
    });

    test.describe('Syntax', () => {
        test('should render Syntax section heading', async ({page}) => {
            const heading = page.locator('h2#syntax');

            await expect(heading).toBeVisible();
        });

        test('should document Liquid syntax', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.LIQUID_SYNTAX);
        });

        test('should document directive syntax', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.DIRECTIVE_SYNTAX);
        });

        test('should render a markdown code block with cut example', async ({page}) => {
            const code = page
                .locator(selectors.codeBlock)
                .filter({hasText: CONTENT.LIQUID_SYNTAX})
                .first();

            await expect(code).toBeVisible();
        });
    });

    test.describe('Attributes', () => {
        test('should render Attributes section heading', async ({page}) => {
            const heading = page.locator('h2#attributes');

            await expect(heading).toBeVisible();
        });

        test('should render an attributes table', async ({page}) => {
            const table = page.locator('#attributes ~ table').first();

            await expect(table).toBeVisible();
        });

        test('should document the id attribute', async ({page}) => {
            const table = page.locator('#attributes ~ table').first();

            await expect(table).toContainText('id');
        });

        test('should document the name attribute for grouping', async ({page}) => {
            const table = page.locator('#attributes ~ table').first();

            await expect(table).toContainText('name');
        });

        test('should document the open attribute', async ({page}) => {
            const table = page.locator('#attributes ~ table').first();

            await expect(table).toContainText('open');
        });
    });

    test.describe('Token Types', () => {
        test('should render Token Types section heading', async ({page}) => {
            const heading = page.locator('h2#token-types');

            await expect(heading).toBeVisible();
        });

        test('should render a token types table', async ({page}) => {
            const table = page.locator('#token-types ~ table').first();

            await expect(table).toBeVisible();
        });

        test('should document yfm_cut token', async ({page}) => {
            const table = page.locator('#token-types ~ table').first();

            await expect(table).toContainText(CONTENT.TOKEN_CUT);
        });

        test('should document yfm_cut_title token', async ({page}) => {
            const table = page.locator('#token-types ~ table').first();

            await expect(table).toContainText(CONTENT.TOKEN_TITLE);
        });

        test('should document yfm_cut_content token', async ({page}) => {
            const table = page.locator('#token-types ~ table').first();

            await expect(table).toContainText(CONTENT.TOKEN_CONTENT);
        });
    });

    test.describe('CSS Classes', () => {
        test('should render CSS Classes section heading', async ({page}) => {
            const heading = page.locator('h2#css-classes');

            await expect(heading).toBeVisible();
        });

        test('should render a CSS classes table', async ({page}) => {
            const table = page.locator('#css-classes ~ table').first();

            await expect(table).toBeVisible();
        });

        test('should document yfm-cut class', async ({page}) => {
            const table = page.locator('#css-classes ~ table').first();

            await expect(table).toContainText(CONTENT.CLASS_CUT);
        });

        test('should document yfm-cut-title class', async ({page}) => {
            const table = page.locator('#css-classes ~ table').first();

            await expect(table).toContainText(CONTENT.CLASS_TITLE);
        });

        test('should document yfm-cut-content class', async ({page}) => {
            const table = page.locator('#css-classes ~ table').first();

            await expect(table).toContainText(CONTENT.CLASS_CONTENT);
        });

        test('should document yfm-cut-highlight class', async ({page}) => {
            const table = page.locator('#css-classes ~ table').first();

            await expect(table).toContainText(CONTENT.CLASS_HIGHLIGHT);
        });
    });

    test.describe('Transform Options', () => {
        test('should render Transform Options section heading', async ({page}) => {
            const heading = page.locator('h2#transform-options');

            await expect(heading).toBeVisible();
        });

        test('should render a TypeScript code block with transform import', async ({page}) => {
            const code = page
                .locator(selectors.codeBlock)
                .filter({hasText: CONTENT.TRANSFORM_FN})
                .filter({hasText: CONTENT.PACKAGE})
                .first();

            await expect(code).toBeVisible();
        });

        test('should document directiveSyntax disabled mode', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.DIRECTIVE_DISABLED);
        });

        test('should document directiveSyntax enabled mode', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.DIRECTIVE_ENABLED);
        });

        test('should document directiveSyntax only mode', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.DIRECTIVE_ONLY);
        });
    });

    test.describe('Runtime Controller', () => {
        test('should render Runtime Controller section heading', async ({page}) => {
            const heading = page.locator('h2#runtime-controller');

            await expect(heading).toBeVisible();
        });

        test('should mention YfmCutController class', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.RUNTIME_CLASS);
        });

        test('should mention highlight behavior', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('highlight');
        });
    });

    test.describe('API Exports', () => {
        test('should render API Exports section heading', async ({page}) => {
            const heading = page.locator('h2#api-exports');

            await expect(heading).toBeVisible();
        });

        test('should render an API exports table', async ({page}) => {
            const table = page.locator('#api-exports ~ table').first();

            await expect(table).toBeVisible();
        });

        test('should document transform export', async ({page}) => {
            const table = page.locator('#api-exports ~ table').first();

            await expect(table).toContainText(CONTENT.TRANSFORM_FN);
        });

        test('should document TransformOptions type export', async ({page}) => {
            const table = page.locator('#api-exports ~ table').first();

            await expect(table).toContainText(CONTENT.TRANSFORM_OPTIONS);
        });

        test('should document TokenType const export', async ({page}) => {
            const table = page.locator('#api-exports ~ table').first();

            await expect(table).toContainText('TokenType');
        });
    });

    test.describe('Usage Example', () => {
        test('should render Usage Example section heading', async ({page}) => {
            const heading = page.locator('h2#usage-example');

            await expect(heading).toBeVisible();
        });

        test('should render a TypeScript code block with usage example', async ({page}) => {
            const code = page
                .locator(selectors.codeBlock)
                .filter({hasText: 'new MarkdownIt'})
                .first();

            await expect(code).toBeVisible();
        });
    });

    test.describe('Package Information', () => {
        test('should render Package Information section heading', async ({page}) => {
            const heading = page.locator('h2#package-information');

            await expect(heading).toBeVisible();
        });

        test('should list dependencies from presets for-loop', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.DEP_DIRECTIVE);
            await expect(body).toContainText(CONTENT.DEP_UTILS);
        });

        test('should list exports from presets for-loop', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.PACKAGE);
            await expect(body).toContainText(CONTENT.EXPORT_RUNTIME);
        });

        test('should not leak liquid for-loop tags', async ({page}) => {
            const body = page.locator(selectors.body);

            const text = (await body.textContent()) ?? '';
            expect(text).not.toContain('{% for');
            expect(text).not.toContain('{% endfor');
        });
    });

    test.describe('Note directive', () => {
        test('should render a note block with Grouped cuts title', async ({page}) => {
            const note = page
                .locator('.yfm-note')
                .filter({hasText: CONTENT.GROUPED_NOTE});

            await expect(note).toBeVisible();
        });

        test('should mention mutually exclusive expansion in note', async ({page}) => {
            const note = page
                .locator('.yfm-note')
                .filter({hasText: CONTENT.GROUPED_NOTE});

            await expect(note).toContainText('collapse');
        });
    });

    test.describe('Live examples', () => {
        test('should render Live examples section heading', async ({page}) => {
            const heading = page.locator('h2#live-examples');

            await expect(heading).toBeVisible();
        });

        test('should render a basic cut with Expand me title', async ({page}) => {
            const cut = page.locator('details.yfm-cut').filter({hasText: CONTENT.LIVE_BASIC_TITLE});

            await expect(cut).toBeVisible();
            await expect(cut.locator('summary.yfm-cut-title')).toContainText(CONTENT.LIVE_BASIC_TITLE);
        });

        test('should hide basic cut content by default', async ({page}) => {
            const cut = page.locator('details.yfm-cut').filter({hasText: CONTENT.LIVE_BASIC_TITLE});
            const content = cut.locator('.yfm-cut-content');

            await expect(content).not.toBeVisible();
        });

        test('should expand basic cut on click', async ({page}) => {
            const cut = page.locator('details.yfm-cut').filter({hasText: CONTENT.LIVE_BASIC_TITLE});
            const summary = cut.locator('summary.yfm-cut-title');
            const content = cut.locator('.yfm-cut-content');

            await summary.click();
            await expect(cut).toHaveAttribute('open');
            await expect(content).toBeVisible();
        });

        test('should render a cut with Show code title', async ({page}) => {
            const cut = page.locator('details.yfm-cut').filter({hasText: CONTENT.LIVE_CODE_TITLE});

            await expect(cut).toBeVisible();
        });

        test('should render code block inside cut when expanded', async ({page}) => {
            const cut = page.locator('details.yfm-cut').filter({hasText: CONTENT.LIVE_CODE_TITLE});
            const summary = cut.locator('summary.yfm-cut-title');

            await summary.click();
            await expect(cut.locator('pre code')).toBeVisible();
        });

        test('should render open cut expanded by default', async ({page}) => {
            const cut = page.locator('details.yfm-cut').filter({hasText: CONTENT.LIVE_OPEN_TITLE});

            await expect(cut).toHaveAttribute('open');
        });

        test('should allow collapsing open cut', async ({page}) => {
            const cut = page.locator('details.yfm-cut').filter({hasText: CONTENT.LIVE_OPEN_TITLE});
            const summary = cut.locator('summary.yfm-cut-title');

            await summary.click();
            await expect(cut).not.toHaveAttribute('open');
        });
    });

    test.describe('TOC navigation', () => {
        test('should render sidebar navigation with Cut Extension link', async ({page}) => {
            const navLink = page
                .locator(selectors.tocLink)
                .filter({hasText: 'Cut Extension'});

            await expect(navLink).toBeVisible();
        });

        test('should have an href pointing to the cut-extension page', async ({page}) => {
            const navLink = page
                .locator(selectors.tocLink)
                .filter({hasText: 'Cut Extension'});

            const href = await navLink.first().getAttribute('href');
            expect(href).toBeTruthy();
            expect(href).toContain('cut-extension');
        });
    });

    test.describe('Mini TOC', () => {
        test('should render a mini TOC element', async ({page}) => {
            const miniToc = page.locator('.dc-mini-toc').first();

            await expect(miniToc).toBeVisible();
        });

        test('should list multiple sections in the mini TOC', async ({page}) => {
            const sections = page.locator('.dc-mini-toc__section');

            const count = await sections.count();
            expect(count).toBeGreaterThan(0);
        });
    });
});
