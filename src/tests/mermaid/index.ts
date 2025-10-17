import {expect, test, webkit} from '@playwright/test';

const selectors = {
    mermaid_diagram: '.mermaid > svg',
    mermaid_diagram_controls: '.mermaid-zoom-menu-controls',
    mermaid_zoomin: 'div[data-action="zoomin"]',
} as const;

test.describe('Mermaid', () => {
    test.skip();

    test.describe('Basic functionality', () => {
        test.beforeEach(async ({page}) => {
            await page.goto('./ru/mermaid/');
        });

        test('should render diagram', async ({page}) => {
            const mermaidDiagram = page.locator(selectors.mermaid_diagram);

            await expect(mermaidDiagram).toHaveScreenshot();
        });

        test('should render diagram with controls on click', async ({page}) => {
            const mermaidDiagram = page.locator(selectors.mermaid_diagram);

            await mermaidDiagram.click();

            // Wait for controls animation
            await page.waitForTimeout(300);

            await expect(mermaidDiagram).toHaveScreenshot();
        });

        test('should work correctly with scroll', async ({page}) => {
            const mermaidDiagram = page.locator(selectors.mermaid_diagram);

            await mermaidDiagram.click();

            await page.waitForTimeout(300);

            await page.mouse.wheel(0, 600);
            await page.waitForTimeout(300);

            await expect(mermaidDiagram).toHaveScreenshot({maxDiffPixels: 5});
        });

        test('should work correctly with zoom controls', async ({page}) => {
            const mermaidDiagram = page.locator(selectors.mermaid_diagram);

            await mermaidDiagram.click();

            await page.waitForTimeout(300);

            const zoomIn = page.locator(selectors.mermaid_zoomin);
            await zoomIn.click({clickCount: 5, delay: 1000});

            await page.waitForTimeout(300);

            await expect(mermaidDiagram).toHaveScreenshot({maxDiffPixels: 5});
        });
    });

    test.describe('under Safari browser', () => {
        test('should render diagram', async () => {
            const browser = await webkit.launch();
            const page = await browser.newPage();

            await page.goto('./ru/mermaid/');

            const mermaidDiagram = page.locator(selectors.mermaid_diagram);

            await expect(mermaidDiagram).toHaveScreenshot();
        });
    });
});
