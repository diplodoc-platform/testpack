import {expect, test} from '@playwright/test';

const CONTENT = {
    PAGE_TITLE: '@diplodoc/color-extension',
    FRONTMATTER_DESCRIPTION: 'Inline color plugin for Diplodoc transformer and builder',
    STAGE: 'preview',
    TAGS: ['color', 'colorify', 'inline', 'styling', 'extension'],
} as const;

test.describe('Color Extension', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/color');
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
            await expect(h1).toContainText('@diplodoc/color-extension');
        });

        test('should substitute version in Package Information section', async ({page}) => {
            const ul = page.locator('#package-information ~ ul').first();
            await expect(ul).toBeVisible();
            await expect(ul).toContainText('1.0.0');
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
            const list = page.locator('#overview ~ ul').first();
            await expect(list).toBeVisible();
            const items = list.locator('li');
            const count = await items.count();
            expect(count).toBeGreaterThanOrEqual(5);
        });
    });

    test.describe('Basic Colors', () => {
        test('should render red colored text', async ({page}) => {
            const paragraph = page.locator('#basic-red + p');
            const span = paragraph.locator('.yfm-colorify--red');

            await expect(span).toBeVisible();
            await expect(span).toContainText('This text is red');
        });

        test('should render blue colored text', async ({page}) => {
            const paragraph = page.locator('#basic-blue + p');
            const span = paragraph.locator('.yfm-colorify--blue');

            await expect(span).toBeVisible();
            await expect(span).toContainText('This text is blue');
        });

        test('should render green colored text', async ({page}) => {
            const paragraph = page.locator('#basic-green + p');
            const span = paragraph.locator('.yfm-colorify--green');

            await expect(span).toBeVisible();
            await expect(span).toContainText('This text is green');
        });

        test('should have base yfm-colorify class on all colored spans', async ({page}) => {
            const paragraph = page.locator('#basic-red + p');
            const span = paragraph.locator('.yfm-colorify--red');

            await expect(span).toHaveClass(/yfm-colorify/);
        });
    });

    test.describe('Multiple Colors Inline', () => {
        test('should render three colored spans in one paragraph', async ({page}) => {
            const paragraph = page.locator('#multiple-inline + p');
            const spans = paragraph.locator('.yfm-colorify');

            await expect(spans).toHaveCount(3);
        });

        test('should render red, blue, and green spans', async ({page}) => {
            const paragraph = page.locator('#multiple-inline + p');

            await expect(paragraph.locator('.yfm-colorify--red')).toBeVisible();
            await expect(paragraph.locator('.yfm-colorify--blue')).toBeVisible();
            await expect(paragraph.locator('.yfm-colorify--green')).toBeVisible();
        });
    });

    test.describe('Nested Colors', () => {
        test('should render nested color spans', async ({page}) => {
            const paragraph = page.locator('#nested-colors + p');
            const outerSpan = paragraph.locator('.yfm-colorify--red');
            const innerSpan = outerSpan.locator('.yfm-colorify--blue');

            await expect(outerSpan).toBeVisible();
            await expect(innerSpan).toBeVisible();
        });

        test('should preserve inner blue content', async ({page}) => {
            const paragraph = page.locator('#nested-colors + p');
            const innerSpan = paragraph.locator('.yfm-colorify--red .yfm-colorify--blue');

            await expect(innerSpan).toContainText('inner blue');
        });
    });

    test.describe('Nested Parentheses', () => {
        test('should handle parentheses inside color content', async ({page}) => {
            const paragraph = page.locator('#nested-parens + p');
            const span = paragraph.locator('.yfm-colorify--green');

            await expect(span).toBeVisible();
            await expect(span).toContainText('(nested)');
        });
    });

    test.describe('Inline Formatting', () => {
        test('should render bold text inside color span', async ({page}) => {
            const paragraph = page.locator('#inline-formatting + p');
            const span = paragraph.locator('.yfm-colorify--red');
            const strong = span.locator('strong');

            await expect(span).toBeVisible();
            await expect(strong).toBeVisible();
        });

        test('should render italic text inside color span', async ({page}) => {
            const paragraph = page.locator('#inline-formatting + p');
            const span = paragraph.locator('.yfm-colorify--red');
            const em = span.locator('em');

            await expect(em).toBeVisible();
        });
    });

    test.describe('Colors in Lists', () => {
        test('should render three colored list items', async ({page}) => {
            const list = page.locator('#colors-in-lists + ul');
            const items = list.locator('li');

            await expect(items).toHaveCount(3);
        });

        test('should render red, blue, green in list items', async ({page}) => {
            const list = page.locator('#colors-in-lists + ul');

            await expect(list.locator('li').nth(0).locator('.yfm-colorify--red')).toBeVisible();
            await expect(list.locator('li').nth(1).locator('.yfm-colorify--blue')).toBeVisible();
            await expect(list.locator('li').nth(2).locator('.yfm-colorify--green')).toBeVisible();
        });
    });

    test.describe('Empty Content', () => {
        test('should render empty color span', async ({page}) => {
            const paragraph = page.locator('#empty-content + p');
            const span = paragraph.locator('.yfm-colorify--red');

            await expect(span).toHaveCount(1);
            await expect(span).toHaveClass(/yfm-colorify--red/);
            expect((await span.textContent())?.trim()).toBe('');
        });
    });

    test.describe('Colors in Headings', () => {
        test('should render color span inside heading', async ({page}) => {
            const heading = page.locator('h3#colored-heading-text');
            const span = heading.locator('.yfm-colorify--red');

            await expect(heading).toBeVisible();
            await expect(span).toBeVisible();
            await expect(span).toContainText('Colored Heading Text');
        });
    });

    test.describe('All colored spans', () => {
        test('should have non-empty content on most spans', async ({page}) => {
            const spans = page.locator('.yfm-colorify');
            const count = await spans.count();

            let nonEmpty = 0;
            for (let i = 0; i < count; i++) {
                const text = (await spans.nth(i).textContent())?.trim();
                if (text) {
                    nonEmpty++;
                }
            }
            expect(nonEmpty).toBeGreaterThanOrEqual(8);
        });

        test('should all have base yfm-colorify class', async ({page}) => {
            const spans = page.locator('span.yfm-colorify');
            const count = await spans.count();

            expect(count).toBeGreaterThanOrEqual(8);
            for (let i = 0; i < count; i++) {
                const cls = await spans.nth(i).getAttribute('class');
                expect(cls).toContain('yfm-colorify');
            }
        });
    });

    test.describe('Configuration Options', () => {
        test('should render configuration options table', async ({page}) => {
            const heading = page.locator('#configuration-options');
            await expect(heading).toBeVisible();

            const table = page.locator('#configuration-options ~ table').first();
            await expect(table).toBeVisible();
        });

        test('should document defaultClassName option', async ({page}) => {
            const table = page.locator('#configuration-options ~ table').first();
            await expect(table).toContainText('defaultClassName');
        });

        test('should document inline option', async ({page}) => {
            const table = page.locator('#configuration-options ~ table').first();
            await expect(table).toContainText('inline');
        });

        test('should document escape option', async ({page}) => {
            const table = page.locator('#configuration-options ~ table').first();
            await expect(table).toContainText('escape');
        });
    });

    test.describe('Token Types', () => {
        test('should render token types table', async ({page}) => {
            const heading = page.locator('#token-types');
            await expect(heading).toBeVisible();

            const table = page.locator('#token-types ~ table').first();
            await expect(table).toBeVisible();
        });

        test('should document color_open token', async ({page}) => {
            const table = page.locator('#token-types ~ table').first();
            await expect(table).toContainText('color_open');
        });

        test('should document color_close token', async ({page}) => {
            const table = page.locator('#token-types ~ table').first();
            await expect(table).toContainText('color_close');
        });
    });

    test.describe('CSS Classes', () => {
        test('should render CSS classes table', async ({page}) => {
            const heading = page.locator('#css-classes');
            await expect(heading).toBeVisible();

            const table = page.locator('#css-classes ~ table').first();
            await expect(table).toBeVisible();
        });

        test('should document yfm-colorify base class', async ({page}) => {
            const table = page.locator('#css-classes ~ table').first();
            await expect(table).toContainText('yfm-colorify');
        });

        test('should document color modifier class pattern', async ({page}) => {
            const table = page.locator('#css-classes ~ table').first();
            await expect(table).toContainText('yfm-colorify--');
        });
    });

    test.describe('API Exports', () => {
        test('should render API Exports table', async ({page}) => {
            const heading = page.locator('#api-exports');
            await expect(heading).toBeVisible();

            const table = page.locator('#api-exports ~ table').first();
            await expect(table).toBeVisible();
        });

        test('should document colorPlugin export', async ({page}) => {
            const table = page.locator('#api-exports ~ table').first();
            await expect(table).toContainText('colorPlugin');
        });
    });

    test.describe('Usage Example', () => {
        test('should render usage example code block', async ({page}) => {
            const heading = page.locator('#usage-example');
            await expect(heading).toBeVisible();

            const codeBlock = page.locator('#usage-example + div pre code').first();
            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('colorPlugin');
        });

        test('should show HTML output in code block', async ({page}) => {
            const codeBlock = page.locator('#usage-example + div pre code').first();
            await expect(codeBlock).toContainText('yfm-colorify');
        });
    });

    test.describe('Package Information', () => {
        test('should render Package Information heading', async ({page}) => {
            const heading = page.locator('#package-information');
            await expect(heading).toBeVisible();
        });

        test('should list markdown-it dependency', async ({page}) => {
            const ul = page.locator('#dependencies ~ ul').first();
            await expect(ul).toBeVisible();
            await expect(ul).toContainText('markdown-it');
        });

        test('should list exports', async ({page}) => {
            const exportList = page.locator('#exports ~ ul').first();
            await expect(exportList).toBeVisible();
            await expect(exportList).toContainText('@diplodoc/color-extension');
        });
    });

    test.describe('Note directive', () => {
        test('should render note block', async ({page}) => {
            const note = page.locator('.yfm-note').first();
            await expect(note).toBeVisible();
        });

        test('should note mention inline rule', async ({page}) => {
            const note = page.locator('.yfm-note').first();
            await expect(note).toContainText('Inline rule');
        });
    });

    test.describe('TOC navigation', () => {
        test('should render sidebar navigation with Color Extension link', async ({page}) => {
            const navLink = page
                .locator('.yfm-sidebar a, .docs-sidebar a, nav a')
                .filter({hasText: 'Color Extension'});

            await expect(navLink).toBeVisible();
        });

        test('should navigate to the color page via sidebar', async ({page}) => {
            const navLink = page
                .locator('.yfm-sidebar a, .docs-sidebar a, nav a')
                .filter({hasText: 'Color Extension'});

            await expect(navLink).toHaveAttribute('href', /color/);
        });
    });
});
