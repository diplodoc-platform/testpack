import {expect, test} from '@playwright/test';

const selectors = {
    sandbox: 'div.yfm-openapi-sandbox-js',
} as const;

const CONTENT = {
    PAGE_TITLE: 'OpenAPI Sandbox',
} as const;

test.describe('OpenAPI Sandbox', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/openapi');
    });

    test.describe('Basic GET sandbox', () => {
        test('should render a div with yfm-openapi-sandbox-js class', async ({page}) => {
            const block = page.locator('#basic-get + ' + selectors.sandbox);

            await expect(block).toBeVisible();
            await expect(block).toHaveClass('yfm-openapi-sandbox-js');
        });

        test('should have a non-empty data-props attribute', async ({page}) => {
            const block = page.locator('#basic-get + ' + selectors.sandbox);

            const dataProps = await block.getAttribute('data-props');
            expect(dataProps).toBeTruthy();
            expect(dataProps!.length).toBeGreaterThan(0);
        });

        test('should encode GET method in data-props', async ({page}) => {
            const block = page.locator('#basic-get + ' + selectors.sandbox);

            const decoded = await block.evaluate((el) => {
                const raw = el.getAttribute('data-props') || '';
                return JSON.parse(decodeURIComponent(raw));
            });

            expect(decoded.method).toBe('get');
            expect(decoded.path).toBe('/users');
            expect(decoded.server).toBe('https://api.example.com');
        });
    });

    test.describe('POST sandbox with body', () => {
        test('should encode POST method in data-props', async ({page}) => {
            const block = page.locator('#post-body + ' + selectors.sandbox);

            const decoded = await block.evaluate((el) => {
                const raw = el.getAttribute('data-props') || '';
                return JSON.parse(decodeURIComponent(raw));
            });

            expect(decoded.method).toBe('post');
            expect(decoded.path).toBe('/users/create');
            expect(decoded.server).toBe('https://api.example.com');
        });
    });

    test.describe('PUT sandbox', () => {
        test('should encode PUT method in data-props', async ({page}) => {
            const block = page.locator('#put-method + ' + selectors.sandbox);

            const decoded = await block.evaluate((el) => {
                const raw = el.getAttribute('data-props') || '';
                return JSON.parse(decodeURIComponent(raw));
            });

            expect(decoded.method).toBe('put');
            expect(decoded.path).toBe('/users/update');
        });
    });

    test.describe('DELETE sandbox', () => {
        test('should encode DELETE method in data-props', async ({page}) => {
            const block = page.locator('#delete-method + ' + selectors.sandbox);

            const decoded = await block.evaluate((el) => {
                const raw = el.getAttribute('data-props') || '';
                return JSON.parse(decodeURIComponent(raw));
            });

            expect(decoded.method).toBe('delete');
            expect(decoded.path).toBe('/users/delete');
        });
    });

    test.describe('PATCH sandbox', () => {
        test('should encode PATCH method in data-props', async ({page}) => {
            const block = page.locator('#patch-method + ' + selectors.sandbox);

            const decoded = await block.evaluate((el) => {
                const raw = el.getAttribute('data-props') || '';
                return JSON.parse(decodeURIComponent(raw));
            });

            expect(decoded.method).toBe('patch');
            expect(decoded.path).toBe('/users/patch');
        });
    });

    test.describe('Sandbox with localhost server', () => {
        test('should encode localhost server URL in data-props', async ({page}) => {
            const block = page.locator('#localhost-server + ' + selectors.sandbox);

            const decoded = await block.evaluate((el) => {
                const raw = el.getAttribute('data-props') || '';
                return JSON.parse(decodeURIComponent(raw));
            });

            expect(decoded.method).toBe('get');
            expect(decoded.path).toBe('/health');
            expect(decoded.server).toBe('http://localhost:8080');
        });
    });

    test.describe('Sandbox with complex path', () => {
        test('should encode complex path with multiple segments', async ({page}) => {
            const block = page.locator('#complex-path + ' + selectors.sandbox);

            const decoded = await block.evaluate((el) => {
                const raw = el.getAttribute('data-props') || '';
                return JSON.parse(decodeURIComponent(raw));
            });

            expect(decoded.path).toBe('/api/v1/users/123/posts');
            expect(decoded.method).toBe('get');
        });
    });

    test.describe('Multiple sandbox blocks', () => {
        test('should render two sandbox divs on the page section', async ({page}) => {
            const allBlocks = page.locator(selectors.sandbox);
            const total = await allBlocks.count();

            const paths: string[] = [];
            for (let i = 0; i < total; i++) {
                const decoded = await allBlocks.nth(i).evaluate((el) => {
                    const raw = el.getAttribute('data-props') || '';
                    return JSON.parse(decodeURIComponent(raw));
                });
                paths.push(decoded.path);
            }

            expect(paths).toContain('/products');
            expect(paths).toContain('/orders');
        });

        test('should encode different methods for each block', async ({page}) => {
            const allBlocks = page.locator(selectors.sandbox);
            const total = await allBlocks.count();

            const methods: string[] = [];
            for (let i = 0; i < total; i++) {
                const decoded = await allBlocks.nth(i).evaluate((el) => {
                    const raw = el.getAttribute('data-props') || '';
                    return JSON.parse(decodeURIComponent(raw));
                });
                methods.push(decoded.method);
            }

            expect(methods).toContain('get');
            expect(methods).toContain('post');
        });
    });

    test.describe('Sandbox with description', () => {
        test('should encode description field in data-props', async ({page}) => {
            const block = page.locator('#with-description + ' + selectors.sandbox);

            const decoded = await block.evaluate((el) => {
                const raw = el.getAttribute('data-props') || '';
                return JSON.parse(decodeURIComponent(raw));
            });

            expect(decoded.description).toBe('Health check endpoint');
            expect(decoded.method).toBe('get');
            expect(decoded.path).toBe('/status');
        });
    });

    test.describe('All sandbox blocks', () => {
        test('should render all sandbox blocks with correct class', async ({page}) => {
            const blocks = page.locator(selectors.sandbox);

            const count = await blocks.count();
            expect(count).toBeGreaterThanOrEqual(10);

            for (let i = 0; i < count; i++) {
                await expect(blocks.nth(i)).toHaveClass('yfm-openapi-sandbox-js');
            }
        });

        test('should have data-props on every sandbox block', async ({page}) => {
            const blocks = page.locator(selectors.sandbox);
            const count = await blocks.count();

            for (let i = 0; i < count; i++) {
                const dataProps = await blocks.nth(i).getAttribute('data-props');
                expect(dataProps).toBeTruthy();
                expect(dataProps!.length).toBeGreaterThan(0);
            }
        });

        test('should have no direct text nodes in sandbox blocks', async ({page}) => {
            const blocks = page.locator(selectors.sandbox);
            const count = await blocks.count();

            for (let i = 0; i < count; i++) {
                const hasDirectText = await blocks.nth(i).evaluate((el) => {
                    return Array.from(el.childNodes).some(
                        (node) =>
                            node.nodeType === Node.TEXT_NODE && node.textContent!.trim() !== '',
                    );
                });
                expect(hasDirectText).toBe(false);
            }
        });
    });

    test.describe('Page title', () => {
        test('should display OpenAPI Sandbox heading on page', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.PAGE_TITLE);
        });
    });

    test.describe('TOC navigation', () => {
        test('should render sidebar navigation with OpenAPI Sandbox link', async ({page}) => {
            const navLink = page
                .locator('.yfm-sidebar a, .docs-sidebar a, nav a')
                .filter({hasText: 'OpenAPI Sandbox'});

            await expect(navLink).toBeVisible();
        });

        test('should navigate to the openapi page via sidebar', async ({page}) => {
            const navLink = page
                .locator('.yfm-sidebar a, .docs-sidebar a, nav a')
                .filter({hasText: 'OpenAPI Sandbox'});

            await expect(navLink).toHaveAttribute('href', /openapi/);
        });
    });
});
