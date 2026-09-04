import {expect, test} from '@playwright/test';

const CONTENT = {
    PAGE_TITLE: 'AJV Schemas',
    PAGE_DESCRIPTION:
        'Page exercising frontmatter and preset fields defined by @diplodoc/ajv JSON schemas',
    STAGE_LABEL: 'NEW',
    TAGS: ['schemas', 'validation', 'metadata'],
    SCHEMA_PACKAGE: '@diplodoc/ajv',
    SCHEMA_VERSION: '0.4.4',
    SCHEMA_LIST: ['frontmatter', 'toc', 'presets', 'redirects', 'theme'],
    H2_FRONTMATTER_TITLE: 'Frontmatter title',
    H2_FRONTMATTER_DESCRIPTION: 'Frontmatter description',
    H2_FRONTMATTER_STAGE: 'Frontmatter stage',
    H2_FRONTMATTER_TAGS: 'Frontmatter tags',
    H2_PRESET_VARIABLES: 'Preset variables',
    H2_SCHEMA_COVERAGE: 'Schema coverage',
    H2_TOC_NAVIGATION: 'TOC navigation',
    H3_NESTED_VARIABLES: 'Nested object variables',
    H3_SCHEMA_LIST: 'Schema list',
    TABLE_HEADER_SCHEMA: 'Schema',
    TABLE_HEADER_PURPOSE: 'Purpose',
    TABLE_ROW_FRONTMATTER: 'frontmatter',
    TABLE_ROW_TOC: 'toc',
    TABLE_ROW_PRESETS: 'presets',
} as const;

test.describe('AJV Schemas', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/ajv-schemas');
    });

    test.describe('Frontmatter title', () => {
        test('should display page title as h1 heading', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.PAGE_TITLE);
        });

        test('should set browser tab title from frontmatter', async ({page}) => {
            const title = await page.title();

            expect(title).toContain(CONTENT.PAGE_TITLE);
        });

        test('should render title heading section', async ({page}) => {
            const section = page.locator('h2#frontmatter-title');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_FRONTMATTER_TITLE);
        });
    });

    test.describe('Frontmatter description', () => {
        test('should render meta description tag in HTML head', async ({page}) => {
            const metaDescription = page.locator('meta[name="description"]');

            await expect(metaDescription).toHaveAttribute('content', CONTENT.PAGE_DESCRIPTION);
        });

        test('should render description heading section', async ({page}) => {
            const section = page.locator('h2#frontmatter-description');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_FRONTMATTER_DESCRIPTION);
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

        test('should render stage heading section', async ({page}) => {
            const section = page.locator('h2#frontmatter-stage');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_FRONTMATTER_STAGE);
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

        test('should render tag meta tags for each tag', async ({page}) => {
            for (const tag of CONTENT.TAGS) {
                const metaTag = page.locator(`meta[property="article:tag"][content="${tag}"]`);
                await expect(metaTag).toHaveCount(1);
            }
        });

        test('should render tags heading section', async ({page}) => {
            const section = page.locator('h2#frontmatter-tags');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_FRONTMATTER_TAGS);
        });
    });

    test.describe('Preset variables', () => {
        test('should render preset variables heading section', async ({page}) => {
            const section = page.locator('h2#preset-variables');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_PRESET_VARIABLES);
        });

        test('should substitute nested object package variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.SCHEMA_PACKAGE);
        });

        test('should substitute nested object version variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.SCHEMA_VERSION);
        });

        test('should not leave unresolved variable markers in output', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).not.toContainText('{{');
            await expect(body).not.toContainText('}}');
        });
    });

    test.describe('Schema list from presets', () => {
        test('should render schema list heading section', async ({page}) => {
            const section = page.locator('h3#schema-list');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_SCHEMA_LIST);
        });

        test('should iterate over schema array from presets', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            for (const schema of CONTENT.SCHEMA_LIST) {
                await expect(body).toContainText(schema);
            }
        });

        test('should not leave liquid for-loop tags in output', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).not.toContainText('{% for');
            await expect(body).not.toContainText('{% endfor');
        });
    });

    test.describe('Schema coverage table', () => {
        test('should render schema coverage heading section', async ({page}) => {
            const section = page.locator('h2#schema-coverage');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_SCHEMA_COVERAGE);
        });

        test('should render table with schema entries', async ({page}) => {
            const table = page.locator('.dc-doc-page__body table');

            await expect(table).toBeVisible();
        });

        test('should render table headers', async ({page}) => {
            const headers = page.locator('.dc-doc-page__body table th');

            await expect(headers).toHaveCount(2);
            await expect(headers.first()).toContainText(CONTENT.TABLE_HEADER_SCHEMA);
            await expect(headers.nth(1)).toContainText(CONTENT.TABLE_HEADER_PURPOSE);
        });

        test('should list known schemas in table rows', async ({page}) => {
            const body = page.locator('.dc-doc-page__body table');

            await expect(body).toContainText(CONTENT.TABLE_ROW_FRONTMATTER);
            await expect(body).toContainText(CONTENT.TABLE_ROW_TOC);
            await expect(body).toContainText(CONTENT.TABLE_ROW_PRESETS);
        });
    });

    test.describe('TOC navigation', () => {
        test('should render AJV Schemas link in sidebar', async ({page}) => {
            const navLink = page.locator('.dc-toc a, .yfm-sidebar a, nav a').filter({
                hasText: CONTENT.PAGE_TITLE,
            });

            await expect(navLink).toBeVisible();
        });

        test('should mark AJV Schemas as active in TOC', async ({page}) => {
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
