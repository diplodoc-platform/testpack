import {expect, test} from '@playwright/test';

const QUOTE_LINK_BLOCK = 'blockquote.yfm-quote-link';
const CONTENT = {
    PAGE_TITLE: 'Quote Link Extension',
    PACKAGE_NAME: '@diplodoc/quote-link-extension',
    VERSION: '0.1.8',
    DESCRIPTION: 'Quote link extension for Diplodoc platform',
} as const;

test.describe('Quote Link Extension', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/quote-link');
    });

    test.describe('Page title and frontmatter', () => {
        test('should display Quote Link Extension heading on page', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.PAGE_TITLE);
        });

        test('should set browser tab title', async ({page}) => {
            const title = await page.title();

            expect(title).toContain(CONTENT.PAGE_TITLE);
        });

        test('should render meta description tag', async ({page}) => {
            const meta = page.locator('meta[name="description"]');

            await expect(meta).toHaveAttribute('content', /quote-link-extension/i);
        });

        test('should render stage badge as PREVIEW', async ({page}) => {
            const badge = page.locator('.dc-mark').first();

            await expect(badge).toBeVisible();
            const text = await badge.textContent();
            expect(text?.trim().toUpperCase()).toBe('PREVIEW');
        });

        test('should render all frontmatter tags', async ({page}) => {
            const tags = page.locator('.dc-tags__tag');

            await expect(tags).toHaveCount(4);
        });
    });

    test.describe('Preset variables', () => {
        test('should render package name from presets', async ({page}) => {
            const body = page.locator('body');

            await expect(body).toContainText(CONTENT.PACKAGE_NAME);
        });

        test('should render version from presets', async ({page}) => {
            const body = page.locator('body');

            await expect(body).toContainText(CONTENT.VERSION);
        });

        test('should render description from presets', async ({page}) => {
            const body = page.locator('body');

            await expect(body).toContainText(CONTENT.DESCRIPTION);
        });
    });

    test.describe('Basic quote link', () => {
        test('should render blockquote with yfm-quote-link class', async ({page}) => {
            const block = page.locator('#basic-quote-link + ' + QUOTE_LINK_BLOCK);

            await expect(block).toHaveCount(1);
            await expect(block).toHaveClass(/yfm-quote-link/);
        });

        test('should render link with data-quotelink attribute', async ({page}) => {
            const block = page.locator('#basic-quote-link + ' + QUOTE_LINK_BLOCK);
            const link = block.locator('a').first();

            await expect(link).toHaveAttribute('data-quotelink', '');
            await expect(link).toHaveAttribute('href', 'https://ya.ru');
            await expect(link).toContainText('Quote link');
        });

        test('should render quote link text in a separate paragraph', async ({page}) => {
            const block = page.locator('#basic-quote-link + ' + QUOTE_LINK_BLOCK);
            const paragraphs = block.locator('p');

            await expect(paragraphs).toHaveCount(2);
            await expect(paragraphs.nth(1)).toContainText('quote link text');
        });
    });

    test.describe('Quote link with data-quotelink="true"', () => {
        test('should render blockquote with yfm-quote-link class', async ({page}) => {
            const block = page.locator('#quoted-true + ' + QUOTE_LINK_BLOCK);

            await expect(block).toHaveCount(1);
        });

        test('should render link with data-quotelink="true" attribute', async ({page}) => {
            const block = page.locator('#quoted-true + ' + QUOTE_LINK_BLOCK);
            const link = block.locator('a').first();

            await expect(link).toHaveAttribute('data-quotelink', 'true');
            await expect(link).toHaveAttribute('href', 'https://ya.ru');
        });
    });

    test.describe('Quote link with multiple paragraphs', () => {
        test('should render link paragraph plus two content paragraphs', async ({page}) => {
            const block = page.locator('#multiple-paragraphs + ' + QUOTE_LINK_BLOCK);
            const paragraphs = block.locator('p');

            await expect(paragraphs).toHaveCount(3);
            await expect(paragraphs.nth(0).locator('a')).toHaveCount(1);
            await expect(paragraphs.nth(1)).toContainText('quote link paragraph 1');
            await expect(paragraphs.nth(2)).toContainText('quote link paragraph 2');
        });
    });

    test.describe('Quote link same line (paragraph splitting)', () => {
        test('should split link and text into separate paragraphs', async ({page}) => {
            const block = page.locator('#same-line + ' + QUOTE_LINK_BLOCK);
            const paragraphs = block.locator('p');

            await expect(paragraphs).toHaveCount(2);
            await expect(paragraphs.nth(0).locator('a')).toHaveCount(1);
            await expect(paragraphs.nth(1)).toContainText('quote link text on same line');
        });

        test('should have yfm-quote-link class on blockquote', async ({page}) => {
            const block = page.locator('#same-line + ' + QUOTE_LINK_BLOCK);

            await expect(block).toHaveClass(/yfm-quote-link/);
        });
    });

    test.describe('Nested quote links', () => {
        test('should render outer quote link block', async ({page}) => {
            const block = page.locator('#nested-quote-links + ' + QUOTE_LINK_BLOCK);

            await expect(block).toHaveCount(1);
            const link = block.locator('> p > a').first();
            await expect(link).toHaveAttribute('data-quotelink', 'true');
            await expect(link).toHaveAttribute('href', 'https://ya.ru');
        });

        test('should render nested quote link block inside outer', async ({page}) => {
            const block = page.locator('#nested-quote-links + ' + QUOTE_LINK_BLOCK);
            const nestedBlock = block.locator(QUOTE_LINK_BLOCK);

            await expect(nestedBlock).toHaveCount(1);
            await expect(nestedBlock).toHaveClass(/yfm-quote-link/);

            const nestedLink = nestedBlock.locator('> p > a').first();
            await expect(nestedLink).toHaveAttribute('data-quotelink', 'true');
            await expect(nestedLink).toHaveAttribute('href', 'https://nested.ru');
            await expect(nestedLink).toContainText('Nested');
        });
    });

    test.describe('Simple quote inside quote link', () => {
        test('should render outer quote link with yfm-quote-link class', async ({page}) => {
            const block = page.locator('#simple-inside + ' + QUOTE_LINK_BLOCK);

            await expect(block).toHaveCount(1);
            await expect(block).toHaveClass(/yfm-quote-link/);
        });

        test('should render inner blockquote without yfm-quote-link class', async ({page}) => {
            const block = page.locator('#simple-inside + ' + QUOTE_LINK_BLOCK);
            const innerBlock = block.locator('blockquote:not(.yfm-quote-link)');

            await expect(innerBlock).toHaveCount(1);
            await expect(innerBlock).not.toHaveClass(/yfm-quote-link/);
            await expect(innerBlock.locator('p').first()).toContainText('Simple quote');
        });
    });

    test.describe('Quote link inside simple quote', () => {
        test('should render outer blockquote without yfm-quote-link class', async ({page}) => {
            const block = page.locator('#link-inside-simple + blockquote');

            await expect(block).toHaveCount(1);
            await expect(block).not.toHaveClass(/yfm-quote-link/);
        });

        test('should render nested quote link block inside simple blockquote', async ({page}) => {
            const block = page.locator('#link-inside-simple + blockquote');
            const nestedBlock = block.locator(QUOTE_LINK_BLOCK);

            await expect(nestedBlock).toHaveCount(1);
            await expect(nestedBlock).toHaveClass(/yfm-quote-link/);

            const link = nestedBlock.locator('> p > a').first();
            await expect(link).toHaveAttribute('data-quotelink', 'true');
            await expect(link).toHaveAttribute('href', 'https://nested.ru');
        });
    });

    test.describe('Plain quote without link', () => {
        test('should render blockquote without yfm-quote-link class', async ({page}) => {
            const block = page.locator('#plain-quote + blockquote');

            await expect(block).toHaveCount(1);
            await expect(block).not.toHaveClass(/yfm-quote-link/);
            await expect(block.locator('p').first()).toContainText('plain blockquote');
        });
    });

    test.describe('Link without data-quotelink attribute', () => {
        test('should not add yfm-quote-link class', async ({page}) => {
            const block = page.locator('#link-no-attr + blockquote');

            await expect(block).toHaveCount(1);
            await expect(block).not.toHaveClass(/yfm-quote-link/);
        });

        test('should still render the link inside blockquote', async ({page}) => {
            const block = page.locator('#link-no-attr + blockquote');
            const link = block.locator('a').first();

            await expect(link).toHaveCount(1);
            await expect(link).toHaveAttribute('href', 'https://ya.ru');
            await expect(link).not.toHaveAttribute('data-quotelink');
        });
    });

    test.describe('All quote link blocks', () => {
        test('should render exactly 8 yfm-quote-link blocks on the page', async ({page}) => {
            const blocks = page.locator(QUOTE_LINK_BLOCK);

            await expect(blocks).toHaveCount(8);
        });

        test('should have data-quotelink link in each quote link block', async ({page}) => {
            const blocks = page.locator(QUOTE_LINK_BLOCK);
            const count = await blocks.count();

            for (let i = 0; i < count; i++) {
                const link = blocks.nth(i).locator('> p > a').first();
                const attr = await link.getAttribute('data-quotelink');
                expect(attr).not.toBeNull();
            }
        });
    });

    test.describe('Package Information', () => {
        test('should render Package Information heading', async ({page}) => {
            const heading = page.locator('h2').filter({hasText: 'Package Information'});

            await expect(heading).toHaveCount(1);
        });

        test('should render dependencies from presets for-loop', async ({page}) => {
            const body = page.locator('body');

            await expect(body).toContainText('@diplodoc/utils');
        });

        test('should render exports from presets for-loop', async ({page}) => {
            const body = page.locator('body');

            await expect(body).toContainText('.');
            await expect(body).toContainText('./runtime');
        });

        test('should not leak liquid for-loop tags', async ({page}) => {
            const body = page.locator('body');

            await expect(body).not.toContainText('{% for');
            await expect(body).not.toContainText('{% endfor');
        });
    });

    test.describe('Syntax Reference', () => {
        test('should render Syntax Reference heading', async ({page}) => {
            const heading = page.locator('h2').filter({hasText: 'Syntax Reference'});

            await expect(heading).toHaveCount(1);
        });

        test('should render syntax reference table', async ({page}) => {
            const heading = page.locator('h2').filter({hasText: 'Syntax Reference'});
            const table = heading.locator('~ table').first();

            await expect(table).toBeVisible();
        });

        test('should document data-quotelink attribute in table', async ({page}) => {
            const heading = page.locator('h2').filter({hasText: 'Syntax Reference'});
            const table = heading.locator('~ table').first();

            await expect(table).toContainText('data-quotelink');
        });
    });

    test.describe('CSS Classes', () => {
        test('should render CSS Classes heading', async ({page}) => {
            const heading = page.locator('h2').filter({hasText: 'CSS Classes'});

            await expect(heading).toHaveCount(1);
        });

        test('should render CSS classes table with yfm-quote-link', async ({page}) => {
            const heading = page.locator('h2').filter({hasText: 'CSS Classes'});
            const table = heading.locator('~ table').first();

            await expect(table).toContainText('yfm-quote-link');
        });
    });

    test.describe('Token Types', () => {
        test('should render Token Types heading', async ({page}) => {
            const heading = page.locator('h2').filter({hasText: 'Token Types'});

            await expect(heading).toHaveCount(1);
        });

        test('should render token types table with all three token types', async ({page}) => {
            const heading = page.locator('h2').filter({hasText: 'Token Types'});
            const table = heading.locator('~ table').first();

            await expect(table).toContainText('yfm_quote-link_open');
            await expect(table).toContainText('yfm_quote-link');
            await expect(table).toContainText('yfm_quote-link_close');
        });
    });

    test.describe('Runtime Assets', () => {
        test('should render Runtime Assets heading', async ({page}) => {
            const heading = page.locator('h2').filter({hasText: 'Runtime Assets'});

            await expect(heading).toHaveCount(1);
        });

        test('should document default script and style paths', async ({page}) => {
            const heading = page.locator('h2').filter({hasText: 'Runtime Assets'});
            const table = heading.locator('~ table').first();

            await expect(table).toContainText('_assets/quote-link-extension.js');
            await expect(table).toContainText('_assets/quote-link-extension.css');
        });
    });

    test.describe('Transform Options', () => {
        test('should render Transform Options heading', async ({page}) => {
            const heading = page.locator('h2').filter({hasText: 'Transform Options'});

            await expect(heading).toHaveCount(1);
        });

        test('should document runtime and bundle options', async ({page}) => {
            const heading = page.locator('h2').filter({hasText: 'Transform Options'});
            const table = heading.locator('~ table').first();

            await expect(table).toContainText('runtime');
            await expect(table).toContainText('bundle');
        });
    });

    test.describe('Usage Example', () => {
        test('should render Usage Example heading', async ({page}) => {
            const heading = page.locator('h2').filter({hasText: 'Usage Example'});

            await expect(heading).toHaveCount(1);
        });

        test('should render TypeScript code block with transform import', async ({page}) => {
            const heading = page.locator('h2').filter({hasText: 'Usage Example'});
            const code = heading.locator('~ div pre code').first();

            await expect(code).toContainText('@diplodoc/quote-link-extension');
            await expect(code).toContainText('transform');
        });
    });

    test.describe('Overview', () => {
        test('should render Overview heading', async ({page}) => {
            const heading = page.locator('h2').filter({hasText: 'Overview'});

            await expect(heading).toHaveCount(1);
        });

        test('should mention data-quotelink attribute in overview', async ({page}) => {
            const overview = page
                .locator('h2')
                .filter({hasText: 'Overview'})
                .locator('~ p')
                .first();

            await expect(overview).toContainText('data-quotelink');
        });

        test('should render key features list', async ({page}) => {
            const overview = page.locator('h2').filter({hasText: 'Overview'});
            const list = overview.locator('~ ul').first();
            const items = list.locator('li');

            await expect(items).toHaveCount(5);
        });
    });

    test.describe('TOC navigation', () => {
        test('should render sidebar navigation with Quote Link Extension link', async ({page}) => {
            const navLink = page
                .locator('.yfm-sidebar a, .docs-sidebar a, nav a')
                .filter({hasText: CONTENT.PAGE_TITLE});

            await expect(navLink).toBeVisible();
        });

        test('should navigate to the quote-link page via sidebar', async ({page}) => {
            const navLink = page
                .locator('.yfm-sidebar a, .docs-sidebar a, nav a')
                .filter({hasText: CONTENT.PAGE_TITLE});

            await expect(navLink).toHaveAttribute('href', /quote-link/);
        });
    });
});
