import {expect, test} from '@playwright/test';

const CONTENT_MARKERS = {
    FIRST_BLOCK: 'Первый блок',
    SECOND_BLOCK: 'Второй блок',
    OUTER_CONTENT_1: 'Контент внешней вкладки 1.',
} as const;

const selectors = {
    container: '.yfm-tabs',
    list: '.yfm-tab-list',
    tab: '.yfm-tab',
    panel: '.yfm-tab-panel',
    active: '.active',
    dropdownSelect: '.yfm-tabs-dropdown-select',
    radioVariant: '[data-diplodoc-variant="radio"]',
    dropdownVariant: '[data-diplodoc-variant="dropdown"]',
    accordionVariant: '[data-diplodoc-variant="accordion"]',
    verticalTab: '.yfm-vertical-tab',
} as const;

test.describe('Tabs', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/tabs');
    });

    test.describe('Regular tabs', () => {
        test('should switch active tab and panel when clicking', async ({page}) => {
            // Arrange
            const firstTabs = page.locator(selectors.container).first();
            const tabs = firstTabs.locator(selectors.list).locator(selectors.tab);
            const panels = firstTabs.locator(selectors.panel);

            // Act & Assert - Initial state
            await expect(tabs).toHaveCount(3);
            await expect(panels).toHaveCount(3);
            await expect(tabs.nth(0)).toHaveClass(/active/);
            await expect(panels.nth(0)).toHaveClass(/active/);

            // Act - Switch to second tab
            await tabs.nth(1).click();

            // Assert - Second tab active, first inactive
            await expect(tabs.nth(1)).toHaveClass(/active/);
            await expect(panels.nth(1)).toHaveClass(/active/);
            await expect(tabs.nth(0)).not.toHaveClass(/active/);
            await expect(panels.nth(0)).not.toHaveClass(/active/);
        });

        test('should maintain only one active panel at a time', async ({page}) => {
            // Arrange
            const firstTabs = page.locator(selectors.container).first();
            const panels = firstTabs.locator(selectors.panel);

            // Act - Switch between tabs
            const tabs = firstTabs.locator(selectors.list).locator(selectors.tab);
            await tabs.nth(1).click();
            await tabs.nth(2).click();

            // Assert - Only one panel should be active
            const activePanels = await panels.evaluateAll(
                (els) => els.filter((el) => el.classList.contains('active')).length,
            );
            expect(activePanels).toBe(1);
        });
    });

    test.describe('Grouped tabs synchronization', () => {
        test('should sync active tabs between groups with same group key', async ({page}) => {
            // Arrange
            const firstGroup = page
                .locator(selectors.container)
                .filter({hasText: CONTENT_MARKERS.FIRST_BLOCK})
                .first();
            const secondGroup = page
                .locator(selectors.container)
                .filter({hasText: CONTENT_MARKERS.SECOND_BLOCK})
                .first();

            const firstTabs = firstGroup.locator(selectors.list).locator(selectors.tab);
            const secondTabs = secondGroup.locator(selectors.list).locator(selectors.tab);

            // Act - Click Windows tab (index 2) in first group
            await firstTabs.nth(2).click();

            // Assert - Both groups should have Windows tab active
            await expect(firstTabs.nth(2)).toHaveClass(/active/);
            await expect(secondTabs.nth(2)).toHaveClass(/active/);
        });

        test('should update URL query parameter when switching grouped tabs', async ({page}) => {
            // Arrange
            const firstGroup = page
                .locator(selectors.container)
                .filter({hasText: CONTENT_MARKERS.FIRST_BLOCK})
                .first();
            const firstTabs = firstGroup.locator(selectors.list).locator(selectors.tab);

            // Act - Switch to Windows tab
            await firstTabs.nth(0).click(); // Ensure baseline
            await firstTabs.nth(2).click(); // Windows (slug: windows)

            // Assert - URL should contain the tab state
            await expect.poll(() => page.url()).toContain('tabs=platforms_windows');
        });

        test('should restore tab state from URL query parameters on page load', async ({page}) => {
            // Arrange & Act - Load page with specific tab state
            await page.goto('./ru/syntax/tabs?tabs=platforms_macos');
            await page.waitForSelector(selectors.list);

            const firstGroup = page
                .locator(selectors.container)
                .filter({hasText: CONTENT_MARKERS.FIRST_BLOCK})
                .first();
            const secondGroup = page
                .locator(selectors.container)
                .filter({hasText: CONTENT_MARKERS.SECOND_BLOCK})
                .first();

            const firstTabs = firstGroup.locator(selectors.list).locator(selectors.tab);
            const secondTabs = secondGroup.locator(selectors.list).locator(selectors.tab);

            // Assert - Both groups should have macOS tab active (index 1)
            await expect(firstTabs).toHaveCount(3);
            await expect(secondTabs).toHaveCount(3);
            await expect(firstTabs.nth(1)).toHaveClass(/active/); // macOS
            await expect(secondTabs.nth(1)).toHaveClass(/active/);
        });
    });

    test.describe('Radio variant', () => {
        test('should toggle active state on titles and content when clicked', async ({page}) => {
            // Arrange
            const radio = page.locator(selectors.radioVariant).first();
            const titles = radio.locator(selectors.verticalTab);
            const contents = radio.locator(selectors.panel);

            await expect(titles).toHaveCount(2);
            await expect(contents).toHaveCount(2);

            // Act - Open second tab
            await titles.nth(1).click();

            // Assert - Second tab should be active
            await expect(titles.nth(1)).toHaveClass(/active/);
            await expect(contents.nth(1)).toHaveClass(/active/);

            // Act - Close it by clicking again
            await titles.nth(1).click();

            // Assert - Second tab should be inactive
            await expect(titles.nth(1)).not.toHaveClass(/active/);
            await expect(contents.nth(1)).not.toHaveClass(/active/);
        });
    });

    test.describe('Dropdown variant', () => {
        test('should update active panel and select label when menu item is clicked', async ({
            page,
        }) => {
            // Arrange
            const dropdown = page.locator(selectors.dropdownVariant).first();
            const select = dropdown.locator(selectors.dropdownSelect);
            const menuItems = dropdown.locator(selectors.tab);
            const panels = dropdown.locator('> .yfm-tab-panel');

            // Act - Open dropdown and select second item
            await expect(select).toBeVisible();
            await select.click();
            await menuItems.nth(1).click();

            // Assert - Second panel should be active and select should be filled
            await expect(panels.nth(1)).toHaveClass(/active/);
            await expect(select).toHaveClass(/filled/);
        });
    });

    test.describe('Accordion variant', () => {
        test('should expand clicked section and collapse others', async ({page}) => {
            // Arrange
            const accordion = page.locator(selectors.accordionVariant).first();
            const titles = accordion.locator(selectors.tab);
            const panels = accordion.locator(selectors.panel);

            await expect(titles).toHaveCount(2);

            // Act - Click first title
            await titles.nth(0).click();

            // Assert - First panel should be active
            await expect(panels.nth(0)).toHaveClass(/active/);

            // Act - Click second title
            await titles.nth(1).click();

            // Assert - Second panel should be active, first should be inactive
            await expect(panels.nth(1)).toHaveClass(/active/);
            await expect(panels.nth(0)).not.toHaveClass(/active/);
        });
    });

    test.describe('Nested tabs', () => {
        test('should render and switch inner tabs independently of outer tabs', async ({page}) => {
            // Arrange
            const nestedRoot = page
                .locator(selectors.container)
                .filter({hasText: CONTENT_MARKERS.OUTER_CONTENT_1})
                .first();
            const inner = nestedRoot.locator(selectors.container).first();
            const innerTabs = inner.locator(selectors.list).locator(selectors.tab);
            const innerPanels = inner.locator(selectors.panel);

            await expect(innerTabs).toHaveCount(2);
            await expect(innerPanels).toHaveCount(2);

            // Act - Switch inner tab
            await innerTabs.nth(1).click();

            // Assert - Inner tab should switch independently
            await expect(innerTabs.nth(1)).toHaveClass(/active/);
            await expect(innerPanels.nth(1)).toHaveClass(/active/);
        });
    });

    test.describe('Layout and styling', () => {
        test('should maintain consistent container width when switching between tabs', async ({
            page,
        }) => {
            // Arrange
            const firstTabs = page.locator(selectors.container).first();
            const tabs = firstTabs.locator(selectors.list).locator(selectors.tab);
            const panels = firstTabs.locator(selectors.panel);

            // Act - Click Windows (likely widest label) then Linux
            await tabs.nth(2).click(); // Windows
            const containerWidthBefore = await firstTabs.evaluate(
                (el) => el.getBoundingClientRect().width,
            );

            await tabs.nth(0).click(); // Linux
            const containerWidthAfter = await firstTabs.evaluate(
                (el) => el.getBoundingClientRect().width,
            );

            // Assert - Container width should remain stable
            const delta = Math.abs(containerWidthAfter - containerWidthBefore);
            expect(delta).toBeLessThan(5);

            // Additional assertion - Only one panel should be visible
            const visiblePanels = await panels.evaluateAll(
                (els) => els.filter((el) => el.classList.contains('active')).length,
            );
            expect(visiblePanels).toBe(1);
        });

        test('should set container height equal to the active panel height', async ({page}) => {
            // Arrange: select the height demo tabs by stable group key
            const heightDemo = page
                .locator(`${selectors.container}[data-diplodoc-group="height_demo"]`)
                .first();
            const tabs = heightDemo.locator(selectors.list).locator(selectors.tab);
            const panels = heightDemo.locator(selectors.panel);
            const header = heightDemo.locator(selectors.list).first();

            await expect(tabs).toHaveCount(2);
            await expect(panels).toHaveCount(2);

            // Helper to get dimensions
            const getHeights = async () => {
                const [containerHeight, panelHeights, headerHeight] = await Promise.all([
                    heightDemo.evaluate((el) => el.getBoundingClientRect().height),
                    panels.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height)),
                    header.evaluate((el) => el.getBoundingClientRect().height),
                ]);
                return {containerHeight, panelHeights, headerHeight};
            };

            // Initial (short) selected
            const initial = await getHeights();

            // Expect container ≈ header + short panel height
            const shortIndex = 0;
            const expectedInitial = initial.headerHeight + initial.panelHeights[shortIndex];
            expect(Math.abs(initial.containerHeight - expectedInitial)).toBeLessThan(24);

            // Switch to tall panel
            await tabs.nth(1).click();

            const after = await getHeights();

            // Expect container ≈ header + tall panel height and increased
            const tallIndex = 1;
            const expectedAfter = after.headerHeight + after.panelHeights[tallIndex];
            expect(Math.abs(after.containerHeight - expectedAfter)).toBeLessThan(24);
            expect(after.containerHeight).toBeGreaterThan(initial.containerHeight);
        });
    });
});
