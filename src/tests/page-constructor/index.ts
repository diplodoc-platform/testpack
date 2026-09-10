import {expect, test} from '@playwright/test';

const selectors = {
    pc: 'div.yfm-page-constructor',
} as const;

const CONTENT = {
    PAGE_TITLE: 'Page Constructor',
} as const;

test.describe('Page Constructor', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/page-constructor');
    });

    test.describe('Basic content layout', () => {
        test('should render a div with yfm-page-constructor class', async ({page}) => {
            const block = page.locator('#basic-content + ' + selectors.pc);

            await expect(block).toBeVisible();
            await expect(block).toHaveClass('yfm-page-constructor');
        });

        test('should have data-rendered attribute', async ({page}) => {
            const block = page.locator('#basic-content + ' + selectors.pc);

            await expect(block).toHaveAttribute('data-rendered', 'true');
        });

        test('should encode a single text block in data-content-encoded', async ({page}) => {
            const block = page.locator('#basic-content + ' + selectors.pc);

            const decoded = await block.evaluate((el) => {
                const raw = el.getAttribute('data-content-encoded') || '';
                return JSON.parse(decodeURIComponent(raw));
            });

            expect(decoded.blocks).toHaveLength(1);
            expect(decoded.blocks[0].type).toBe('text');
            expect(decoded.blocks[0].text).toBe('Hello from page constructor');
        });
    });

    test.describe('Card layout block', () => {
        test('should encode card-layout block with title and description', async ({page}) => {
            const block = page.locator('#card-layout + ' + selectors.pc);

            const decoded = await block.evaluate((el) => {
                const raw = el.getAttribute('data-content-encoded') || '';
                return JSON.parse(decodeURIComponent(raw));
            });

            expect(decoded.blocks).toHaveLength(1);
            expect(decoded.blocks[0].type).toBe('card-layout');
            expect(decoded.blocks[0].title).toBe('Card Layout Title');
            expect(decoded.blocks[0].description).toBe('Card Layout Description');
        });

        test('should preserve nested blocks inside card-layout', async ({page}) => {
            const block = page.locator('#card-layout + ' + selectors.pc);

            const decoded = await block.evaluate((el) => {
                const raw = el.getAttribute('data-content-encoded') || '';
                return JSON.parse(decodeURIComponent(raw));
            });

            expect(decoded.blocks[0].blocks).toHaveLength(1);
            expect(decoded.blocks[0].blocks[0].type).toBe('text');
            expect(decoded.blocks[0].blocks[0].text).toBe('Card content text');
        });
    });

    test.describe('Header slider block', () => {
        test('should encode header-slider block type', async ({page}) => {
            const block = page.locator('#header-slider + ' + selectors.pc);

            const decoded = await block.evaluate((el) => {
                const raw = el.getAttribute('data-content-encoded') || '';
                return JSON.parse(decodeURIComponent(raw));
            });

            expect(decoded.blocks).toHaveLength(1);
            expect(decoded.blocks[0].type).toBe('header-slider');
            expect(decoded.blocks[0].title).toBe('Header Slider Title');
            expect(decoded.blocks[0].description).toBe('Header Slider Description');
        });
    });

    test.describe('Multiple blocks', () => {
        test('should encode two text blocks in one page-constructor container', async ({page}) => {
            const block = page.locator('#multiple-blocks + ' + selectors.pc);

            const decoded = await block.evaluate((el) => {
                const raw = el.getAttribute('data-content-encoded') || '';
                return JSON.parse(decodeURIComponent(raw));
            });

            expect(decoded.blocks).toHaveLength(2);
            expect(decoded.blocks[0].type).toBe('text');
            expect(decoded.blocks[0].text).toBe('First block');
            expect(decoded.blocks[1].type).toBe('text');
            expect(decoded.blocks[1].text).toBe('Second block');
        });
    });

    test.describe('Block with conditions', () => {
        test('should keep block when when-condition matches presets', async ({page}) => {
            const block = page.locator('#with-conditions + ' + selectors.pc);

            const decoded = await block.evaluate((el) => {
                const raw = el.getAttribute('data-content-encoded') || '';
                return JSON.parse(decodeURIComponent(raw));
            });

            expect(decoded.blocks).toHaveLength(1);
            expect(decoded.blocks[0].type).toBe('text');
            expect(decoded.blocks[0].text).toBe('Conditional content');
        });
    });

    test.describe('Empty blocks', () => {
        test('should render a page-constructor div with empty blocks array', async ({page}) => {
            const block = page.locator('#empty-blocks + ' + selectors.pc);

            await expect(block).toBeVisible();

            const decoded = await block.evaluate((el) => {
                const raw = el.getAttribute('data-content-encoded') || '';
                return JSON.parse(decodeURIComponent(raw));
            });

            expect(decoded.blocks).toHaveLength(0);
        });
    });

    test.describe('Block with icon', () => {
        test('should encode icon block type with icon and text', async ({page}) => {
            const block = page.locator('#with-icon + ' + selectors.pc);

            const decoded = await block.evaluate((el) => {
                const raw = el.getAttribute('data-content-encoded') || '';
                return JSON.parse(decodeURIComponent(raw));
            });

            expect(decoded.blocks).toHaveLength(1);
            expect(decoded.blocks[0].type).toBe('icon');
            expect(decoded.blocks[0].icon).toBe('ru/syntax/check');
            expect(decoded.blocks[0].text).toBe('Icon block text');
        });
    });

    test.describe('All page-constructor blocks', () => {
        test('should render all 7 page-constructor divs on the page', async ({page}) => {
            const blocks = page.locator(selectors.pc);

            await expect(blocks).toHaveCount(7);
        });

        test('should have data-rendered true on every block after hydration', async ({page}) => {
            const blocks = page.locator(selectors.pc);
            const count = await blocks.count();

            for (let i = 0; i < count; i++) {
                await expect(blocks.nth(i)).toHaveAttribute('data-rendered', 'true');
            }
        });

        test('should have non-empty data-content-encoded on every non-empty block', async ({
            page,
        }) => {
            const blocks = page.locator(selectors.pc);
            const count = await blocks.count();

            for (let i = 0; i < count; i++) {
                const dataContent = await blocks.nth(i).getAttribute('data-content-encoded');
                expect(dataContent).toBeTruthy();
                expect((dataContent || '').length).toBeGreaterThan(0);
            }
        });

        test('should have no direct text nodes in page-constructor divs', async ({page}) => {
            const blocks = page.locator(selectors.pc);
            const count = await blocks.count();

            for (let i = 0; i < count; i++) {
                const hasDirectText = await blocks.nth(i).evaluate((el) => {
                    return Array.from(el.childNodes).some(
                        (node) =>
                            node.nodeType === Node.TEXT_NODE &&
                            (node.textContent || '').trim() !== '',
                    );
                });
                expect(hasDirectText).toBe(false);
            }
        });
    });

    test.describe('Page title', () => {
        test('should display Page Constructor heading on page', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.PAGE_TITLE);
        });
    });

    test.describe('TOC navigation', () => {
        test('should render sidebar navigation with Page Constructor link', async ({page}) => {
            const navLink = page
                .locator('.yfm-sidebar a, .docs-sidebar a, nav a')
                .filter({hasText: 'Page Constructor'});

            await expect(navLink).toBeVisible();
        });

        test('should navigate to the page-constructor page via sidebar', async ({page}) => {
            const navLink = page
                .locator('.yfm-sidebar a, .docs-sidebar a, nav a')
                .filter({hasText: 'Page Constructor'});

            await expect(navLink).toHaveAttribute('href', /page-constructor/);
        });
    });
});
