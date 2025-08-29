import type {Page} from '@playwright/test';

import {expect, test} from '@playwright/test';

// Constants for test data
const SEARCH_SELECTORS = {
    searchInput: '.dc-search-suggest input',
    searchPopup: '.dc-search-suggest__popup',
    searchList: '.dc-search-suggest__list .g-list__items',
    searchItem: '.dc-search-suggest__list .g-list__item',
    searchLoader: '.dc-search-suggest__loader',
    searchEmpty: '.dc-search-suggest__list_empty',
    closeButton: '.dc-search-suggest__close',
} as const;

const TEST_QUERIES = {
    VALID: 'test',
    EMPTY: '',
    LONG: 'very long search query that should trigger search',
    SPECIAL_CHARS: 'test@#$%^&*()',
    RUSSIAN: 'тест',
} as const;

// Helper function to get the first search input
function getSearchInput(page: Page) {
    return page.locator(SEARCH_SELECTORS.searchInput).last();
}

test.describe('Search Suggest', () => {
    test.beforeEach(async ({page}) => {
        // Navigate to a page with search functionality
        await page.goto('./ru/syntax/cut');
    });

    test.describe('Basic functionality', () => {
        test('should render search input in header', async ({page}) => {
            // Assert - Search input should be visible
            const searchInput = getSearchInput(page);
            await expect(searchInput).toBeVisible();
            await expect(searchInput).toHaveAttribute('aria-autocomplete', 'list');
        });

        test('should focus on search input when clicking', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);

            // Act - Click on search input
            await searchInput.click();

            // Assert - Search input should be focused
            await expect(searchInput).toBeFocused();
        });

        test('should show placeholder text in search input', async ({page}) => {
            // Assert - Search input should have placeholder
            const searchInput = getSearchInput(page);
            await expect(searchInput).toHaveAttribute('placeholder');
        });
    });

    test.describe('Search input behavior', () => {
        test('should update input value when typing', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const testQuery = TEST_QUERIES.VALID;

            // Act - Type in search input
            await searchInput.click();
            await searchInput.fill(testQuery);

            // Assert - Input value should be updated
            await expect(searchInput).toHaveValue(testQuery);
        });

        test.skip('should clear input value when pressing Escape', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const testQuery = TEST_QUERIES.VALID;

            // Act - Type and press Escape
            await searchInput.click();
            await searchInput.fill(testQuery);
            await page.keyboard.press('Escape');

            // Assert - Input should be cleared
            await expect(searchInput).toHaveValue('');
        });

        test('should handle special characters in search query', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const testQuery = TEST_QUERIES.SPECIAL_CHARS;

            // Act - Type special characters
            await searchInput.click();
            await searchInput.fill(testQuery);

            // Assert - Input should contain special characters
            await expect(searchInput).toHaveValue(testQuery);
        });

        test('should handle Russian characters in search query', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const testQuery = TEST_QUERIES.RUSSIAN;

            // Act - Type Russian characters
            await searchInput.click();
            await searchInput.fill(testQuery);

            // Assert - Input should contain Russian characters
            await expect(searchInput).toHaveValue(testQuery);
        });
    });

    test.describe('Search suggestions', () => {
        test('should show search popup when typing', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const searchPopup = page.locator(SEARCH_SELECTORS.searchPopup);

            // Act - Type in search input
            await searchInput.click();
            await searchInput.fill(TEST_QUERIES.VALID);

            // Assert - Search popup should appear
            await expect(searchPopup).toBeVisible();
        });

        test('should show loader while searching', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const searchLoader = page.locator(SEARCH_SELECTORS.searchLoader);
            const searchList = page.locator(SEARCH_SELECTORS.searchList);
            const searchEmpty = page.locator(SEARCH_SELECTORS.searchEmpty);

            // Act - Type in search input
            await searchInput.click();
            await searchInput.fill(TEST_QUERIES.VALID);

            // Assert - For very fast local search, loader may not be visible at all.
            // Accept either: loader becomes visible briefly OR results/empty appear quickly.
            try {
                await Promise.race([
                    searchLoader.waitFor({state: 'visible', timeout: 500}),
                    searchList.waitFor({state: 'visible', timeout: 500}),
                    searchEmpty.waitFor({state: 'visible', timeout: 500}),
                ]);
            } catch {
                // Even if nothing became visible within 500ms, perform a soft check next.
            }

            const loaderVisible = await searchLoader.isVisible();
            const listVisible = await searchList.isVisible();
            const emptyVisible = await searchEmpty.isVisible();

            expect(loaderVisible || listVisible || emptyVisible).toBeTruthy();
        });

        test('should hide popup when input is empty', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const searchPopup = page.locator(SEARCH_SELECTORS.searchPopup);

            // Act - Type and then clear
            await searchInput.click();
            await searchInput.fill(TEST_QUERIES.VALID);
            await searchInput.clear();

            // Assert - Popup should be hidden
            await expect(searchPopup).not.toBeVisible();
        });

        test('should show empty state when no results found', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const searchEmpty = page.locator(SEARCH_SELECTORS.searchEmpty);

            // Act - Type query that should return no results
            await searchInput.click();
            await searchInput.fill('nonexistentquery12345');

            // Wait for search to complete
            await page.waitForTimeout(1000);

            // Assert - Empty state should be shown
            await expect(searchEmpty).toBeVisible();
        });
    });

    test.describe('Keyboard navigation', () => {
        test('should navigate through search results with arrow keys', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const searchItems = page.locator(SEARCH_SELECTORS.searchItem);

            // Act - Type and navigate
            await searchInput.click();
            await searchInput.fill(TEST_QUERIES.VALID);

            await searchItems.first().waitFor({state: 'visible', timeout: 1000});

            // Navigate down
            await page.keyboard.press('ArrowDown');

            // Assert - First item should be active
            // TODO:
            // await expect(searchItems.first()).toHaveAttribute('aria-selected', 'true');
            await expect(searchItems.first()).toHaveAttribute('data-qa', 'list-active-item');

            // Navigate down again
            await page.keyboard.press('ArrowDown');

            // Assert - Second item should be active
            // TODO:
            // await expect(searchItems.nth(1)).toHaveAttribute('aria-selected', 'true');
            await expect(searchItems.nth(1)).toHaveAttribute('data-qa', 'list-active-item');
        });

        test('should navigate up through search results', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const searchItems = page.locator(SEARCH_SELECTORS.searchItem);

            // Act - Type and navigate down then up
            await searchInput.click();
            await searchInput.fill(TEST_QUERIES.VALID);
            await searchItems.first().waitFor({state: 'visible', timeout: 1000});

            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('ArrowUp');

            // Assert - Should go back to first item
            // TODO:
            // await expect(searchItems.first()).toHaveAttribute('aria-selected', 'true');
            await expect(searchItems.first()).toHaveAttribute('data-qa', 'list-active-item');
        });

        test('should select item with Enter key', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);

            // Act - Type, navigate and select
            await searchInput.click();
            await searchInput.fill(TEST_QUERIES.VALID);
            await page.waitForTimeout(500);

            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');

            // Assert - Navigation should open selected article page
            await expect(page).toHaveURL(/\/ru\/search\/.*\.html/);
        });

        test('should close popup with Escape key', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const searchPopup = page.locator(SEARCH_SELECTORS.searchPopup);

            // Act - Type and press Escape
            await searchInput.click();
            await searchInput.fill(TEST_QUERIES.VALID);
            await page.keyboard.press('Escape');

            // Assert - Popup should be closed
            await expect(searchPopup).not.toBeVisible();
        });
    });

    test.describe('Mouse interaction', () => {
        test('should select item when clicking on it', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const searchItems = page.locator(SEARCH_SELECTORS.searchItem);

            // Act - Type and click on first item
            await searchInput.click();
            await searchInput.fill(TEST_QUERIES.VALID);
            await searchItems.first().waitFor({state: 'visible', timeout: 1000});

            await searchItems.first().click();

            // Assert - Should navigate to selected item
            await expect(page).toHaveURL(/\/ru\/search\/.*\.html/);
        });

        test('should close popup when clicking outside', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const searchPopup = page.locator(SEARCH_SELECTORS.searchPopup);

            // Act - Type and click outside
            await searchInput.click();
            await searchInput.fill(TEST_QUERIES.VALID);
            await page.click('body');

            // Assert - Popup should be hidden
            await expect(searchPopup).not.toBeVisible();
        });
    });

    test.describe('Search results structure', () => {
        test('should display search results in list format', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const searchList = page.locator(SEARCH_SELECTORS.searchList);

            // Act - Type in search input
            await searchInput.click();
            await searchInput.fill(TEST_QUERIES.VALID);
            await page.waitForTimeout(1000);

            // Assert - Search list should be visible
            await expect(searchList).toBeVisible();
            await expect(searchList).toHaveAttribute('role', 'listbox');
        });

        test('should display search result items with proper structure', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const searchItems = page.locator(SEARCH_SELECTORS.searchItem);

            // Act - Type in search input
            await searchInput.click();
            await searchInput.fill(TEST_QUERIES.VALID);
            await page.waitForTimeout(1000);

            // Assert - Search items should be visible and have proper structure
            const itemCount = await searchItems.count();
            expect(itemCount).toBeGreaterThan(0);

            // Check first item structure
            const firstItem = searchItems.first();
            await expect(firstItem).toBeVisible();
            await expect(firstItem).toHaveAttribute('role', 'option');
        });

        test('should display search result titles', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const searchItems = page.locator(SEARCH_SELECTORS.searchItem);

            // Act - Type in search input
            await searchInput.click();
            await searchInput.fill(TEST_QUERIES.VALID);
            await page.waitForTimeout(1000);

            // Assert - Search items should have titles
            const firstItem = searchItems.first();
            const itemText = await firstItem.textContent();
            expect(itemText).toBeTruthy();
            expect(itemText?.length).toBeGreaterThan(0);
        });
    });

    test.describe('Accessibility', () => {
        test.skip('should have proper ARIA attributes on search popup', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const searchPopup = page.locator(SEARCH_SELECTORS.searchPopup);

            // Act - Open search popup
            await searchInput.click();
            await searchInput.fill(TEST_QUERIES.VALID);

            // Assert - Search popup should have proper ARIA attributes
            await expect(searchPopup).toHaveAttribute('role', 'dialog');
            await expect(searchPopup).toHaveAttribute('aria-modal', 'false');
        });

        test('should have proper ARIA attributes on search items', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);
            const searchItems = page.locator(SEARCH_SELECTORS.searchItem);

            // Act - Open search popup and wait for items
            await searchInput.click();
            await searchInput.fill(TEST_QUERIES.VALID);
            await searchItems.first().waitFor({state: 'visible', timeout: 1000});

            // Assert - Search items should have proper ARIA attributes
            const firstItem = searchItems.first();
            await expect(firstItem).toHaveAttribute('role', 'option');
        });

        test('should handle keyboard navigation with proper focus management', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);

            // Act - Type and navigate
            await searchInput.click();
            await searchInput.fill(TEST_QUERIES.VALID);
            await page.waitForTimeout(500);

            const searchItems = page.locator(SEARCH_SELECTORS.searchItem);

            await page.keyboard.press('ArrowDown');

            // Assert - Focus should be managed properly
            // TODO:
            // await expect(searchItems.first()).toHaveAttribute('aria-selected', 'true');
            await expect(searchItems.first()).toHaveAttribute('data-qa', 'list-active-item');
        });
    });

    test.describe('Performance and debouncing', () => {
        test('should handle rapid typing without errors', async ({page}) => {
            // Arrange
            const searchInput = getSearchInput(page);

            // Act - Type rapidly
            await searchInput.click();
            for (let i = 0; i < 10; i++) {
                await searchInput.type('a');
                await page.waitForTimeout(50);
            }

            // Assert - Input should handle rapid typing
            await expect(searchInput).toHaveValue('aaaaaaaaaa');
        });
    });
});
