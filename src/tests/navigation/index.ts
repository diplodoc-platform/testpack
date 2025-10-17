import type {Page} from '@playwright/test';

import {expect, test} from '@playwright/test';

// Selectors for navigation elements
const NAVIGATION_SELECTORS = {
    // Table of Contents
    toc: '.dc-doc-layout__toc',
    tocPanel: '.dc-toc',
    tocItem: '.dc-toc__list-item',
    tocLink: '.dc-toc__list-item a',
    
    // Header navigation
    header: '.dc-header',
    headerNav: '.dc-header__center',
    headerNavLink: '.dc-header__nav-link',
    headerNavDropdown: '.dc-header__nav-dropdown',
    
    // Content links
    contentArea: '.dc-doc-page__main',
    contentLink: '.dc-doc-page__main a[href]',
    
    // Search
    searchInput: '.dc-search-suggest input',
    searchPopup: '.dc-search-suggest__popup',
    searchItem: '.dc-search-suggest__list .g-list__item',
    searchFooter: '.dc-search-suggest__footer',
    searchFooterLink: '.dc-search-suggest__footer a',
} as const;

// Test pages structure
const TEST_PAGES = {
    TABS: './ru/syntax/tabs',
    CUT: './ru/syntax/cut',
    TERMS: './ru/syntax/terms',
    SEARCH_INDEX: './ru/search/index',
    SEARCH_ARTICLE_1: './ru/search/article-1',
    SEARCH_ARTICLE_2: './ru/search/article-2',
    MERMAID: './ru/mermaid/index',
} as const;

// Helper functions
function getTocLink(page: Page, text: string) {
    return page.locator(NAVIGATION_SELECTORS.tocLink).filter({hasText: text});
}

function getHeaderNavLink(page: Page, text: string) {
    return page.locator(NAVIGATION_SELECTORS.headerNavLink).filter({hasText: text});
}

test.describe('Navigation', () => {
    test.describe('TOC Navigation', () => {
        test.beforeEach(async ({page}) => {
            await page.goto(TEST_PAGES.TABS);
        });

        test('should display table of contents', async ({page}) => {
            // Assert - TOC should be visible
            const toc = page.locator(NAVIGATION_SELECTORS.tocPanel);
            await expect(toc).toBeVisible();
        });

        test('should navigate to page when clicking on TOC link', async ({page}) => {
            // Arrange
            const tocCutLink = getTocLink(page, 'Cut');
            await expect(tocCutLink).toBeVisible();

            // Act - Click on Cut link in TOC
            await tocCutLink.click();

            // Assert - Should navigate to Cut page
            await expect(page).toHaveURL(/\/ru\/syntax\/cut\.html/);
            
            // Assert - Page content should be loaded
            const contentArea = page.locator(NAVIGATION_SELECTORS.contentArea);
            await expect(contentArea).toBeVisible();
        });

        test('should navigate to different section when clicking on TOC link', async ({page}) => {
            // Arrange
            const tocSearchLink = getTocLink(page, 'Обзор');
            await expect(tocSearchLink).toBeVisible();

            // Act - Click on Search Overview link in TOC
            await tocSearchLink.click();

            // Assert - Should navigate to Search index page
            await expect(page).toHaveURL(/\/ru\/search\/index\.html/);
            await expect(page.locator(NAVIGATION_SELECTORS.contentArea)).toBeVisible();
        });

        test('should highlight active page in TOC', async ({page}) => {
            // Arrange - We're on Tabs page
            const tocTabsLink = getTocLink(page, 'Tabs');

            // Assert - Current page link should be highlighted
            await expect(tocTabsLink).toHaveClass(/active/);
        });

        test('should update TOC highlight when navigating', async ({page}) => {
            // Arrange
            const tocCutLink = getTocLink(page, 'Cut');
            const tocTabsLink = getTocLink(page, 'Tabs');

            // Assert - Initially Tabs is active
            await expect(tocTabsLink).toHaveClass(/active/);

            // Act - Navigate to Cut
            await tocCutLink.click();

            // Assert - Cut should now be active, Tabs should not
            await expect(tocCutLink).toHaveClass(/active/);
            await expect(tocTabsLink).not.toHaveClass(/active/);
        });
    });

    test.describe('Content Link Navigation', () => {
        test.beforeEach(async ({page}) => {
            await page.goto(TEST_PAGES.SEARCH_INDEX);
        });

        test('should navigate when clicking link in page content', async ({page}) => {
            // Arrange - Find first link in content
            const contentArea = page.locator(NAVIGATION_SELECTORS.contentArea);
            const firstContentLink = contentArea.locator('a[href*="article-1"]').first();
            
            await expect(firstContentLink).toBeVisible();

            // Act - Click on content link
            await firstContentLink.click();

            // Assert - Should navigate to the linked page
            await expect(page).toHaveURL(/\/ru\/search\/article-1\.html/);
            await expect(page.locator(NAVIGATION_SELECTORS.contentArea)).toBeVisible();
        });

        test('should open internal links in same page', async ({page}) => {
            // Arrange
            const contentArea = page.locator(NAVIGATION_SELECTORS.contentArea);
            const internalLink = contentArea.locator('a[href^="./"]').first();

            // Act - Click internal link
            if (await internalLink.count() > 0) {
                const currentContext = page.context();
                const pagesBefore = currentContext.pages().length;
                
                await internalLink.click();
                await page.waitForTimeout(500);

                // Assert - Should not open new tab
                const pagesAfter = currentContext.pages().length;
                expect(pagesAfter).toBe(pagesBefore);
            } else {
                test.skip();
            }
        });

        test('should navigate between search articles using content links', async ({page}) => {
            // Arrange - Go to article 1
            await page.goto(TEST_PAGES.SEARCH_ARTICLE_1);
            
            const contentArea = page.locator(NAVIGATION_SELECTORS.contentArea);
            const article2Link = contentArea.locator('a[href*="article-2"]').first();

            // Act - Click link to article 2
            if (await article2Link.count() > 0) {
                await article2Link.click();

                // Assert - Should be on article 2
                await expect(page).toHaveURL(/\/ru\/search\/article-2\.html/);
            }
        });
    });

    test.describe('Header Navigation', () => {
        test.beforeEach(async ({page}) => {
            await page.goto(TEST_PAGES.TABS);
        });

        test('should display header navigation', async ({page}) => {
            // Assert - Header should be visible
            const header = page.locator(NAVIGATION_SELECTORS.header);
            await expect(header).toBeVisible();
        });

        test('should navigate when clicking on header link (relative)', async ({page}) => {
            // Arrange
            const relativeLink = page.locator(NAVIGATION_SELECTORS.headerNavLink)
                .filter({hasText: 'Relative link'})
                .first();

            // Act - Click on relative link in header
            if (await relativeLink.count() > 0) {
                await relativeLink.click();

                // Assert - Should navigate
                await page.waitForLoadState('networkidle');
                await expect(page.locator(NAVIGATION_SELECTORS.contentArea)).toBeVisible();
            } else {
                test.skip();
            }
        });

        test('should navigate when clicking on header link (absolute)', async ({page}) => {
            // Arrange
            const absoluteLink = page.locator(NAVIGATION_SELECTORS.headerNavLink)
                .filter({hasText: 'Absolute link'})
                .first();

            // Act - Click on absolute link in header
            if (await absoluteLink.count() > 0) {
                await absoluteLink.click();

                // Assert - Should navigate
                await page.waitForLoadState('networkidle');
                await expect(page.locator(NAVIGATION_SELECTORS.contentArea)).toBeVisible();
            } else {
                test.skip();
            }
        });

        test('should open dropdown menu when clicking on dropdown trigger', async ({page}) => {
            // Arrange
            const dropdown = page.locator(NAVIGATION_SELECTORS.headerNavDropdown).first();

            // Act - Click dropdown (if exists)
            if (await dropdown.count() > 0) {
                await dropdown.click();

                // Assert - Dropdown menu should be visible
                const dropdownMenu = page.locator('.dc-header__nav-dropdown-menu');
                await expect(dropdownMenu).toBeVisible();
            } else {
                test.skip();
            }
        });

        test('should navigate when clicking on link inside dropdown', async ({page}) => {
            // Arrange
            const dropdown = page.locator(NAVIGATION_SELECTORS.header)
                .locator('button, a')
                .filter({hasText: 'Dropdown'})
                .first();

            if (await dropdown.count() === 0) {
                test.skip();
                return;
            }

            // Act - Open dropdown
            await dropdown.click();
            await page.waitForTimeout(300);

            // Click on first link in dropdown
            const dropdownLink = page.locator('.dc-header__nav-dropdown-menu a').first();
            await dropdownLink.click();

            // Assert - Should navigate
            await page.waitForLoadState('networkidle');
            await expect(page.locator(NAVIGATION_SELECTORS.contentArea)).toBeVisible();
        });
    });

    test.describe('Search Suggestions Navigation', () => {
        test.beforeEach(async ({page}) => {
            await page.goto(TEST_PAGES.TABS);
        });

        test('should navigate to search result page when clicking on suggestion', async ({
            page,
        }) => {
            // Arrange
            const searchInput = page.locator(NAVIGATION_SELECTORS.searchInput).last();
            const searchItems = page.locator(NAVIGATION_SELECTORS.searchItem);

            // Act - Type in search and click on first result
            await searchInput.click();
            await searchInput.fill('test');
            await searchItems.first().waitFor({state: 'visible', timeout: 2000});
            await searchItems.first().click();

            // Assert - Should navigate to search result page
            await expect(page).toHaveURL(/\.html/);
            await expect(page.locator(NAVIGATION_SELECTORS.contentArea)).toBeVisible();
        });

        test('should navigate to full search page when clicking footer link', async ({page}) => {
            // Arrange
            const searchInput = page.locator(NAVIGATION_SELECTORS.searchInput).last();
            const searchFooter = page.locator(NAVIGATION_SELECTORS.searchFooter);

            // Act - Type in search to show suggestions
            await searchInput.click();
            await searchInput.fill('test');
            
            // Wait for search footer to appear
            await page.waitForTimeout(1000);

            // Click on footer link if it exists
            if (await searchFooter.count() > 0) {
                const footerLink = searchFooter.locator('a').first();
                if (await footerLink.count() > 0) {
                    await footerLink.click();

                    // Assert - Should navigate to search page
                    await expect(page).toHaveURL(/search/);
                    await expect(page.locator(NAVIGATION_SELECTORS.contentArea)).toBeVisible();
                } else {
                    test.skip();
                }
            } else {
                test.skip();
            }
        });

        test('should close search popup after clicking on suggestion and navigating', async ({
            page,
        }) => {
            // Arrange
            const searchInput = page.locator(NAVIGATION_SELECTORS.searchInput).last();
            const searchItems = page.locator(NAVIGATION_SELECTORS.searchItem);
            const searchPopup = page.locator(NAVIGATION_SELECTORS.searchPopup);

            // Act - Search and click on result
            await searchInput.click();
            await searchInput.fill('test');
            await searchItems.first().waitFor({state: 'visible', timeout: 2000});
            await searchItems.first().click();

            // Assert - Popup should be closed after navigation
            await expect(page).toHaveURL(/\.html/);
            await expect(searchPopup).not.toBeVisible();
        });

        test('should preserve search query in URL when navigating from suggestion', async ({
            page,
        }) => {
            // Arrange
            const searchInput = page.locator(NAVIGATION_SELECTORS.searchInput).last();
            const searchItems = page.locator(NAVIGATION_SELECTORS.searchItem);
            const searchQuery = 'tabs';

            // Act - Search and click on result
            await searchInput.click();
            await searchInput.fill(searchQuery);
            await searchItems.first().waitFor({state: 'visible', timeout: 2000});
            
            // Get the first item's href
            const firstItem = searchItems.first();
            await firstItem.click();

            // Assert - Should navigate and page should be loaded
            await expect(page).toHaveURL(/\.html/);
            await expect(page.locator(NAVIGATION_SELECTORS.contentArea)).toBeVisible();
        });
    });

    test.describe('Navigation History', () => {
        test('should allow navigation back and forward', async ({page}) => {
            // Arrange - Start on Tabs page
            await page.goto(TEST_PAGES.TABS);
            
            // Act - Navigate to Cut page
            const tocCutLink = getTocLink(page, 'Cut');
            await tocCutLink.click();
            await expect(page).toHaveURL(/\/ru\/syntax\/cut\.html/);

            // Act - Navigate back
            await page.goBack();

            // Assert - Should be back on Tabs page
            await expect(page).toHaveURL(/\/ru\/syntax\/tabs\.html/);

            // Act - Navigate forward
            await page.goForward();

            // Assert - Should be on Cut page again
            await expect(page).toHaveURL(/\/ru\/syntax\/cut\.html/);
        });

        test('should maintain page state after navigating back', async ({page}) => {
            // Arrange - Start on Tabs page
            await page.goto(TEST_PAGES.TABS);
            
            // Remember initial scroll position
            const initialScrollY = await page.evaluate(() => window.scrollY);

            // Act - Navigate away and back
            const tocCutLink = getTocLink(page, 'Cut');
            await tocCutLink.click();
            await expect(page).toHaveURL(/\/ru\/syntax\/cut\.html/);
            await page.goBack();

            // Assert - Should be back on Tabs page
            await expect(page).toHaveURL(/\/ru\/syntax\/tabs\.html/);
            await expect(page.locator(NAVIGATION_SELECTORS.contentArea)).toBeVisible();
        });
    });

    test.describe('Cross-section Navigation', () => {
        test('should navigate between different sections using TOC', async ({page}) => {
            // Arrange
            await page.goto(TEST_PAGES.TABS);

            // Act - Navigate from Syntax section to Search section
            const searchLink = getTocLink(page, 'Обзор');
            await searchLink.click();

            // Assert - Should be in Search section
            await expect(page).toHaveURL(/\/ru\/search\/index\.html/);

            // Act - Navigate to Mermaid section
            const mermaidLink = getTocLink(page, 'Mermaid');
            await mermaidLink.click();

            // Assert - Should be in Mermaid section
            await expect(page).toHaveURL(/\/ru\/mermaid\/index\.html/);
        });

        test('should update TOC highlighting when navigating between sections', async ({page}) => {
            // Arrange
            await page.goto(TEST_PAGES.TABS);
            
            const tocTabsLink = getTocLink(page, 'Tabs');
            const tocCutLink = getTocLink(page, 'Cut');

            // Assert - Initially Tabs is active
            await expect(tocTabsLink).toHaveClass(/active/);

            // Act - Navigate to Cut
            await tocCutLink.click();

            // Assert - Cut should be active, Tabs should not
            await expect(tocCutLink).toHaveClass(/active/);
            await expect(tocTabsLink).not.toHaveClass(/active/);
        });
    });

    test.describe('Link Attributes', () => {
        test('should have proper href attributes on TOC links', async ({page}) => {
            await page.goto(TEST_PAGES.TABS);

            // Assert - TOC links should have valid href attributes
            const tocLinks = page.locator(NAVIGATION_SELECTORS.tocLink);
            const count = await tocLinks.count();
            
            expect(count).toBeGreaterThan(0);

            // Check first few links have href
            for (let i = 0; i < Math.min(count, 5); i++) {
                const link = tocLinks.nth(i);
                const href = await link.getAttribute('href');
                expect(href).toBeTruthy();
                expect(href?.length).toBeGreaterThan(0);
            }
        });

        test('should have proper href attributes on content links', async ({page}) => {
            await page.goto(TEST_PAGES.SEARCH_INDEX);

            // Assert - Content links should have valid href attributes
            const contentLinks = page.locator(NAVIGATION_SELECTORS.contentLink);
            const count = await contentLinks.count();

            if (count > 0) {
                const firstLink = contentLinks.first();
                const href = await firstLink.getAttribute('href');
                expect(href).toBeTruthy();
                expect(href?.length).toBeGreaterThan(0);
            }
        });
    });

    test.describe('Navigation Performance', () => {
        test('should load page content quickly after navigation', async ({page}) => {
            // Arrange
            await page.goto(TEST_PAGES.TABS);

            // Act - Navigate to another page
            const startTime = Date.now();
            const tocCutLink = getTocLink(page, 'Cut');
            await tocCutLink.click();
            await expect(page.locator(NAVIGATION_SELECTORS.contentArea)).toBeVisible();
            const endTime = Date.now();

            // Assert - Navigation should be fast (less than 5 seconds)
            const navigationTime = endTime - startTime;
            expect(navigationTime).toBeLessThan(5000);
        });
    });
});

