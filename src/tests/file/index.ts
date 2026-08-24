import {expect, test} from '@playwright/test';

const selectors = {
    fileLink: 'a.yfm-file',
    fileIcon: '.yfm-file__icon',
} as const;

const CONTENT = {
    PAGE_TITLE: 'File Extension',
    BASIC_HREF: '../assets/diplodoc-light.jpg',
    BASIC_DOWNLOAD: 'diplodoc-light.jpg',
    LANG_HREF: '../assets/diplodoc-dark.jpg',
    LANG_DOWNLOAD: 'diplodoc-dark.jpg',
    ATTRS_HREF: 'https://example.com/archive.zip',
    ATTRS_DOWNLOAD: 'archive.zip',
    SINGLE_HREF: 'index.txt',
    SINGLE_DOWNLOAD: 'index.html',
    UNKNOWN_DOWNLOAD: 'report.pdf',
    ORDER_DOWNLOAD: 'page.html',
    ORDER_HREF: '../index.html',
} as const;

test.describe('File Extension', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/file');
    });

    test.describe('Basic file link', () => {
        test('should render an anchor with yfm-file class', async ({page}) => {
            const paragraph = page.locator('#basic-file + p');
            const link = paragraph.locator(selectors.fileLink);

            await expect(link).toBeVisible();
            await expect(link).toHaveAttribute('class', 'yfm-file');
        });

        test('should map src to href and name to download attribute', async ({page}) => {
            const paragraph = page.locator('#basic-file + p');
            const link = paragraph.locator(selectors.fileLink);

            await expect(link).toHaveAttribute('href', CONTENT.BASIC_HREF);
            await expect(link).toHaveAttribute('download', CONTENT.BASIC_DOWNLOAD);
        });

        test('should render filename as link text', async ({page}) => {
            const paragraph = page.locator('#basic-file + p');
            const link = paragraph.locator(selectors.fileLink);

            await expect(link).toContainText(CONTENT.BASIC_DOWNLOAD);
        });

        test('should render an icon span before the filename', async ({page}) => {
            const paragraph = page.locator('#basic-file + p');
            const link = paragraph.locator(selectors.fileLink);
            const icon = link.locator(selectors.fileIcon);

            await expect(icon).toBeVisible();
            await expect(icon).toHaveAttribute('class', 'yfm-file__icon');
        });
    });

    test.describe('Language attribute', () => {
        test('should map lang to hreflang attribute', async ({page}) => {
            const paragraph = page.locator('#lang-file + p');
            const link = paragraph.locator(selectors.fileLink);

            await expect(link).toHaveAttribute('hreflang', 'en');
            await expect(link).toHaveAttribute('href', CONTENT.LANG_HREF);
            await expect(link).toHaveAttribute('download', CONTENT.LANG_DOWNLOAD);
        });
    });

    test.describe('Link HTML attributes', () => {
        test('should pass referrerpolicy attribute', async ({page}) => {
            const paragraph = page.locator('#attrs-file + p');
            const link = paragraph.locator(selectors.fileLink);

            await expect(link).toHaveAttribute('referrerpolicy', 'origin');
        });

        test('should pass rel attribute', async ({page}) => {
            const paragraph = page.locator('#attrs-file + p');
            const link = paragraph.locator(selectors.fileLink);

            await expect(link).toHaveAttribute('rel', 'help');
        });

        test('should pass target attribute', async ({page}) => {
            const paragraph = page.locator('#attrs-file + p');
            const link = paragraph.locator(selectors.fileLink);

            await expect(link).toHaveAttribute('target', '_blank');
        });

        test('should pass type attribute', async ({page}) => {
            const paragraph = page.locator('#attrs-file + p');
            const link = paragraph.locator(selectors.fileLink);

            await expect(link).toHaveAttribute('type', 'application/zip');
        });

        test('should map src and name correctly', async ({page}) => {
            const paragraph = page.locator('#attrs-file + p');
            const link = paragraph.locator(selectors.fileLink);

            await expect(link).toHaveAttribute('href', CONTENT.ATTRS_HREF);
            await expect(link).toHaveAttribute('download', CONTENT.ATTRS_DOWNLOAD);
        });
    });

    test.describe('Single quotes', () => {
        test('should parse single-quoted attributes', async ({page}) => {
            const paragraph = page.locator('#single-quotes + p');
            const link = paragraph.locator(selectors.fileLink);

            await expect(link).toHaveAttribute('href', CONTENT.SINGLE_HREF);
            await expect(link).toHaveAttribute('download', CONTENT.SINGLE_DOWNLOAD);
            await expect(link).toContainText(CONTENT.SINGLE_DOWNLOAD);
        });
    });

    test.describe('Unknown attributes', () => {
        test('should drop unknown attributes (foo, bar)', async ({page}) => {
            const paragraph = page.locator('#unknown-attrs + p');
            const link = paragraph.locator(selectors.fileLink);

            await expect(link).toHaveAttribute('download', CONTENT.UNKNOWN_DOWNLOAD);
            await expect(link).not.toHaveAttribute('foo');
            await expect(link).not.toHaveAttribute('bar');
        });
    });

    test.describe('Multiple file links inline', () => {
        test('should render two file links on one line', async ({page}) => {
            const paragraph = page.locator('#multiple-inline + p');
            const links = paragraph.locator(selectors.fileLink);

            await expect(links).toHaveCount(2);
            await expect(links.nth(0)).toHaveAttribute('download', 'a.txt');
            await expect(links.nth(1)).toHaveAttribute('download', 'b.txt');
        });

        test('should render icon spans for each link', async ({page}) => {
            const paragraph = page.locator('#multiple-inline + p');
            const icons = paragraph.locator(selectors.fileIcon);

            await expect(icons).toHaveCount(2);
        });
    });

    test.describe('File links in a list', () => {
        test('should render a list with three file links', async ({page}) => {
            const list = page.locator('#file-in-list + ul');
            const links = list.locator(selectors.fileLink);

            await expect(links).toHaveCount(3);
            await expect(links.nth(0)).toHaveAttribute('download', 'one.txt');
            await expect(links.nth(1)).toHaveAttribute('download', 'two.txt');
            await expect(links.nth(2)).toHaveAttribute('download', 'three.txt');
        });

        test('should render each list item containing a file link', async ({page}) => {
            const list = page.locator('#file-in-list + ul');
            const items = list.locator('li');

            await expect(items).toHaveCount(3);
            for (let i = 0; i < 3; i++) {
                await expect(items.nth(i).locator(selectors.fileLink)).toBeVisible();
            }
        });
    });

    test.describe('Attribute order independence', () => {
        test('should parse attributes in any order', async ({page}) => {
            const paragraph = page.locator('#attr-order + p');
            const link = paragraph.locator(selectors.fileLink);

            await expect(link).toHaveAttribute('download', CONTENT.ORDER_DOWNLOAD);
            await expect(link).toHaveAttribute('href', CONTENT.ORDER_HREF);
            await expect(link).toHaveAttribute('type', 'text/html');
        });
    });

    test.describe('Page title', () => {
        test('should display File Extension heading on page', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.PAGE_TITLE);
        });
    });

    test.describe('TOC navigation', () => {
        test('should render sidebar navigation with File Extension link', async ({page}) => {
            const navLink = page
                .locator('.yfm-sidebar a, .docs-sidebar a, nav a')
                .filter({hasText: 'File Extension'});

            await expect(navLink).toBeVisible();
        });

        test('should navigate to the file page via sidebar', async ({page}) => {
            const navLink = page
                .locator('.yfm-sidebar a, .docs-sidebar a, nav a')
                .filter({hasText: 'File Extension'});

            await expect(navLink).toHaveAttribute('href', /file/);
        });
    });
});
