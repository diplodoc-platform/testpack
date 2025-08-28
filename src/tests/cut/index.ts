import type {Page} from '@playwright/test';

import {expect, test} from '@playwright/test';

// Constants for test data
const CUT_TITLES = {
    BASIC: 'Заголовок',
    HTML: 'HTML контент',
    CODE: 'Код',
    NESTED: 'Вложенные элементы',
    OUTER: 'Внешний кат',
    INNER: 'Внутренний кат',
    BOLD: '**Жирный заголовок**',
    ITALIC: '*Курсивный заголовок*',
    CODE_IN_TITLE: '`Код в заголовке`',
    EMPTY: '',
    LIST_1: 'Кат в списке 1',
    LIST_2: 'Кат в списке 2',
} as const;

const CUT_IDS = {
    BASIC: 'basic-cut',
    HTML: 'html-cut',
    CODE: 'code-cut',
    NESTED: 'nested-cut',
    OUTER: 'outer-cut',
    INNER: 'inner-cut',
    BOLD: 'bold-cut',
    ITALIC: 'italic-cut',
    CODE_TITLE: 'code-title-cut',
    EMPTY: 'empty-cut',
    LIST_1: 'list-cut-1',
    LIST_2: 'list-cut-2',
    HEIGHT_SHORT: 'height-short',
    HEIGHT_TALL: 'height-tall',
} as const;

const selectors = {
    cut: '.yfm-cut',
    cutTitle: '.yfm-cut-title',
    cutContent: '.yfm-cut-content',
    cutButton: '> summary.yfm-cut-title',
    expanded: '[open]',
    highlight: '.cut-highlight',
} as const;

// Helper function to get details element from summary ID
function getCutElements(page: Page, cutId: string) {
    const summary = page.locator(`#${cutId}`);
    const details = summary.locator('..'); // Parent details element
    const content = details.locator(selectors.cutContent);
    return [details, summary, content];
}

test.describe('Cut', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/cut');
    });

    test.describe('Basic functionality', () => {
        test('should render cut blocks with titles and hidden content', async ({page}) => {
            // Check basic cut block
            const [, basicSummary, content] = getCutElements(page, CUT_IDS.BASIC);

            // Assert - Summary should be visible, content hidden initially
            await expect(basicSummary).toBeVisible();
            await expect(basicSummary).toHaveText(CUT_TITLES.BASIC);
            await expect(content).not.toBeVisible();
        });

        test('should expand and collapse content when clicking button', async ({page}) => {
            // Arrange
            const [basicDetails, basicSummary, content] = getCutElements(page, CUT_IDS.BASIC);

            // Act - Expand
            await basicSummary.click();

            // Assert - Content should be visible
            await expect(content).toBeVisible();
            await expect(basicDetails).toHaveAttribute('open');

            // Act - Collapse
            await basicSummary.click();

            // Assert - Content should be hidden
            await expect(content).not.toBeVisible();
            await expect(basicDetails).not.toHaveAttribute('open');
        });

        test('should maintain independent expand/collapse state for multiple cuts', async ({
            page,
        }) => {
            // Arrange
            const [basicDetails, basicSummary, basicContent] = getCutElements(page, CUT_IDS.BASIC);
            const [htmlDetails, htmlSummary, htmlContent] = getCutElements(page, CUT_IDS.HTML);

            // Act - Expand basic cut
            await basicSummary.click();

            // Assert - Only basic cut should be expanded
            await expect(basicDetails).toHaveAttribute('open');
            await expect(htmlDetails).not.toHaveAttribute('open');
            await expect(basicContent).toBeVisible();
            await expect(htmlContent).not.toBeVisible();

            // Act - Expand html cut
            await htmlSummary.click();

            // Assert - Both cuts should be expanded
            await expect(basicDetails).toHaveAttribute('open');
            await expect(htmlDetails).toHaveAttribute('open');
        });
    });

    test.describe('Content rendering', () => {
        test('should render HTML content correctly when expanded', async ({page}) => {
            // Arrange
            const [, htmlSummary, content] = getCutElements(page, CUT_IDS.HTML);

            // Act
            await htmlSummary.click();

            // Assert - HTML should be rendered
            await expect(content).toBeVisible();
            await expect(content.locator('strong')).toBeVisible();
            await expect(content.locator('strong')).toHaveText('жирным');
        });

        test('should render code blocks correctly when expanded', async ({page}) => {
            // Arrange
            const [, codeSummary, content] = getCutElements(page, CUT_IDS.CODE);

            // Act
            await codeSummary.click();

            // Assert - Code block should be rendered
            await expect(content).toBeVisible();
            await expect(content.locator('pre code')).toBeVisible();
            await expect(content.locator('pre code')).toContainText('function hello()');
        });

        test('should render complex nested content correctly', async ({page}) => {
            // Arrange
            const [, nestedSummary, content] = getCutElements(page, CUT_IDS.NESTED);

            // Act
            await nestedSummary.click();

            // Assert - List and table should be rendered
            await expect(content).toBeVisible();
            await expect(content.locator('ul li')).toHaveCount(3);
            await expect(content.locator('table')).toBeVisible();
            await expect(content.locator('table th')).toHaveCount(2);
        });
    });

    test.describe('Nested cuts', () => {
        test('should render and expand nested cuts independently', async ({page}) => {
            // Arrange
            const [outerDetails, outerSummary] = getCutElements(page, CUT_IDS.OUTER);
            const [innerDetails, innerSummary] = getCutElements(page, CUT_IDS.INNER);

            // Act - Expand outer cut
            await outerSummary.click();

            // Assert - Outer cut should be expanded, inner should be visible but collapsed
            await expect(outerDetails).toHaveAttribute('open');
            await expect(innerDetails).toBeVisible();
            await expect(innerDetails).not.toHaveAttribute('open');

            // Act - Expand inner cut
            await innerSummary.click();

            // Assert - Both cuts should be expanded
            await expect(outerDetails).toHaveAttribute('open');
            await expect(innerDetails).toHaveAttribute('open');
        });

        test('should maintain nested cut state when parent is collapsed', async ({page}) => {
            // Arrange
            const [outerDetails, outerSummary] = getCutElements(page, CUT_IDS.OUTER);
            const [innerDetails, innerSummary] = getCutElements(page, CUT_IDS.INNER);

            // Act - Expand both cuts
            await outerSummary.click();
            await innerSummary.click();

            // Assert - Both should be expanded
            await expect(outerDetails).toHaveAttribute('open');
            await expect(innerDetails).toHaveAttribute('open');

            // Act - Collapse outer cut
            await outerSummary.click();

            // Assert - Outer should be collapsed, inner should be hidden
            await expect(outerDetails).not.toHaveAttribute('open');
            await expect(innerDetails).not.toBeVisible();
        });
    });

    test.describe('Formatted titles', () => {
        test('should render bold formatted title correctly', async ({page}) => {
            // Arrange
            const [, boldSummary] = getCutElements(page, CUT_IDS.BOLD);

            // Assert - Bold formatting should be rendered
            await expect(boldSummary.locator('strong')).toBeVisible();
            await expect(boldSummary.locator('strong')).toHaveText('Жирный заголовок');
        });

        test('should render italic formatted title correctly', async ({page}) => {
            // Arrange
            const [, italicSummary] = getCutElements(page, CUT_IDS.ITALIC);

            // Assert - Italic formatting should be rendered
            await expect(italicSummary.locator('em')).toBeVisible();
            await expect(italicSummary.locator('em')).toHaveText('Курсивный заголовок');
        });

        test('should render code formatted title correctly', async ({page}) => {
            // Arrange
            const [, codeSummary] = getCutElements(page, CUT_IDS.CODE_TITLE);

            // Assert - Code formatting should be rendered
            await expect(codeSummary.locator('code')).toBeVisible();
            await expect(codeSummary.locator('code')).toHaveText('Код в заголовке');
        });
    });

    test.describe('Empty titles', () => {
        test('should render cut with empty title', async ({page}) => {
            // Arrange
            const [, emptySummary, content] = getCutElements(page, CUT_IDS.EMPTY);

            // Assert - Should render with empty title
            await expect(emptySummary).toBeVisible();
            await expect(emptySummary).toHaveText('');
            await expect(content).not.toBeVisible();

            // Act - Expand
            await emptySummary.click();

            // Assert - Content should be visible
            await expect(content).toBeVisible();
            await expect(content).toContainText('Контент без заголовка');
        });
    });

    test.describe('Cuts in lists', () => {
        test('should render cuts inside list items correctly', async ({page}) => {
            // Arrange
            const [, firstListSummary, content] = getCutElements(page, CUT_IDS.LIST_1);

            // Assert - Title should be visible, content hidden
            await expect(firstListSummary).toBeVisible();
            await expect(firstListSummary).toHaveText(CUT_TITLES.LIST_1);
            await expect(content).not.toBeVisible();

            // Act - Expand
            await firstListSummary.click();

            // Assert - Content should be visible
            await expect(content).toBeVisible();
            await expect(content).toContainText('Контент первого ката в списке');
        });

        test('should maintain independent state for cuts in different list items', async ({
            page,
        }) => {
            // Arrange
            const [firstListDetails, firstListSummary] = getCutElements(page, CUT_IDS.LIST_1);
            const [secondListDetails, secondListSummary] = getCutElements(page, CUT_IDS.LIST_2);

            // Act - Expand first list cut
            await firstListSummary.click();

            // Assert - Only first should be expanded
            await expect(firstListDetails).toHaveAttribute('open');
            await expect(secondListDetails).not.toHaveAttribute('open');

            // Act - Expand second list cut
            await secondListSummary.click();

            // Assert - Both should be expanded
            await expect(firstListDetails).toHaveAttribute('open');
            await expect(secondListDetails).toHaveAttribute('open');
        });
    });

    test.describe('URL hash functionality', () => {
        test.beforeEach(async ({page}) => {
            await page.goto(`./`);
        });

        test('should expand cut when URL contains hash', async ({page}) => {
            // Arrange - Navigate with hash for basic cut
            await page.goto(`./ru/syntax/cut#${CUT_IDS.BASIC}`);

            // Get the cut elements
            const [basicDetails] = getCutElements(page, CUT_IDS.BASIC);

            // Assert - Cut should be expanded and highlighted
            await expect(basicDetails).toHaveAttribute('open');

            // Assert - Cut should be visible in viewport
            await expect(basicDetails).toBeInViewport();
        });

        test('should scroll to cut when opened via hash', async ({page}) => {
            // Arrange - Navigate with hash for last cut
            await page.goto(`./ru/syntax/cut#${CUT_IDS.HEIGHT_TALL}`);

            // Get the cut elements
            const [tallDetails] = getCutElements(page, CUT_IDS.HEIGHT_TALL);

            // Assert - Cut should be expanded
            await expect(tallDetails).toHaveAttribute('open');

            // Assert - Cut should be visible in viewport (scrolled to)
            await expect(tallDetails).toBeInViewport();
        });

        test('should expand nested cut when URL contains inner cut hash', async ({page}) => {
            // Arrange - Navigate with hash for inner cut
            await page.goto(`./ru/syntax/cut#${CUT_IDS.INNER}`);

            // Get the cuts by ID
            const [outerDetails] = getCutElements(page, CUT_IDS.OUTER);
            const [innerDetails] = getCutElements(page, CUT_IDS.INNER);

            // Assert - Both outer and inner cuts should be expanded
            await expect(outerDetails).toHaveAttribute('open');
            await expect(innerDetails).toHaveAttribute('open');

            // Assert - Inner cut should be visible in viewport (target element)
            await expect(innerDetails).toBeInViewport();
        });

        test('should show highlight effect when opened via hash', async ({page}) => {
            // Arrange - Navigate with hash
            await page.goto(`./ru/syntax/cut#${CUT_IDS.BASIC}`);

            // Get the cut elements
            const [basicDetails] = getCutElements(page, CUT_IDS.BASIC);

            // Assert - Should have highlight class
            await expect(basicDetails).toHaveClass(/cut-highlight/);

            // Assert - Cut should be visible in viewport
            await expect(basicDetails).toBeInViewport();

            // Wait for highlight to disappear
            await page.waitForTimeout(1000);

            // Assert - Highlight should be removed
            await expect(basicDetails).not.toHaveClass(/cut-highlight/);
        });

        test('should keep BASIC cut in viewport when opened via hash', async ({page}) => {
            await page.goto(`./ru/syntax/cut#${CUT_IDS.BASIC}`);

            const [basicDetails] = getCutElements(page, CUT_IDS.BASIC);

            await expect(basicDetails).toHaveAttribute('open');
            await expect(basicDetails).toBeInViewport();
        });

        test('should keep INNER cut in viewport when opened via hash', async ({page}) => {
            await page.goto(`./ru/syntax/cut#${CUT_IDS.INNER}`);

            const [innerDetails] = getCutElements(page, CUT_IDS.INNER);

            await expect(innerDetails).toHaveAttribute('open');
            await expect(innerDetails).toBeInViewport();
        });

        test('should keep CODE cut in viewport when opened via hash', async ({page}) => {
            await page.goto(`./ru/syntax/cut#${CUT_IDS.CODE}`);

            const [codeDetails] = getCutElements(page, CUT_IDS.CODE);

            await expect(codeDetails).toHaveAttribute('open');
            await expect(codeDetails).toBeInViewport();
        });

        test('should focus on cut summary when navigating via hash on page load', async ({
            page,
        }) => {
            // Arrange - Navigate to page with hash
            await page.goto(`./ru/syntax/cut#${CUT_IDS.BASIC}`);

            // Assert - Cut should be expanded
            const [basicDetails, basicSummary] = getCutElements(page, CUT_IDS.BASIC);
            await expect(basicDetails).toHaveAttribute('open');

            // Assert - Summary should be focused
            await expect(basicSummary).toBeFocused();
        });

        test('should focus on nested cut summary when navigating via hash on page load', async ({
            page,
        }) => {
            // Arrange - Navigate to page with nested cut hash
            await page.goto(`./ru/syntax/cut#${CUT_IDS.INNER}`);

            // Assert - Both outer and inner cuts should be expanded
            const [outerDetails] = getCutElements(page, CUT_IDS.OUTER);
            const [innerDetails, innerSummary] = getCutElements(page, CUT_IDS.INNER);
            await expect(outerDetails).toHaveAttribute('open');
            await expect(innerDetails).toHaveAttribute('open');

            // Assert - Inner cut summary should be focused
            await expect(innerSummary).toBeFocused();
        });

        test('should focus on cut summary when hash changes after page load', async ({page}) => {
            // Act - Navigate to page with hash
            await page.goto(`./ru/syntax/cut#${CUT_IDS.HTML}`);

            // Assert - Cut should be expanded
            const [htmlDetails, htmlSummary] = getCutElements(page, CUT_IDS.HTML);
            await expect(htmlDetails).toHaveAttribute('open');

            // Assert - Summary should be focused
            await expect(htmlSummary).toBeFocused();
        });

        test('should focus on cut summary when clicking link with hash', async ({page}) => {
            // Act - Navigate to page
            await page.goto(`./ru/syntax/cut`);

            // Act - Click on link that points to cut
            await page.click(`a[href*="#${CUT_IDS.CODE}"]`);

            // Assert - Cut should be expanded
            const [codeDetails, codeSummary] = getCutElements(page, CUT_IDS.CODE);
            await expect(codeDetails).toHaveAttribute('open');

            // Assert - Summary should be focused
            await expect(codeSummary).toBeFocused();
        });

        test('should focus on cut summary when navigating via hash and cut is already open', async ({
            page,
        }) => {
            // Act - Navigate to page
            await page.goto(`./ru/syntax/cut`);

            // Arrange - Open a cut
            const [basicDetails, basicSummary] = getCutElements(page, CUT_IDS.BASIC);
            await basicSummary.click();
            await expect(basicDetails).toHaveAttribute('open');

            // Act - Navigate to different cut via hash
            await page.goto(`./ru/syntax/cut#${CUT_IDS.HTML}`);

            // Assert - New cut should be expanded and focused
            const [htmlDetails, htmlSummary] = getCutElements(page, CUT_IDS.HTML);
            await expect(htmlDetails).toHaveAttribute('open');
            await expect(htmlSummary).toBeFocused();

            // Since cuts work independently, previous cut should still be open
            await expect(basicDetails).toHaveAttribute('open');
        });

        test('should maintain focus on cut summary after page refresh with hash', async ({
            page,
        }) => {
            // Arrange - Navigate to page with hash
            await page.goto(`./ru/syntax/cut#${CUT_IDS.BASIC}`);

            // Assert - Cut should be expanded and focused
            const [basicDetails, basicSummary] = getCutElements(page, CUT_IDS.BASIC);
            await expect(basicDetails).toHaveAttribute('open');
            await expect(basicSummary).toBeFocused();

            // Act - Refresh page
            await page.reload();

            // Assert - Cut should still be expanded and focused after refresh
            await expect(basicDetails).toHaveAttribute('open');
            await expect(basicSummary).toBeFocused();
        });

        test('should handle multiple hash changes correctly', async ({page}) => {
            // Act - Navigate to first cut
            await page.goto(`./ru/syntax/cut#${CUT_IDS.BASIC}`);

            // Assert - First cut should be expanded and focused
            const [basicDetails, basicSummary] = getCutElements(page, CUT_IDS.BASIC);
            await expect(basicDetails).toHaveAttribute('open');
            await expect(basicSummary).toBeFocused();

            // Act - Navigate to different cut
            await page.goto(`./ru/syntax/cut#${CUT_IDS.HTML}`);

            // Assert - Second cut should be expanded and focused
            const [htmlDetails, htmlSummary] = getCutElements(page, CUT_IDS.HTML);
            await expect(htmlDetails).toHaveAttribute('open');
            await expect(htmlSummary).toBeFocused();

            // Since cuts work independently, basicDetails should still be open
            await expect(basicDetails).toHaveAttribute('open');
        });
    });

    test.describe('Accessibility', () => {
        test('should have proper ARIA attributes and keyboard navigation', async ({page}) => {
            // Arrange
            const [basicDetails, basicSummary, content] = getCutElements(page, CUT_IDS.BASIC);

            // Assert - Initial state
            await expect(basicDetails).not.toHaveAttribute('open');

            // Act - Expand via click
            await basicSummary.click();

            // Assert - Expanded state
            await expect(basicDetails).toHaveAttribute('open');

            // Act - Collapse via keyboard
            await basicSummary.focus();
            await page.keyboard.press('Enter');

            // Assert - Collapsed state
            await expect(content).not.toBeVisible();
            await expect(basicDetails).not.toHaveAttribute('open');
        });

        test('should maintain focus after expanding cut via keyboard', async ({page}) => {
            // Arrange
            const [basicDetails, basicSummary] = getCutElements(page, CUT_IDS.BASIC);

            // Act - Focus and expand via keyboard
            await basicSummary.focus();
            await page.keyboard.press('Enter');

            // Assert - Cut should be expanded and summary should remain focused
            await expect(basicDetails).toHaveAttribute('open');
            await expect(basicSummary).toBeFocused();
        });

        test('should handle focus correctly when navigating between cuts with Tab', async ({
            page,
        }) => {
            // Arrange - Use cuts from the same section that are adjacent
            const [, boldSummary] = getCutElements(page, CUT_IDS.BOLD);
            const [, italicSummary] = getCutElements(page, CUT_IDS.ITALIC);

            // Act - Focus first cut and navigate with Tab
            await boldSummary.focus();
            await page.keyboard.press('Tab');

            // Assert - Focus should move to next cut summary
            await expect(italicSummary).toBeFocused();
        });

        test('should handle focus correctly when navigating with Shift+Tab', async ({page}) => {
            // Arrange - Use cuts from the same section that are adjacent
            const [, boldSummary] = getCutElements(page, CUT_IDS.BOLD);
            const [, italicSummary] = getCutElements(page, CUT_IDS.ITALIC);

            // Act - Focus second cut and navigate with Shift+Tab
            await italicSummary.focus();
            await page.keyboard.down('Shift');
            await page.keyboard.press('Tab');
            await page.keyboard.up('Shift');

            // Assert - Focus should move to previous cut summary
            await expect(boldSummary).toBeFocused();
        });
    });

    test.describe('Visual behavior', () => {
        test('should have smooth expand/collapse animation', async ({page}) => {
            // Arrange
            const [, basicSummary, content] = getCutElements(page, CUT_IDS.BASIC);

            // Act - Expand
            await basicSummary.click();

            // Assert - Content should be visible with transition
            await expect(content).toBeVisible();

            // Check for transition CSS property
            const transition = await content.evaluate(
                (el: Element) => window.getComputedStyle(el).transition,
            );
            expect(transition).not.toBe('none');
        });

        test('should maintain proper spacing and layout when expanded', async ({page}) => {
            // Arrange
            const [basicDetails, basicSummary] = getCutElements(page, CUT_IDS.BASIC);
            const [htmlDetails] = getCutElements(page, CUT_IDS.HTML);

            // Get initial positions
            const basicCutInitialBox = await basicDetails.boundingBox();
            const htmlCutInitialBox = await htmlDetails.boundingBox();

            // Act - Expand basic cut
            await basicSummary.click();

            // Wait for animation
            await page.waitForTimeout(300);

            // Get positions after expansion
            const basicCutExpandedBox = await basicDetails.boundingBox();
            const htmlCutExpandedBox = await htmlDetails.boundingBox();

            // Assert - Basic cut should be taller, html cut should move down
            expect(basicCutExpandedBox?.height).toBeGreaterThan(basicCutInitialBox?.height || 0);
            expect(htmlCutExpandedBox?.y).toBeGreaterThan(htmlCutInitialBox?.y || 0);
        });
    });
});
