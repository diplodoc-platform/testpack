import {expect, test} from '@playwright/test';

const CONTENT = {
    PAGE_TITLE: 'Components',
    STAGE_LABEL: 'PREVIEW',
    TAGS: ['rendering', 'layout', 'ui'],
    TOC_ACTIVE_ITEM: 'Components',
    TOC_ITEM_TABS: 'Tabs',
    TOC_ITEM_CUT: 'Cut',
    TOC_ITEM_MERMAID: 'Mermaid',
    BODY_TEXT: '@diplodoc/components',
    H2_PAGE_LAYOUT: 'Page layout',
    H2_HEADINGS_MINI_TOC: 'Headings and mini-toc',
    H2_CONTENT_RENDERING: 'Content rendering',
    H2_FEEDBACK_WIDGET: 'Feedback widget',
    H2_SIDEBAR_NAVIGATION: 'Sidebar navigation',
    H3_LAYOUT_STRUCTURE: 'Layout structure',
    H3_SUBSECTION_ALPHA: 'Subsection alpha',
    H3_SUBSECTION_BETA: 'Subsection beta',
    H3_SUBSECTION_GAMMA: 'Subsection gamma',
    H3_INLINE_FORMATTING: 'Paragraphs and inline formatting',
    H3_LISTS: 'Lists',
    H3_CODE_BLOCKS: 'Code blocks',
    H3_TABLES: 'Tables',
    CODE_TEXT: 'interface DocPageProps',
    TABLE_HEADER_COMPONENT: 'Component',
    TABLE_HEADER_BLOCK_CLASS: 'Block class',
    LIST_ITEM_FIRST: 'First item',
    BOLD_TEXT: 'Bold text',
    ITALIC_TEXT: 'italic text',
    INLINE_CODE: 'inline code',
} as const;

const MINI_TOC_SECTIONS = [
    CONTENT.H2_PAGE_LAYOUT,
    CONTENT.H3_LAYOUT_STRUCTURE,
    CONTENT.H2_HEADINGS_MINI_TOC,
    CONTENT.H3_SUBSECTION_ALPHA,
    CONTENT.H3_SUBSECTION_BETA,
    CONTENT.H3_SUBSECTION_GAMMA,
    CONTENT.H2_CONTENT_RENDERING,
    CONTENT.H3_INLINE_FORMATTING,
    CONTENT.H3_LISTS,
    CONTENT.H3_CODE_BLOCKS,
    CONTENT.H3_TABLES,
    CONTENT.H2_FEEDBACK_WIDGET,
    CONTENT.H2_SIDEBAR_NAVIGATION,
] as const;

test.describe('Components', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/components');
    });

    test.describe('Page layout', () => {
        test('should render root layout container', async ({page}) => {
            const layout = page.locator('.dc-doc-layout');

            await expect(layout).toBeVisible();
        });

        test('should render doc page container inside layout', async ({page}) => {
            const docPage = page.locator('.dc-doc-page');

            await expect(docPage).toBeVisible();
            await expect(docPage).toHaveClass(/dc-doc-page/);
        });

        test('should render content area as main element', async ({page}) => {
            const content = page.locator('.dc-doc-page__content');

            await expect(content).toBeVisible();
        });

        test('should render body with yfm class for YFM styling', async ({page}) => {
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

        test('should render right aside panel', async ({page}) => {
            const aside = page.locator('.dc-doc-page__aside');

            await expect(aside).toBeVisible();
        });

        test('should render content mini-toc inside content area', async ({page}) => {
            const contentMiniToc = page.locator('.dc-doc-page__content-mini-toc');

            await expect(contentMiniToc).toHaveCount(1);
        });
    });

    test.describe('Page title and stage label', () => {
        test('should display page title heading', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.PAGE_TITLE);
        });

        test('should render page title container', async ({page}) => {
            const titleContainer = page.locator('.dc-doc-page__title');

            await expect(titleContainer).toBeVisible();
        });

        test('should render stage label mark for preview stage', async ({page}) => {
            const mark = page.locator('.dc-mark');

            await expect(mark).toBeVisible();
            await expect(mark).toContainText(CONTENT.STAGE_LABEL);
        });

        test('should apply blue color modifier to preview stage label', async ({page}) => {
            const mark = page.locator('.dc-mark');

            await expect(mark).toHaveClass(/dc-mark_color_blue/);
        });

        test('should apply size modifier to stage label', async ({page}) => {
            const mark = page.locator('.dc-mark');

            await expect(mark).toHaveClass(/dc-mark_size_/);
        });

        test('should uppercase stage label text', async ({page}) => {
            const mark = page.locator('.dc-mark');

            await expect(mark).toContainText(CONTENT.STAGE_LABEL);
            const text = await mark.textContent();
            expect(text).toBe(text?.toUpperCase());
        });
    });

    test.describe('Sidebar TOC', () => {
        test('should render TOC navigation element', async ({page}) => {
            const toc = page.locator('.dc-toc');

            await expect(toc).toBeVisible();
        });

        test('should render TOC list with items', async ({page}) => {
            const list = page.locator('.dc-toc__list').first();
            const items = list.locator('.dc-toc__list-item');

            await expect(list).toBeVisible();
            await expect(items).toHaveCount(34);
        });

        test('should mark current page as active in TOC', async ({page}) => {
            const activeItem = page.locator('.dc-toc__list-item_active');

            await expect(activeItem).toBeVisible();
            await expect(activeItem).toContainText(CONTENT.TOC_ACTIVE_ITEM);
        });

        test('should contain navigation links to other pages', async ({page}) => {
            const tabsLink = page.locator('.dc-toc__list-item a', {hasText: CONTENT.TOC_ITEM_TABS});

            await expect(tabsLink).toHaveCount(1);
            await expect(tabsLink).toHaveAttribute('href', /tabs\.html/);
        });

        test('should contain link to mermaid page', async ({page}) => {
            const mermaidLink = page.locator('.dc-toc__list-item a', {
                hasText: CONTENT.TOC_ITEM_MERMAID,
            });

            await expect(mermaidLink).toHaveCount(1);
        });

        test('should navigate to another page when clicking TOC link', async ({page}) => {
            const cutLink = page.locator('.dc-toc__list-item a', {hasText: CONTENT.TOC_ITEM_CUT});

            await cutLink.click();

            await expect(page).toHaveURL(/cut\.html/);
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

        test('should list all page headings as sections', async ({page}) => {
            const sections = page.locator('.dc-mini-toc__section');

            await expect(sections).toHaveCount(MINI_TOC_SECTIONS.length);
        });

        test('should render section links with heading text', async ({page}) => {
            const links = page.locator('.dc-mini-toc__section-link');

            await expect(links).toHaveCount(MINI_TOC_SECTIONS.length);

            for (const text of MINI_TOC_SECTIONS) {
                await expect(links.filter({hasText: text})).toHaveCount(1);
            }
        });

        test('should mark h3 subsections as child sections', async ({page}) => {
            const childSections = page.locator('.dc-mini-toc__section_child');

            const expectedChildren = MINI_TOC_SECTIONS.filter(
                (s) => s === CONTENT.H3_LAYOUT_STRUCTURE ||
                    s === CONTENT.H3_SUBSECTION_ALPHA ||
                    s === CONTENT.H3_SUBSECTION_BETA ||
                    s === CONTENT.H3_SUBSECTION_GAMMA ||
                    s === CONTENT.H3_INLINE_FORMATTING ||
                    s === CONTENT.H3_LISTS ||
                    s === CONTENT.H3_CODE_BLOCKS ||
                    s === CONTENT.H3_TABLES,
            );

            await expect(childSections).toHaveCount(expectedChildren.length);
        });

        test('should mark first section as active on page load', async ({page}) => {
            const firstSection = page.locator('.dc-mini-toc__section').first();

            await expect(firstSection).toHaveClass(/dc-mini-toc__section_active/);
        });

        test('should update active section when clicking a link', async ({page}) => {
            const targetLink = page.locator('.dc-mini-toc__section-link', {
                hasText: CONTENT.H2_CONTENT_RENDERING,
            });

            await targetLink.click();

            const targetSection = page.locator('.dc-mini-toc__section', {
                has: page.locator('.dc-mini-toc__section-link', {hasText: CONTENT.H2_CONTENT_RENDERING}),
            });

            await expect(targetSection).toHaveClass(/dc-mini-toc__section_active/);
        });

        test('should have data-hash attributes on sections', async ({page}) => {
            const sections = page.locator('.dc-mini-toc__section');

            const count = await sections.count();
            for (let i = 0; i < count; i++) {
                const hash = await sections.nth(i).getAttribute('data-hash');
                expect(hash).toBeTruthy();
            }
        });

        test('should mark section links with data-router-shallow', async ({page}) => {
            const links = page.locator('.dc-mini-toc__section-link[data-router-shallow]');

            await expect(links).toHaveCount(MINI_TOC_SECTIONS.length);
        });

        test('should render mini-toc bottom element', async ({page}) => {
            const bottom = page.locator('.dc-mini-toc__bottom');

            await expect(bottom).toHaveCount(1);
        });
    });

    test.describe('Tags', () => {
        test('should render tags container', async ({page}) => {
            const tags = page.locator('.dc-tags');

            await expect(tags).toBeVisible();
        });

        test('should render tags list container', async ({page}) => {
            const list = page.locator('.dc-tags__list');

            await expect(list).toBeVisible();
        });

        test('should render all tags from frontmatter', async ({page}) => {
            const tagElements = page.locator('.dc-tags__tag');

            await expect(tagElements).toHaveCount(CONTENT.TAGS.length);

            for (const tag of CONTENT.TAGS) {
                await expect(tagElements.filter({hasText: tag})).toHaveCount(1);
            }
        });

        test('should render tags as spans without links', async ({page}) => {
            const tagLinks = page.locator('.dc-tags__tag a');

            await expect(tagLinks).toHaveCount(0);
        });

        test('should render tags title heading', async ({page}) => {
            const tagsTitle = page.locator('.dc-tags__title');

            await expect(tagsTitle).toBeVisible();
        });
    });

    test.describe('Content rendering', () => {
        test('should render introductory paragraph in body', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.BODY_TEXT);
        });

        test('should render h2 headings in body', async ({page}) => {
            const h2s = page.locator('.dc-doc-page__body h2');

            await expect(h2s).toHaveCount(5);
            await expect(h2s.filter({hasText: CONTENT.H2_PAGE_LAYOUT})).toHaveCount(1);
            await expect(h2s.filter({hasText: CONTENT.H2_CONTENT_RENDERING})).toHaveCount(1);
            await expect(h2s.filter({hasText: CONTENT.H2_FEEDBACK_WIDGET})).toHaveCount(1);
            await expect(h2s.filter({hasText: CONTENT.H2_SIDEBAR_NAVIGATION})).toHaveCount(1);
        });

        test('should render h3 headings in body', async ({page}) => {
            const h3s = page.locator('.dc-doc-page__body h3');

            await expect(h3s).toHaveCount(8);
            await expect(h3s.filter({hasText: CONTENT.H3_LAYOUT_STRUCTURE})).toHaveCount(1);
            await expect(h3s.filter({hasText: CONTENT.H3_SUBSECTION_ALPHA})).toHaveCount(1);
            await expect(h3s.filter({hasText: CONTENT.H3_TABLES})).toHaveCount(1);
        });

        test('should render inline formatting in body', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body.locator('strong')).toContainText(CONTENT.BOLD_TEXT);
            await expect(body.locator('em')).toContainText(CONTENT.ITALIC_TEXT);
            await expect(body.locator('code.yfm-clipboard-inline-code', {hasText: CONTENT.INLINE_CODE})).toHaveCount(1);
        });

        test('should render unordered list in body', async ({page}) => {
            const listsHeading = page.locator('.dc-doc-page__body h3#lists');
            const list = listsHeading.locator('xpath=following-sibling::ul[1]');
            const items = list.locator('li');

            await expect(items).toHaveCount(3);
            await expect(items.first()).toContainText(CONTENT.LIST_ITEM_FIRST);
        });

        test('should render ordered list in body', async ({page}) => {
            const list = page.locator('.dc-doc-page__body ol');
            const items = list.locator('li');

            await expect(items).toHaveCount(3);
        });

        test('should render code block in body', async ({page}) => {
            const codeBlock = page.locator('.dc-doc-page__body pre code');

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText(CONTENT.CODE_TEXT);
        });

        test('should render table in body', async ({page}) => {
            const table = page.locator('.dc-doc-page__body table');

            await expect(table).toBeVisible();
            await expect(table.locator('th')).toHaveCount(3);
            await expect(table.locator('th').first()).toContainText(CONTENT.TABLE_HEADER_COMPONENT);
            await expect(table.locator('th').nth(1)).toContainText(CONTENT.TABLE_HEADER_BLOCK_CLASS);
        });

        test('should have heading anchor links', async ({page}) => {
            const anchor = page.locator('.dc-doc-page__body h2 a.yfm-anchor');

            await expect(anchor).toHaveCount(5);
        });
    });

    test.describe('Content mini-toc', () => {
        test('should render content mini-toc container', async ({page}) => {
            const contentMiniToc = page.locator('.dc-doc-page__content-mini-toc');

            await expect(contentMiniToc).toHaveCount(1);
        });

        test('should render navigation links for all headings', async ({page}) => {
            const links = page.locator('.dc-doc-page__content-mini-toc a');

            await expect(links).toHaveCount(MINI_TOC_SECTIONS.length);
        });

        test('should link to heading anchors', async ({page}) => {
            const links = page.locator('.dc-doc-page__content-mini-toc a');

            const count = await links.count();
            for (let i = 0; i < count; i++) {
                const href = await links.nth(i).getAttribute('href');
                expect(href).toMatch(/#/);
            }
        });
    });

    test.describe('TOC expandable items', () => {
        test('should render at least one opened TOC item', async ({page}) => {
            const opened = page.locator('.dc-toc__list-item_opened');

            await expect(opened).toHaveCount(1);
        });

        test('should mark main TOC items', async ({page}) => {
            const mainItems = page.locator('.dc-toc__list-item_main');

            const count = await mainItems.count();
            expect(count).toBeGreaterThan(0);
        });
    });
});
