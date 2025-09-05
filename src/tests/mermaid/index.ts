import {expect, test, webkit} from '@playwright/test';

const selectors = {
    mermaid_diagram: '.mermaid > svg',
    mermaid_diagram_controls: '.mermaid-zoom-menu-controls',
    mermaid_zoomin: 'div[data-action="zoomin"]',
} as const;

const png = {
    mermaid_diagram: 'mermaid.png',
    mermaid_contols: 'mermaid_controls.png',
    mermaid_zoom: 'mermaid_zoom.png',
} as const;

test.describe('Mermaid', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/mermaid/index');
    });

    test.describe('Basic functionality', () => {
        test('should render mermaid diagramm', async ({page}) => {
            const mermaidDiagram = page.locator(selectors.mermaid_diagram);

            await mermaidDiagram.screenshot({path: png.mermaid_diagram});
            await expect(mermaidDiagram).toHaveScreenshot(png.mermaid_diagram);
        });

        test('should render mermaid diagramm under safari browser', async () => {
            const browser = await webkit.launch({headless: false});
            const page = await browser.newPage();

            await page.goto('./ru/mermaid/index');

            const mermaidDiagram = page.locator(selectors.mermaid_diagram);

            await mermaidDiagram.screenshot({path: 'safari_' + png.mermaid_diagram});
            await expect(mermaidDiagram).toHaveScreenshot('safari_' + png.mermaid_diagram);
        });

        test('should render diagramm with controls on click', async ({page}) => {
            const mermaidDiagram = page.locator(selectors.mermaid_diagram);

            mermaidDiagram.click();

            // Wait for controls animation
            await page.waitForTimeout(300);

            await mermaidDiagram.screenshot({path: png.mermaid_contols});
            await expect(mermaidDiagram).toHaveScreenshot(png.mermaid_contols);
        });

        test('Mermaid zoom contros should work correctly', async ({page}) => {
            const mermaidDiagram = page.locator(selectors.mermaid_diagram);

            mermaidDiagram.click();
            // Wait for controls animation
            await page.waitForTimeout(300);

            await page.mouse.wheel(0, 600);
            const zoomIn = page.locator(selectors.mermaid_zoomin);

            await zoomIn.click({clickCount: 5, delay: 100});

            await mermaidDiagram.screenshot({path: png.mermaid_zoom, animations: 'disabled'});
            await expect(mermaidDiagram).toHaveScreenshot(png.mermaid_zoom, {maxDiffPixels: 5});
        });
    });
});
