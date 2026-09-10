import {expect, test} from '@playwright/test';

const PAGE_URL = './ru/reproducers/';

const CONTENT = {
    PAGE_TITLE: 'Reproducer Fixtures',
    SVGO_SECTION: 'svgo Issue #2218',
} as const;

test.describe('Reproducer Fixtures', () => {
    test.beforeEach(async ({page}) => {
        await page.goto(PAGE_URL);
    });

    test.describe('Page structure', () => {
        test('should render page title', async ({page}) => {
            const title = page.locator('h1');

            await expect(title).toBeVisible();
            await expect(title).toContainText(CONTENT.PAGE_TITLE);
        });

        test('should render frontmatter description in meta tag', async ({page}) => {
            const meta = page.locator('meta[name="description"]');

            await expect(meta).toHaveAttribute('content', /reproducer/i);
        });

        test('should render stage badge as NEW', async ({page}) => {
            const badge = page.locator('.dc-mark');

            await expect(badge).toBeVisible();
            await expect(badge).toContainText('NEW');
        });

        test('should render all frontmatter tags', async ({page}) => {
            const tags = page.locator('.dc-tags__tag');

            const count = await tags.count();
            expect(count).toBeGreaterThanOrEqual(5);
        });
    });

    test.describe('svgo large SVG diagram (issue #2218)', () => {
        test('should render the svgo section heading', async ({page}) => {
            const heading = page.locator('h2', {hasText: 'svgo Issue #2218'});

            await expect(heading).toBeVisible();
        });

        test('should render the large SVG inline', async ({page}) => {
            const svg = page.locator('#svgo-large-diagram + p svg');

            await expect(svg).toBeVisible();
            await expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
        });

        test('should have viewBox attribute on large SVG', async ({page}) => {
            const svg = page.locator('#svgo-large-diagram + p svg');

            await expect(svg).toHaveAttribute('viewBox', '0 0 1200 900');
        });

        test('should render SVG nodes with rect elements', async ({page}) => {
            const svg = page.locator('#svgo-large-diagram + p svg');
            const rects = svg.locator('rect');

            const count = await rects.count();
            expect(count).toBeGreaterThanOrEqual(65);
        });

        test('should render SVG text elements with entity content', async ({page}) => {
            const svg = page.locator('#svgo-large-diagram + p svg');
            const texts = svg.locator('text');

            const count = await texts.count();
            expect(count).toBeGreaterThanOrEqual(65);
        });

        test('should render SVG gradient definitions', async ({page}) => {
            const svg = page.locator('#svgo-large-diagram + p svg');
            const gradients = svg.locator('linearGradient');

            const count = await gradients.count();
            expect(count).toBeGreaterThanOrEqual(2);
        });

        test('should render SVG connectors with arrow markers', async ({page}) => {
            const svg = page.locator('#svgo-large-diagram + p svg');
            const markers = svg.locator('marker');

            const count = await markers.count();
            expect(count).toBeGreaterThanOrEqual(1);
        });

        test('should render SVG lines as connectors', async ({page}) => {
            const svg = page.locator('#svgo-large-diagram + p svg');
            const lines = svg.locator('line');

            const count = await lines.count();
            expect(count).toBeGreaterThanOrEqual(50);
        });

        test('@screenshot should preserve the large SVG rendering', async ({page}) => {
            const svg = page.locator('#svgo-large-diagram + p svg');

            await expect(svg).toBeVisible();
            await expect(svg).toHaveScreenshot('svgo-large-diagram.png', {
                animations: 'disabled',
                // Text rasterization differs across macOS, Linux, and Windows runners.
                // The Windows delta is 3687 pixels (~1%); a missing SVG render is much larger.
                maxDiffPixels: 4000,
            });
        });

        test('should render fixture characteristics table', async ({page}) => {
            const table = page.locator('#svgo-large-diagram ~ table').first();

            await expect(table).toBeVisible();

            const headers = table.locator('th');
            expect(await headers.count()).toBeGreaterThanOrEqual(2);
        });

        test('should document the entity count in the table', async ({page}) => {
            const table = page.locator('#svgo-large-diagram ~ table').first();

            await expect(table).toContainText('759');
        });

        test('should reference the GitHub issue URL', async ({page}) => {
            const body = page.locator('.dc-doc-page__content');

            await expect(body).toContainText('svg/svgo#2218');
        });
    });

    test.describe('Complex gradients fixture', () => {
        test('should render the complex gradients heading', async ({page}) => {
            const heading = page.locator('h2', {hasText: 'Complex Gradients'});

            await expect(heading).toBeVisible();
        });

        test('should render the complex gradients SVG inline', async ({page}) => {
            const svg = page.locator('#complex-gradients + p svg');

            await expect(svg).toBeVisible();
            await expect(svg).toHaveAttribute('viewBox', '0 0 400 300');
        });

        test('should contain linearGradient definitions', async ({page}) => {
            const svg = page.locator('#complex-gradients + p svg');
            const gradients = svg.locator('linearGradient');

            const count = await gradients.count();
            expect(count).toBeGreaterThanOrEqual(2);
        });

        test('should contain radialGradient definition', async ({page}) => {
            const svg = page.locator('#complex-gradients + p svg');
            const radial = svg.locator('radialGradient');

            await expect(radial).toHaveCount(1);
        });

        test('should contain filter definition', async ({page}) => {
            const svg = page.locator('#complex-gradients + p svg');
            const filter = svg.locator('filter');

            await expect(filter).toHaveCount(1);
        });

        test('@screenshot should preserve gradients and filters', async ({page}) => {
            const svg = page.locator('#complex-gradients + p svg');

            await expect(svg).toBeVisible();
            await expect(svg).toHaveScreenshot('complex-gradients.png', {
                animations: 'disabled',
                // Windows differs by 425 pixels (~0.4%); missing gradients differ by over 30%.
                maxDiffPixels: 500,
            });
        });

        test('should render fixture characteristics table', async ({page}) => {
            const table = page.locator('#complex-gradients ~ table').first();

            await expect(table).toBeVisible();
            await expect(table).toContainText('gradients');
        });
    });

    test.describe('Nested groups fixture', () => {
        test('should render the nested groups heading', async ({page}) => {
            const heading = page.locator('h2', {hasText: 'Nested Groups'});

            await expect(heading).toBeVisible();
        });

        test('should render the nested groups SVG inline', async ({page}) => {
            const svg = page.locator('#nested-groups + p svg');

            await expect(svg).toBeVisible();
            await expect(svg).toHaveAttribute('viewBox', '0 0 400 400');
        });

        test('should contain nested g elements', async ({page}) => {
            const svg = page.locator('#nested-groups + p svg');
            const groups = svg.locator('g');

            const count = await groups.count();
            expect(count).toBeGreaterThanOrEqual(6);
        });

        test('should contain transform attributes on groups', async ({page}) => {
            const svg = page.locator('#nested-groups + p svg');
            const transformedGroups = svg.locator('g[transform]');

            const count = await transformedGroups.count();
            expect(count).toBeGreaterThanOrEqual(6);
        });

        test('should render fixture characteristics table', async ({page}) => {
            const table = page.locator('#nested-groups ~ table').first();

            await expect(table).toBeVisible();
            await expect(table).toContainText('Nesting depth');
        });
    });

    test.describe('Transform paths fixture', () => {
        test('should render the transform paths heading', async ({page}) => {
            const heading = page.locator('h2', {hasText: 'Transform Paths'});

            await expect(heading).toBeVisible();
        });

        test('should render the transform paths SVG inline', async ({page}) => {
            const svg = page.locator('#transform-paths + p svg');

            await expect(svg).toBeVisible();
            await expect(svg).toHaveAttribute('viewBox', '0 0 300 200');
        });

        test('should contain pattern definition', async ({page}) => {
            const svg = page.locator('#transform-paths + p svg');
            const pattern = svg.locator('pattern');

            await expect(pattern).toHaveCount(1);
        });

        test('should contain path elements with transforms', async ({page}) => {
            const svg = page.locator('#transform-paths + p svg');
            const paths = svg.locator('path');

            const count = await paths.count();
            expect(count).toBeGreaterThanOrEqual(3);
        });

        test('should render fixture characteristics table', async ({page}) => {
            const table = page.locator('#transform-paths ~ table').first();

            await expect(table).toBeVisible();
            await expect(table).toContainText('Patterns');
        });
    });

    test.describe('Verification integration', () => {
        test('should render the verification integration heading', async ({page}) => {
            const heading = page.locator('h2', {hasText: 'Verification Integration'});

            await expect(heading).toBeVisible();
        });

        test('should render verification profiles table', async ({page}) => {
            const table = page.locator('h2:has-text("Verification Integration") ~ table').first();

            await expect(table).toBeVisible();

            const rows = table.locator('tr');
            const count = await rows.count();
            expect(count).toBeGreaterThanOrEqual(5);
        });

        test('should mention document-rendering profile', async ({page}) => {
            const table = page.locator('h2:has-text("Verification Integration") ~ table').first();

            await expect(table).toContainText('document-rendering');
        });

        test('should mention svg-dom-compare step', async ({page}) => {
            const table = page.locator('h2:has-text("Verification Integration") ~ table').first();

            await expect(table).toContainText('svg-dom-compare');
        });

        test('should describe regression detection steps', async ({page}) => {
            const list = page.locator('h3:has-text("Regression Detection") ~ ol');

            const items = list.locator('li');
            const count = await items.count();
            expect(count).toBeGreaterThanOrEqual(5);
        });

        test('should mention CODEOWNER approval requirement', async ({page}) => {
            const body = page.locator('body');

            await expect(body).toContainText('CODEOWNER');
        });
    });

    test.describe('All SVG fixtures', () => {
        test('should render exactly 4 inline SVGs', async ({page}) => {
            const svgs = page.locator('.dc-doc-page__content svg');

            const count = await svgs.count();
            expect(count).toBe(4);
        });

        test('all SVGs should have xmlns attribute', async ({page}) => {
            const svgs = page.locator('.dc-doc-page__content svg');

            const count = await svgs.count();
            for (let i = 0; i < count; i++) {
                await expect(svgs.nth(i)).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
            }
        });

        test('all SVGs should have viewBox attribute', async ({page}) => {
            const svgs = page.locator('.dc-doc-page__content svg');

            const count = await svgs.count();
            for (let i = 0; i < count; i++) {
                const viewBox = await svgs.nth(i).getAttribute('viewBox');
                expect(viewBox).toBeTruthy();
                expect((viewBox || '').length).toBeGreaterThan(0);
            }
        });
    });

    test.describe('TOC navigation', () => {
        test('should render Reproducers link in sidebar', async ({page}) => {
            const link = page.locator('.dc-toc a', {hasText: 'Reproducers'});

            await expect(link).toBeVisible();
        });

        test('should have correct href for Reproducers', async ({page}) => {
            const link = page.locator('.dc-toc a', {hasText: 'Reproducers'});

            await expect(link).toHaveAttribute('href', /reproducers/);
        });
    });
});
