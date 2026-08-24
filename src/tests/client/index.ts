import {expect, test} from '@playwright/test';

const selectors = {
    tocLink: '.yfm-sidebar a, .docs-sidebar a, nav a',
} as const;

const CONTENT = {
    PAGE_TITLE: 'Client',
    PAGE_DESCRIPTION:
        'E2E tests for the @diplodoc/client browser SPA — root layout, theme management, header navigation, settings controls, and router behavior.',
    STAGE_LABEL: 'NEW',
    TAGS: ['client', 'spa', 'runtime', 'theme'],
    H2_ROOT_LAYOUT: 'Root layout',
    H2_HEADER_NAVIGATION: 'Header navigation',
    H3_NAVIGATION_LINKS: 'Navigation links',
    H2_SETTINGS_CONTROLS: 'Settings controls',
    H3_THEME_SWITCHING: 'Theme switching',
    H3_WIDE_FORMAT: 'Wide format',
    H3_MINI_TOC_VISIBILITY: 'Mini-toc visibility',
    H3_TEXT_SIZE: 'Text size',
    H2_ROUTER_BEHAVIOR: 'Router behavior',
    H2_CONTENT_SECTIONS: 'Content sections',
    H3_FIRST_SECTION: 'First section',
    H3_SECOND_SECTION: 'Second section',
    H3_THIRD_SECTION: 'Third section',
    H2_INLINE_CONTENT: 'Inline content',
    BOLD_TEXT: 'bold text',
    ITALIC_TEXT: 'italic text',
    INLINE_CODE: 'inline code',
    UL_ITEM_ONE: 'Unordered list item one',
    UL_ITEM_TWO: 'Unordered list item two',
    UL_ITEM_THREE: 'Unordered list item three',
    OL_ITEM_ONE: 'Ordered list item one',
    TABLE_HEADER_FEATURE: 'Feature',
    TABLE_HEADER_COMPONENT: 'Component',
    TABLE_HEADER_CLASS: 'Class',
    INTRO_TEXT: '@diplodoc/client',
} as const;

test.describe('Client', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/client');
    });

    test.describe('Root layout', () => {
        test('should add g-root class to body element', async ({page}) => {
            const bodyClass = await page.evaluate(() => document.body.className);

            expect(bodyClass).toContain('g-root');
        });

        test('should apply light theme class by default', async ({page}) => {
            const bodyClass = await page.evaluate(() => document.body.className);

            expect(bodyClass).toContain('g-root_theme_light');
        });

        test('should apply wide-format class by default', async ({page}) => {
            const bodyClass = await page.evaluate(() => document.body.className);

            expect(bodyClass).toContain('dc-root_wide-format');
        });

        test('should apply document-page class', async ({page}) => {
            const bodyClass = await page.evaluate(() => document.body.className);

            expect(bodyClass).toContain('dc-root_document-page');
        });

        test('should apply desktop class for desktop viewport', async ({page}) => {
            const bodyClass = await page.evaluate(() => document.body.className);

            expect(bodyClass).toContain('desktop');
        });

        test('should render App container', async ({page}) => {
            const app = page.locator('.App');

            await expect(app).toBeVisible();
        });
    });

    test.describe('Page title and frontmatter', () => {
        test('should display page title heading', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.PAGE_TITLE);
        });

        test('should render stage label mark for new stage', async ({page}) => {
            const mark = page.locator('.dc-mark');

            await expect(mark).toBeVisible();
            await expect(mark).toContainText(CONTENT.STAGE_LABEL);
        });

        test('should uppercase stage label text', async ({page}) => {
            const mark = page.locator('.dc-mark');
            const text = await mark.textContent();

            expect(text).toBe(text?.toUpperCase());
        });

        test('should render tags from frontmatter', async ({page}) => {
            const tags = page.locator('.dc-tags__tag');

            await expect(tags).toHaveCount(CONTENT.TAGS.length);

            for (const tag of CONTENT.TAGS) {
                await expect(tags.filter({hasText: tag})).toHaveCount(1);
            }
        });

        test('should render meta description tag', async ({page}) => {
            const meta = page.locator('meta[name="description"]');

            await expect(meta).toHaveAttribute('content', CONTENT.PAGE_DESCRIPTION);
        });
    });

    test.describe('Doc page layout', () => {
        test('should render doc layout container', async ({page}) => {
            const layout = page.locator('.dc-doc-layout');

            await expect(layout).toBeVisible();
        });

        test('should render doc page container', async ({page}) => {
            const docPage = page.locator('.dc-doc-page');

            await expect(docPage).toBeVisible();
        });

        test('should render body with yfm class', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toBeVisible();
            await expect(body).toHaveClass(/yfm/);
        });

        test('should apply text-size modifier to body', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toHaveClass(/dc-doc-page__body_text-size_/);
        });

        test('should render main content area', async ({page}) => {
            const main = page.locator('.dc-doc-page__main');

            await expect(main).toBeVisible();
        });

        test('should render aside panel', async ({page}) => {
            const aside = page.locator('.dc-doc-page__aside');

            await expect(aside).toBeVisible();
        });
    });

    test.describe('Sidebar TOC', () => {
        test('should render TOC navigation element', async ({page}) => {
            const toc = page.locator('.dc-toc');

            await expect(toc).toBeVisible();
        });

        test('should mark current page as active in TOC', async ({page}) => {
            const activeItem = page.locator('.dc-toc__list-item_active');

            await expect(activeItem).toBeVisible();
            await expect(activeItem).toContainText(CONTENT.PAGE_TITLE);
        });

        test('should navigate to another page via sidebar link', async ({page}) => {
            const tabsLink = page
                .locator('.dc-toc__list-item a', {hasText: 'Tabs'});

            await tabsLink.click();

            await expect(page).toHaveURL(/tabs\.html/);
        });
    });

    test.describe('Mini TOC', () => {
        test('should render mini-toc navigation element', async ({page}) => {
            const miniToc = page.locator('.dc-mini-toc');

            await expect(miniToc).toBeVisible();
        });

        test('should render mini-toc title', async ({page}) => {
            const title = page.locator('.dc-mini-toc__title');

            await expect(title).toBeVisible();
            await expect(title).not.toBeEmpty();
        });

        test('should list page headings as sections', async ({page}) => {
            const sections = page.locator('.dc-mini-toc__section');

            const count = await sections.count();
            expect(count).toBeGreaterThan(0);
        });

        test('should mark first section as active on page load', async ({page}) => {
            const firstSection = page.locator('.dc-mini-toc__section').first();

            await expect(firstSection).toHaveClass(/dc-mini-toc__section_active/);
        });

        test('should have data-hash attributes on sections', async ({page}) => {
            const sections = page.locator('.dc-mini-toc__section');

            const count = await sections.count();
            for (let i = 0; i < count; i++) {
                const hash = await sections.nth(i).getAttribute('data-hash');
                expect(hash).toBeTruthy();
            }
        });
    });

    test.describe('Content rendering', () => {
        test('should render page description text in body', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.INTRO_TEXT);
        });

        test('should render h2 headings in body', async ({page}) => {
            const h2s = page.locator('.dc-doc-page__body h2');

            const count = await h2s.count();
            expect(count).toBeGreaterThanOrEqual(5);
            await expect(h2s.filter({hasText: CONTENT.H2_ROOT_LAYOUT})).toHaveCount(1);
            await expect(h2s.filter({hasText: CONTENT.H2_HEADER_NAVIGATION})).toHaveCount(1);
            await expect(h2s.filter({hasText: CONTENT.H2_SETTINGS_CONTROLS})).toHaveCount(1);
            await expect(h2s.filter({hasText: CONTENT.H2_ROUTER_BEHAVIOR})).toHaveCount(1);
            await expect(h2s.filter({hasText: CONTENT.H2_CONTENT_SECTIONS})).toHaveCount(1);
        });

        test('should render h3 headings in body', async ({page}) => {
            const h3s = page.locator('.dc-doc-page__body h3');

            const count = await h3s.count();
            expect(count).toBeGreaterThanOrEqual(5);
            await expect(h3s.filter({hasText: CONTENT.H3_FIRST_SECTION})).toHaveCount(1);
            await expect(h3s.filter({hasText: CONTENT.H3_SECOND_SECTION})).toHaveCount(1);
            await expect(h3s.filter({hasText: CONTENT.H3_THIRD_SECTION})).toHaveCount(1);
        });

        test('should render inline formatting in body', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body.locator('strong')).toContainText(CONTENT.BOLD_TEXT);
            await expect(body.locator('em')).toContainText(CONTENT.ITALIC_TEXT);
            await expect(
                body.locator('code.yfm-clipboard-inline-code', {hasText: CONTENT.INLINE_CODE}),
            ).toHaveCount(1);
        });

        test('should render unordered list in body', async ({page}) => {
            const list = page.locator('.dc-doc-page__body ul').first();
            const items = list.locator('li');

            await expect(items).toHaveCount(3);
            await expect(items.first()).toContainText(CONTENT.UL_ITEM_ONE);
            await expect(items.nth(1)).toContainText(CONTENT.UL_ITEM_TWO);
            await expect(items.nth(2)).toContainText(CONTENT.UL_ITEM_THREE);
        });

        test('should render ordered list in body', async ({page}) => {
            const list = page.locator('.dc-doc-page__body ol').first();
            const items = list.locator('li');

            await expect(items).toHaveCount(3);
            await expect(items.first()).toContainText(CONTENT.OL_ITEM_ONE);
        });

        test('should render table in body', async ({page}) => {
            const table = page.locator('.dc-doc-page__body table');

            await expect(table).toBeVisible();
            await expect(table.locator('th')).toHaveCount(3);
            await expect(table.locator('th').first()).toContainText(CONTENT.TABLE_HEADER_FEATURE);
            await expect(table.locator('th').nth(1)).toContainText(
                CONTENT.TABLE_HEADER_COMPONENT,
            );
            await expect(table.locator('th').nth(2)).toContainText(CONTENT.TABLE_HEADER_CLASS);
        });

        test('should render heading anchor links', async ({page}) => {
            const anchors = page.locator('.dc-doc-page__body h2 a.yfm-anchor');

            const count = await anchors.count();
            expect(count).toBeGreaterThanOrEqual(5);
        });
    });

    test.describe('Content mini-toc', () => {
        test('should render content mini-toc container', async ({page}) => {
            const contentMiniToc = page.locator('.dc-doc-page__content-mini-toc');

            await expect(contentMiniToc).toHaveCount(1);
        });

        test('should link to heading anchors', async ({page}) => {
            const links = page.locator('.dc-doc-page__content-mini-toc a');

            const count = await links.count();
            expect(count).toBeGreaterThan(0);
            for (let i = 0; i < count; i++) {
                const href = await links.nth(i).getAttribute('href');
                expect(href).toMatch(/#/);
            }
        });
    });

    test.describe('Header navigation', () => {
        test('should render header navigation with logo', async ({page}) => {
            const logo = page.locator('.header__logo, .g-logo, [class*="logo"]');

            const count = await logo.count();
            expect(count).toBeGreaterThan(0);
        });

        test('should render header navigation links from toc.yaml', async ({page}) => {
            const navLinks = page.locator('nav a, .header a, [class*="nav"] a', {
                hasText: 'Relative link',
            });

            const count = await navLinks.count();
            expect(count).toBeGreaterThan(0);
        });

        test('should render absolute link in header', async ({page}) => {
            const navLinks = page.locator('nav a, .header a, [class*="nav"] a', {
                hasText: 'Absolute link',
            });

            const count = await navLinks.count();
            expect(count).toBeGreaterThan(0);
        });
    });

    test.describe('Router behavior', () => {
        test('should navigate to hash on page load', async ({page}) => {
            await page.goto('./ru/syntax/client#first-section');

            const heading = page.locator('#first-section');

            await expect(heading).toBeVisible();
            await expect(heading).toContainText(CONTENT.H3_FIRST_SECTION);
        });

        test('should scroll to hash element', async ({page}) => {
            await page.goto('./ru/syntax/client#third-section');

            const heading = page.locator('#third-section');

            await expect(heading).toBeVisible();
            await expect(heading).toContainText(CONTENT.H3_THIRD_SECTION);
        });

        test('should update hash navigation on link click', async ({page}) => {
            const inlineLink = page.locator('.dc-doc-page__body a[href*="root-layout"]').first();

            await inlineLink.click();

            await expect(page).toHaveURL(/#root-layout/);
        });
    });

    test.describe('Settings controls', () => {
        test('should open settings popover on controls button click', async ({page}) => {
            const settingsBtn = page.locator('button[aria-label="Настройки"]');

            await settingsBtn.click();

            const popover = page.locator('.dc-settings-control__popup');
            await expect(popover).toBeVisible();
        });

        test('should toggle dark theme via settings popover', async ({page}) => {
            const settingsBtn = page.locator('button[aria-label="Настройки"]');
            await settingsBtn.click();

            const darkThemeItem = page
                .locator('.dc-settings-control__list-item')
                .filter({hasText: 'Темная'});
            const themeLabel = darkThemeItem.locator('label.g-switch');

            await themeLabel.click();

            const bodyClass = await page.evaluate(() => document.body.className);
            expect(bodyClass).toContain('g-root_theme_dark');
        });

        test('should toggle wide format via settings popover', async ({page}) => {
            const settingsBtn = page.locator('button[aria-label="Настройки"]');
            await settingsBtn.click();

            const wideFormatItem = page
                .locator('.dc-settings-control__list-item')
                .filter({hasText: 'Широкий формат'});
            const wideLabel = wideFormatItem.locator('label.g-switch');

            await wideLabel.click();

            const bodyClass = await page.evaluate(() => document.body.className);
            expect(bodyClass).not.toContain('dc-root_wide-format');
        });

        test('should render text size options in settings popover', async ({page}) => {
            const settingsBtn = page.locator('button[aria-label="Настройки"]');
            await settingsBtn.click();

            const textSizeItem = page
                .locator('.dc-settings-control__list-item')
                .filter({hasText: 'Размер текста'});

            await expect(textSizeItem).toBeVisible();
        });
    });

    test.describe('TOC navigation', () => {
        test('should render sidebar navigation with Client link', async ({page}) => {
            const navLink = page.locator(selectors.tocLink).filter({hasText: 'Client'});

            await expect(navLink).toBeVisible();
        });

        test('should have Client page link in sidebar', async ({page}) => {
            const navLink = page.locator(selectors.tocLink).filter({hasText: 'Client'});

            const href = await navLink.first().getAttribute('href');
            expect(href).toBeTruthy();
            expect(href).toContain('client');
        });
    });
});
