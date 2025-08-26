import type {PlaywrightTestArgs} from '@playwright/test';

import {expect, test} from '@playwright/test';

import {findTerm, findTooltip, openTerm} from './utils';

test.describe('Terms', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/terms');
    });

    test.describe('element', () => {
        test('should be visible and have correct attributes', async ({
            page,
        }: PlaywrightTestArgs) => {
            const termElement = await findTerm(page);

            await expect(termElement).toBeVisible();

            await expect(termElement).toHaveAttribute('role', 'button');
            await expect(termElement).toHaveAttribute('tabindex', '0');
            await expect(termElement).toHaveAttribute('term-key');
            await expect(termElement).toHaveAttribute('aria-describedby');
            await expect(termElement).toHaveAttribute('id');
        });

        test('should work independently from other terms', async ({page}: PlaywrightTestArgs) => {
            const firstTerm = await findTerm(page, 0);
            const secondTerm = await findTerm(page, 1);
            const firstTooltip = await findTooltip(page, firstTerm);
            const secondTooltip = await findTooltip(page, secondTerm);

            await firstTerm.click();
            await expect(firstTooltip).toBeVisible();

            await secondTerm.click();
            await expect(secondTooltip).toBeVisible();
            await expect(firstTooltip).not.toBeVisible();
        });
    });

    test.describe('tooltip', () => {
        test('should appear when clicking on term', async ({page}: PlaywrightTestArgs) => {
            const tooltip = await findTooltip(page);
            await expect(tooltip).not.toBeVisible();

            await openTerm(page);
            await expect(tooltip).toBeVisible();

            await expect(tooltip).toHaveClass(/yfm-term_dfn/);
            await expect(tooltip).toHaveClass(/open/);
            await expect(tooltip).toHaveAttribute('role', 'dialog');
            await expect(tooltip).toHaveAttribute('aria-live', 'polite');
            await expect(tooltip).toHaveAttribute('aria-modal', 'true');
        });

        test('should close when clicking outside of it', async ({page}: PlaywrightTestArgs) => {
            const tooltip = await findTooltip(page);

            await openTerm(page);
            await expect(tooltip).toBeVisible();

            await page.click('body', {position: {x: 10, y: 10}});
            await expect(tooltip).not.toBeVisible();
        });

        test('should be keyboard accessible', async ({page}: PlaywrightTestArgs) => {
            const termElement = await findTerm(page);
            const tooltip = await findTooltip(page);

            await termElement.focus();
            await page.keyboard.press('Enter');
            await expect(tooltip).toBeVisible();

            await page.keyboard.press('Escape');
            await expect(tooltip).not.toBeVisible();
        });

        test('should be positioned correctly', async ({page}: PlaywrightTestArgs) => {
            const termElement = await findTerm(page);
            const tooltip = await findTooltip(page);

            const termBox = await termElement.boundingBox();
            expect(termBox).toMatchObject({
                x: expect.anything(),
                y: expect.anything(),
            });

            await openTerm(page);
            await expect(tooltip).toHaveCSS('position', 'absolute');

            // Check that the tooltip has top and left styles
            const topStyle = await tooltip.evaluate((el) => el.style.top);
            const leftStyle = await tooltip.evaluate((el) => el.style.left);

            expect(topStyle).toBeTruthy();
            expect(leftStyle).toBeTruthy();

            // Check that the tooltip is positioned relative to the term
            const tooltipBox = await tooltip.boundingBox();
            expect(tooltipBox).toMatchObject({
                x: expect.anything(),
                y: expect.anything(),
            });

            // Tooltip should be near the term (within a reasonable distance)
            const distance = Math.sqrt(
                Math.pow(tooltipBox.x - termBox.x, 2) + Math.pow(tooltipBox.y - termBox.y, 2),
            );
            expect(distance).toBeLessThan(500); // Reasonable distance in pixels
        });

        test('Visual check of open tooltip structure', async ({page}) => {
            const termElement = await findTerm(page);
            const tooltip = await findTooltip(page);

            await termElement.click();

            await expect(tooltip).toBeVisible();
            await expect(tooltip).toHaveCSS('position', 'absolute');
            await expect(tooltip).toHaveCSS('display', 'block');

            const style = await tooltip.evaluate((el) => window.getComputedStyle(el));

            const {zIndex, backgroundColor, borderStyle, borderWidth, boxShadow} = style;

            expect(zIndex).not.toBe('auto');
            expect(parseInt(zIndex, 10)).toBeGreaterThan(0);
            expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
            expect(backgroundColor).not.toBe('transparent');

            const hasBorderStyle = borderStyle !== 'none' && borderWidth !== '0px';
            const hasBoxShadow = boxShadow !== 'none';
            const hasBorder = hasBorderStyle || hasBoxShadow;
            expect(hasBorder).toBeTruthy();

            // Check minimum tooltip dimensions
            const box = await tooltip.boundingBox();
            expect(box).toBeTruthy();
            expect(box.width).toBeGreaterThan(50); // Minimum width
            expect(box.height).toBeGreaterThan(20); // Minimum height
        });
    });
});
