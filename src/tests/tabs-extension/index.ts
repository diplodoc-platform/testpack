import {expect, test} from '@playwright/test';

const selectors = {
    tocLink: '.dc-toc a',
    codeBlock: 'pre code',
    body: '.dc-doc-page__body',
} as const;

const CONTENT = {
    PAGE_TITLE: 'Tabs Extension',
    DESCRIPTION:
        'Testpack fixture exercising the @diplodoc/tabs-extension plugin rendering and documentation.',
    STAGE: 'preview',
    STAGE_UPPER: 'PREVIEW',
    TAGS: ['tabs', 'switchable', 'variants', 'extension'],
    PACKAGE: '@diplodoc/tabs-extension',
    VERSION: '3.10.7',
    LIST_SYNTAX: '{% list tabs',
    ENDLIST_SYNTAX: '{% endlist %}',
    VARIANT_REGULAR: 'regular',
    VARIANT_RADIO: 'radio',
    VARIANT_DROPDOWN: 'dropdown',
    VARIANT_ACCORDION: 'accordion',
    GROUP_ATTR: 'group=',
    CUSTOM_KEY_SYNTAX: '{#my-tab-1}',
    TRANSFORM_FN: 'transform',
    RUNTIME_CLASS: 'TabsController',
    REACT_COMPONENT: 'TabsRuntime',
    REACT_HOOK: 'useDiplodocTabs',
    CLASS_TABS: 'yfm-tabs',
    CLASS_TAB_LIST: 'yfm-tab-list',
    CLASS_TAB: 'yfm-tab',
    CLASS_TAB_PANEL: 'yfm-tab-panel',
    CLASS_ACTIVE: 'active',
    CLASS_DROPDOWN: 'yfm-tabs-dropdown',
    CLASS_DROPDOWN_SELECT: 'yfm-tabs-dropdown-select',
    CLASS_ACCORDION: 'yfm-tabs-accordion',
    CLASS_VERTICAL: 'yfm-tabs-vertical',
    CLASS_VERTICAL_TAB: 'yfm-vertical-tab',
    ATTR_GROUP: 'data-diplodoc-group',
    ATTR_KEY: 'data-diplodoc-key',
    ATTR_VARIANT: 'data-diplodoc-variant',
    ATTR_ID: 'data-diplodoc-id',
    ATTR_ACTIVE: 'data-diplodoc-is-active',
    ATTR_FORCED: 'data-diplodoc-forced',
    EXPORT_RUNTIME: '@diplodoc/tabs-extension/runtime',
    EXPORT_STYLES: '@diplodoc/tabs-extension/runtime/styles',
    EXPORT_REACT: '@diplodoc/tabs-extension/react',
    NOTE_TITLE: 'Tab keys',
} as const;

test.describe('Tabs Extension', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/tabs-extension');
    });

    test.describe('Page title', () => {
        test('should display Tabs Extension heading on page', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.PAGE_TITLE);
        });

        test('should set browser tab title to Tabs Extension', async ({page}) => {
            const title = await page.title();

            expect(title).toContain('Tabs Extension');
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

        test(' should mention switchable tabs', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('switchable');
        });

        test('should mention four render variants', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('Four render variants');
        });
    });

    test.describe('Syntax', () => {
        test('should render Syntax section heading', async ({page}) => {
            const heading = page.locator('h2#syntax');

            await expect(heading).toBeVisible();
        });

        test('should document list tabs syntax', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.LIST_SYNTAX);
        });

        test('should document endlist syntax', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.ENDLIST_SYNTAX);
        });

        test('should render a markdown code block with tabs example', async ({page}) => {
            const code = page
                .locator(selectors.codeBlock)
                .filter({hasText: CONTENT.LIST_SYNTAX})
                .first();

            await expect(code).toBeVisible();
        });

        test('should document group synchronization syntax', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.GROUP_ATTR);
        });

        test('should document custom tab keys syntax', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.CUSTOM_KEY_SYNTAX);
        });
    });

    test.describe('Variants table', () => {
        test('should render Variants section heading', async ({page}) => {
            const heading = page.locator('h2#render-variants');

            await expect(heading).toBeVisible();
        });

        test('should render a variants table', async ({page}) => {
            const table = page.locator('#render-variants ~ table').first();

            await expect(table).toBeVisible();
        });

        test('should document regular variant', async ({page}) => {
            const table = page.locator('#render-variants ~ table').first();

            await expect(table).toContainText(CONTENT.VARIANT_REGULAR);
        });

        test('should document radio variant', async ({page}) => {
            const table = page.locator('#render-variants ~ table').first();

            await expect(table).toContainText(CONTENT.VARIANT_RADIO);
        });

        test('should document dropdown variant', async ({page}) => {
            const table = page.locator('#render-variants ~ table').first();

            await expect(table).toContainText(CONTENT.VARIANT_DROPDOWN);
        });

        test('should document accordion variant', async ({page}) => {
            const table = page.locator('#render-variants ~ table').first();

            await expect(table).toContainText(CONTENT.VARIANT_ACCORDION);
        });
    });

    test.describe('Data Attributes', () => {
        test('should render Data Attributes section heading', async ({page}) => {
            const heading = page.locator('h2#data-attributes');

            await expect(heading).toBeVisible();
        });

        test('should render a data attributes table', async ({page}) => {
            const table = page.locator('#data-attributes ~ table').first();

            await expect(table).toBeVisible();
        });

        test('should document data-diplodoc-group attribute', async ({page}) => {
            const table = page.locator('#data-attributes ~ table').first();

            await expect(table).toContainText(CONTENT.ATTR_GROUP);
        });

        test('should document data-diplodoc-key attribute', async ({page}) => {
            const table = page.locator('#data-attributes ~ table').first();

            await expect(table).toContainText(CONTENT.ATTR_KEY);
        });

        test('should document data-diplodoc-variant attribute', async ({page}) => {
            const table = page.locator('#data-attributes ~ table').first();

            await expect(table).toContainText(CONTENT.ATTR_VARIANT);
        });

        test('should document data-diplodoc-is-active attribute', async ({page}) => {
            const table = page.locator('#data-attributes ~ table').first();

            await expect(table).toContainText(CONTENT.ATTR_ACTIVE);
        });

        test('should document data-diplodoc-forced attribute', async ({page}) => {
            const table = page.locator('#data-attributes ~ table').first();

            await expect(table).toContainText(CONTENT.ATTR_FORCED);
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

        test('should document yfm-tabs class', async ({page}) => {
            const table = page.locator('#css-classes ~ table').first();

            await expect(table).toContainText(CONTENT.CLASS_TABS);
        });

        test('should document yfm-tab-list class', async ({page}) => {
            const table = page.locator('#css-classes ~ table').first();

            await expect(table).toContainText(CONTENT.CLASS_TAB_LIST);
        });

        test('should document yfm-tab class', async ({page}) => {
            const table = page.locator('#css-classes ~ table').first();

            await expect(table).toContainText(CONTENT.CLASS_TAB);
        });

        test('should document yfm-tab-panel class', async ({page}) => {
            const table = page.locator('#css-classes ~ table').first();

            await expect(table).toContainText(CONTENT.CLASS_TAB_PANEL);
        });

        test('should document yfm-tabs-dropdown class', async ({page}) => {
            const table = page.locator('#css-classes ~ table').first();

            await expect(table).toContainText(CONTENT.CLASS_DROPDOWN);
        });

        test('should document yfm-tabs-accordion class', async ({page}) => {
            const table = page.locator('#css-classes ~ table').first();

            await expect(table).toContainText(CONTENT.CLASS_ACCORDION);
        });

        test('should document yfm-tabs-vertical class', async ({page}) => {
            const table = page.locator('#css-classes ~ table').first();

            await expect(table).toContainText(CONTENT.CLASS_VERTICAL);
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

        test('should document runtimeJsPath option', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('runtimeJsPath');
        });

        test('should document runtimeCssPath option', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('runtimeCssPath');
        });

        test('should document containerClasses option', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('containerClasses');
        });

        test('should document bundle option', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('bundle');
        });
    });

    test.describe('Runtime Controller', () => {
        test('should render Runtime Controller section heading', async ({page}) => {
            const heading = page.locator('h2#runtime-controller');

            await expect(heading).toBeVisible();
        });

        test('should mention TabsController class', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.RUNTIME_CLASS);
        });

        test('should mention keyboard navigation', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('keyboard');
        });

        test('should mention group synchronization', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('synchronization');
        });

        test('should mention localStorage persistence', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('localStorage');
        });
    });

    test.describe('React Integration', () => {
        test('should render React Integration section heading', async ({page}) => {
            const heading = page.locator('h2#react-integration');

            await expect(heading).toBeVisible();
        });

        test('should render a TypeScript code block with TabsRuntime', async ({page}) => {
            const code = page
                .locator(selectors.codeBlock)
                .filter({hasText: CONTENT.REACT_COMPONENT})
                .first();

            await expect(code).toBeVisible();
        });

        test('should document useDiplodocTabs hook', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.REACT_HOOK);
        });

        test('should render a hook methods table', async ({page}) => {
            const table = page.locator('#react-integration ~ table').first();

            await expect(table).toBeVisible();
        });

        test('should document selectTab method', async ({page}) => {
            const table = page.locator('#react-integration ~ table').first();

            await expect(table).toContainText('selectTab');
        });

        test('should document selectTabById method', async ({page}) => {
            const table = page.locator('#react-integration ~ table').first();

            await expect(table).toContainText('selectTabById');
        });

        test('should document configure method', async ({page}) => {
            const table = page.locator('#react-integration ~ table').first();

            await expect(table).toContainText('configure');
        });

        test('should document restoreTabs method', async ({page}) => {
            const table = page.locator('#react-integration ~ table').first();

            await expect(table).toContainText('restoreTabs');
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

        test('should document runtime export', async ({page}) => {
            const table = page.locator('#api-exports ~ table').first();

            await expect(table).toContainText('./runtime');
        });

        test('should document react export', async ({page}) => {
            const table = page.locator('#api-exports ~ table').first();

            await expect(table).toContainText('./react');
        });
    });

    test.describe('Usage Example', () => {
        test('should render Usage Example section heading', async ({page}) => {
            const heading = page.locator('h2#usage-example');

            await expect(heading).toBeVisible();
        });

        test('should render a TypeScript code block with MarkdownIt usage', async ({page}) => {
            const code = page
                .locator(selectors.codeBlock)
                .filter({hasText: 'new MarkdownIt'})
                .first();

            await expect(code).toBeVisible();
        });

        test('should include list tabs syntax in usage example', async ({page}) => {
            const code = page
                .locator(selectors.codeBlock)
                .filter({hasText: 'new MarkdownIt'})
                .first();

            await expect(code).toContainText(CONTENT.LIST_SYNTAX);
        });
    });

    test.describe('Package Information', () => {
        test('should render Package Information section heading', async ({page}) => {
            const heading = page.locator('h2#package-information');

            await expect(heading).toBeVisible();
        });

        test('should list variants from presets for-loop', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.VARIANT_REGULAR);
            await expect(body).toContainText(CONTENT.VARIANT_RADIO);
            await expect(body).toContainText(CONTENT.VARIANT_DROPDOWN);
            await expect(body).toContainText(CONTENT.VARIANT_ACCORDION);
        });

        test('should list exports from presets for-loop', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.EXPORT_RUNTIME);
            await expect(body).toContainText(CONTENT.EXPORT_REACT);
        });

        test('should not leak liquid for-loop tags', async ({page}) => {
            const body = page.locator(selectors.body);

            const text = (await body.textContent()) ?? '';
            expect(text).not.toContain('{% for');
            expect(text).not.toContain('{% endfor');
        });
    });

    test.describe('Note directive', () => {
        test('should render a note block with Tab keys title', async ({page}) => {
            const note = page.locator('.yfm-note').filter({hasText: CONTENT.NOTE_TITLE});

            await expect(note).toBeVisible();
        });

        test('should mention GitHub anchors style in note', async ({page}) => {
            const note = page.locator('.yfm-note').filter({hasText: CONTENT.NOTE_TITLE});

            await expect(note).toContainText('GitHub anchors');
        });
    });

    test.describe('Live examples — Regular tabs', () => {
        test('should render a regular tabs container', async ({page}) => {
            const container = page
                .locator(`.${CONTENT.CLASS_TABS}`)
                .filter({hasText: 'Linux content.'})
                .first();

            await expect(container).toBeVisible();
        });

        test('should set data-diplodoc-variant to regular', async ({page}) => {
            const container = page
                .locator(`.${CONTENT.CLASS_TABS}`)
                .filter({hasText: 'Linux content.'})
                .first();

            await expect(container).toHaveAttribute(CONTENT.ATTR_VARIANT, 'regular');
        });

        test('should render three tab buttons in regular tabs', async ({page}) => {
            const container = page
                .locator(`.${CONTENT.CLASS_TABS}`)
                .filter({hasText: 'Windows content.'})
                .first();
            const tabs = container.locator(`.${CONTENT.CLASS_TAB_LIST} .${CONTENT.CLASS_TAB}`);

            await expect(tabs).toHaveCount(3);
        });

        test('should render three tab panels in regular tabs', async ({page}) => {
            const container = page
                .locator(`.${CONTENT.CLASS_TABS}`)
                .filter({hasText: 'Linux content.'})
                .first();
            const panels = container.locator(`.${CONTENT.CLASS_TAB_PANEL}`);

            await expect(panels).toHaveCount(3);
        });

        test('should have first tab active by default', async ({page}) => {
            const container = page
                .locator(`.${CONTENT.CLASS_TABS}`)
                .filter({hasText: 'Linux content.'})
                .first();
            const tabs = container.locator(`.${CONTENT.CLASS_TAB_LIST} .${CONTENT.CLASS_TAB}`);

            await expect(tabs.nth(0)).toHaveClass(/active/);
        });

        test('should switch active tab on click', async ({page}) => {
            const container = page
                .locator(`.${CONTENT.CLASS_TABS}`)
                .filter({hasText: 'Linux content.'})
                .first();
            const tabs = container.locator(`.${CONTENT.CLASS_TAB_LIST} .${CONTENT.CLASS_TAB}`);

            await tabs.nth(2).click();

            await expect(tabs.nth(2)).toHaveClass(/active/);
            await expect(tabs.nth(0)).not.toHaveClass(/active/);
        });
    });

    test.describe('Live examples — Grouped tabs', () => {
        test('should render two grouped tab containers', async ({page}) => {
            const containers = page.locator(
                `.${CONTENT.CLASS_TABS}[${CONTENT.ATTR_GROUP}="live_demo"]`,
            );

            await expect(containers).toHaveCount(2);
        });

        test('should set data-diplodoc-group on grouped containers', async ({page}) => {
            const containers = page.locator(
                `.${CONTENT.CLASS_TABS}[${CONTENT.ATTR_GROUP}="live_demo"]`,
            );

            await expect(containers.nth(0)).toHaveAttribute(CONTENT.ATTR_GROUP, 'live_demo');
            await expect(containers.nth(1)).toHaveAttribute(CONTENT.ATTR_GROUP, 'live_demo');
        });

        test('should sync active tab across grouped containers on click', async ({page}) => {
            const containers = page.locator(
                `.${CONTENT.CLASS_TABS}[${CONTENT.ATTR_GROUP}="live_demo"]`,
            );
            const firstTabs = containers
                .nth(0)
                .locator(`.${CONTENT.CLASS_TAB_LIST} .${CONTENT.CLASS_TAB}`);
            const secondTabs = containers
                .nth(1)
                .locator(`.${CONTENT.CLASS_TAB_LIST} .${CONTENT.CLASS_TAB}`);

            await firstTabs.nth(1).click();

            await expect(firstTabs.nth(1)).toHaveClass(/active/);
            await expect(secondTabs.nth(1)).toHaveClass(/active/);
        });
    });

    test.describe('Live examples — Radio variant', () => {
        test('should render a radio variant container', async ({page}) => {
            const container = page
                .locator(`[${CONTENT.ATTR_VARIANT}="${CONTENT.VARIANT_RADIO}"]`)
                .first();

            await expect(container).toBeVisible();
        });

        test('should set data-diplodoc-variant to radio', async ({page}) => {
            const container = page
                .locator(`[${CONTENT.ATTR_VARIANT}="${CONTENT.VARIANT_RADIO}"]`)
                .first();

            await expect(container).toHaveAttribute(CONTENT.ATTR_VARIANT, CONTENT.VARIANT_RADIO);
        });

        test('should render two vertical tabs in radio variant', async ({page}) => {
            const container = page
                .locator(`[${CONTENT.ATTR_VARIANT}="${CONTENT.VARIANT_RADIO}"]`)
                .first();
            const tabs = container.locator(`.${CONTENT.CLASS_VERTICAL_TAB}`);

            await expect(tabs).toHaveCount(2);
        });

        test('should render two panels in radio variant', async ({page}) => {
            const container = page
                .locator(`[${CONTENT.ATTR_VARIANT}="${CONTENT.VARIANT_RADIO}"]`)
                .first();
            const panels = container.locator(`.${CONTENT.CLASS_TAB_PANEL}`);

            await expect(panels).toHaveCount(2);
        });

        test('should toggle active state on click in radio variant', async ({page}) => {
            const container = page
                .locator(`[${CONTENT.ATTR_VARIANT}="${CONTENT.VARIANT_RADIO}"]`)
                .first();
            const tabs = container.locator(`.${CONTENT.CLASS_VERTICAL_TAB}`);
            const panels = container.locator(`.${CONTENT.CLASS_TAB_PANEL}`);

            await tabs.nth(1).evaluate((el: HTMLElement) => el.click());

            await expect(tabs.nth(1)).toHaveClass(/active/);
            await expect(panels.nth(1)).toHaveClass(/active/);
        });
    });

    test.describe('Live examples — Dropdown variant', () => {
        test('should render a dropdown variant container', async ({page}) => {
            const container = page
                .locator(`[${CONTENT.ATTR_VARIANT}="${CONTENT.VARIANT_DROPDOWN}"]`)
                .first();

            await expect(container).toBeVisible();
        });

        test('should set data-diplodoc-variant to dropdown', async ({page}) => {
            const container = page
                .locator(`[${CONTENT.ATTR_VARIANT}="${CONTENT.VARIANT_DROPDOWN}"]`)
                .first();

            await expect(container).toHaveAttribute(CONTENT.ATTR_VARIANT, CONTENT.VARIANT_DROPDOWN);
        });

        test('should render a dropdown select element', async ({page}) => {
            const container = page
                .locator(`[${CONTENT.ATTR_VARIANT}="${CONTENT.VARIANT_DROPDOWN}"]`)
                .first();
            const select = container.locator(`.${CONTENT.CLASS_DROPDOWN_SELECT}`);

            await expect(select).toBeVisible();
        });

        test('should render two tab buttons in dropdown variant', async ({page}) => {
            const container = page
                .locator(`[${CONTENT.ATTR_VARIANT}="${CONTENT.VARIANT_DROPDOWN}"]`)
                .first();
            const tabs = container.locator(`.${CONTENT.CLASS_TAB}`);

            await expect(tabs).toHaveCount(2);
        });

        test('should update active panel when selecting dropdown item', async ({page}) => {
            const container = page
                .locator(`[${CONTENT.ATTR_VARIANT}="${CONTENT.VARIANT_DROPDOWN}"]`)
                .first();
            const select = container.locator(`.${CONTENT.CLASS_DROPDOWN_SELECT}`);
            const tabs = container.locator(`.${CONTENT.CLASS_TAB}`);

            await select.click();
            await tabs.nth(1).click();

            const panels = container.locator(`> .${CONTENT.CLASS_TAB_PANEL}`);
            await expect(panels.nth(1)).toHaveClass(/active/);
        });
    });

    test.describe('Live examples — Accordion variant', () => {
        test('should render an accordion variant container', async ({page}) => {
            const container = page
                .locator(`[${CONTENT.ATTR_VARIANT}="${CONTENT.VARIANT_ACCORDION}"]`)
                .first();

            await expect(container).toBeVisible();
        });

        test('should set data-diplodoc-variant to accordion', async ({page}) => {
            const container = page
                .locator(`[${CONTENT.ATTR_VARIANT}="${CONTENT.VARIANT_ACCORDION}"]`)
                .first();

            await expect(container).toHaveAttribute(
                CONTENT.ATTR_VARIANT,
                CONTENT.VARIANT_ACCORDION,
            );
        });

        test('should render two tab buttons in accordion variant', async ({page}) => {
            const container = page
                .locator(`[${CONTENT.ATTR_VARIANT}="${CONTENT.VARIANT_ACCORDION}"]`)
                .first();
            const tabs = container.locator(`.${CONTENT.CLASS_TAB}`);

            await expect(tabs).toHaveCount(2);
        });

        test('should render two panels in accordion variant', async ({page}) => {
            const container = page
                .locator(`[${CONTENT.ATTR_VARIANT}="${CONTENT.VARIANT_ACCORDION}"]`)
                .first();
            const panels = container.locator(`.${CONTENT.CLASS_TAB_PANEL}`);

            await expect(panels).toHaveCount(2);
        });

        test('should expand panel on click in accordion variant', async ({page}) => {
            const container = page
                .locator(`[${CONTENT.ATTR_VARIANT}="${CONTENT.VARIANT_ACCORDION}"]`)
                .first();
            const tabs = container.locator(`.${CONTENT.CLASS_TAB}`);
            const panels = container.locator(`.${CONTENT.CLASS_TAB_PANEL}`);

            await tabs.nth(0).click();

            await expect(panels.nth(0)).toHaveClass(/active/);
        });
    });

    test.describe('TOC navigation', () => {
        test('should render sidebar navigation with Tabs Extension link', async ({page}) => {
            const navLink = page.locator(selectors.tocLink).filter({hasText: 'Tabs Extension'});

            await expect(navLink).toBeVisible();
        });

        test('should have an href pointing to the tabs-extension page', async ({page}) => {
            const navLink = page.locator(selectors.tocLink).filter({hasText: 'Tabs Extension'});

            const href = await navLink.first().getAttribute('href');
            expect(href).toBeTruthy();
            expect(href).toContain('tabs-extension');
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
