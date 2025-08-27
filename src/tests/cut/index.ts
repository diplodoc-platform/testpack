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

test.describe('Cut', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/cut');
    });

    test.describe('Basic functionality', () => {
        test('should render cut blocks with titles and hidden content', async ({page}) => {
            // Arrange
            const cuts = page.locator(selectors.cut);

            // Assert - Should have multiple cut blocks
            await expect(cuts).toHaveCount(14);

            // Check basic cut block
            const basicCut = page.locator(`#${CUT_IDS.BASIC}`);
            const title = basicCut.locator(selectors.cutTitle);
            const content = basicCut.locator(selectors.cutContent);
            const button = basicCut.locator(selectors.cutButton);

            // Assert - Title should be visible, content hidden initially
            await expect(title).toBeVisible();
            await expect(title).toHaveText(CUT_TITLES.BASIC);
            await expect(content).not.toBeVisible();
            await expect(button).toBeVisible();
        });

        test('should expand and collapse content when clicking button', async ({page}) => {
            // Arrange
            const basicCut = page.locator(`#${CUT_IDS.BASIC}`);
            const content = basicCut.locator(selectors.cutContent);
            const button = basicCut.locator(selectors.cutButton);

            // Act - Expand
            await button.click();

            // Assert - Content should be visible
            await expect(content).toBeVisible();
            await expect(basicCut).toHaveAttribute('open');

            // Act - Collapse
            await button.click();

            // Assert - Content should be hidden
            await expect(content).not.toBeVisible();
            await expect(basicCut).not.toHaveAttribute('open');
        });

        test('should maintain independent expand/collapse state for multiple cuts', async ({
            page,
        }) => {
            // Arrange
            const basicCut = page.locator(`#${CUT_IDS.BASIC}`);
            const htmlCut = page.locator(`#${CUT_IDS.HTML}`);

            // Act - Expand basic cut
            await basicCut.locator(selectors.cutButton).click();

            // Assert - Only basic cut should be expanded
            await expect(basicCut).toHaveAttribute('open');
            await expect(htmlCut).not.toHaveAttribute('open');
            await expect(basicCut.locator(selectors.cutContent)).toBeVisible();
            await expect(htmlCut.locator(selectors.cutContent)).not.toBeVisible();

            // Act - Expand html cut
            await htmlCut.locator(selectors.cutButton).click();

            // Assert - Both cuts should be expanded
            await expect(basicCut).toHaveAttribute('open');
            await expect(htmlCut).toHaveAttribute('open');
        });
    });

    test.describe('Content rendering', () => {
        test('should render HTML content correctly when expanded', async ({page}) => {
            // Arrange
            const htmlCut = page.locator(`#${CUT_IDS.HTML}`);
            const content = htmlCut.locator(selectors.cutContent);

            // Act
            await htmlCut.locator(selectors.cutButton).click();

            // Assert - HTML should be rendered
            await expect(content).toBeVisible();
            await expect(content.locator('strong')).toBeVisible();
            await expect(content.locator('strong')).toHaveText('жирным');
        });

        test('should render code blocks correctly when expanded', async ({page}) => {
            // Arrange
            const codeCut = page.locator(`#${CUT_IDS.CODE}`);
            const content = codeCut.locator(selectors.cutContent);

            // Act
            await codeCut.locator(selectors.cutButton).click();

            // Assert - Code block should be rendered
            await expect(content).toBeVisible();
            await expect(content.locator('pre code')).toBeVisible();
            await expect(content.locator('pre code')).toContainText('function hello()');
        });

        test('should render complex nested content correctly', async ({page}) => {
            // Arrange
            const nestedCut = page.locator(`#${CUT_IDS.NESTED}`);
            const content = nestedCut.locator(selectors.cutContent);

            // Act
            await nestedCut.locator(selectors.cutButton).click();

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
            const outerCut = page.locator(`#${CUT_IDS.OUTER}`);
            const innerCut = page.locator(`#${CUT_IDS.INNER}`);

            // Act - Expand outer cut
            await outerCut.locator(selectors.cutButton).click();

            // Assert - Outer cut should be expanded, inner should be visible but collapsed
            await expect(outerCut).toHaveAttribute('open');
            await expect(innerCut).toBeVisible();
            await expect(innerCut).not.toHaveAttribute('open');

            // Act - Expand inner cut
            await innerCut.locator(selectors.cutButton).click();

            // Assert - Both cuts should be expanded
            await expect(outerCut).toHaveAttribute('open');
            await expect(innerCut).toHaveAttribute('open');
        });

        test('should maintain nested cut state when parent is collapsed', async ({page}) => {
            // Arrange
            const outerCut = page.locator(`#${CUT_IDS.OUTER}`).first();
            const innerCut = page.locator(`#${CUT_IDS.INNER}`).first();

            // Act - Expand both cuts
            await outerCut.locator(selectors.cutButton).click();
            await innerCut.locator(selectors.cutButton).click();

            // Assert - Both should be expanded
            await expect(outerCut).toHaveAttribute('open');
            await expect(innerCut).toHaveAttribute('open');

            // Act - Collapse outer cut
            await outerCut.locator(selectors.cutButton).click();

            // Assert - Outer should be collapsed, inner should be hidden
            await expect(outerCut).not.toHaveAttribute('open');
            await expect(innerCut).not.toBeVisible();
        });
    });

    test.describe('Formatted titles', () => {
        test('should render bold formatted title correctly', async ({page}) => {
            // Arrange
            const boldCut = page.locator(`#${CUT_IDS.BOLD}`);
            const title = boldCut.locator(selectors.cutTitle);

            // Assert - Bold formatting should be rendered
            await expect(title.locator('strong')).toBeVisible();
            await expect(title.locator('strong')).toHaveText('Жирный заголовок');
        });

        test('should render italic formatted title correctly', async ({page}) => {
            // Arrange
            const italicCut = page.locator(`#${CUT_IDS.ITALIC}`);
            const title = italicCut.locator(selectors.cutTitle);

            // Assert - Italic formatting should be rendered
            await expect(title.locator('em')).toBeVisible();
            await expect(title.locator('em')).toHaveText('Курсивный заголовок');
        });

        test('should render code formatted title correctly', async ({page}) => {
            // Arrange
            const codeCut = page.locator(`#${CUT_IDS.CODE_TITLE}`);
            const title = codeCut.locator(selectors.cutTitle);

            // Assert - Code formatting should be rendered
            await expect(title.locator('code')).toBeVisible();
            await expect(title.locator('code')).toHaveText('Код в заголовке');
        });
    });

    test.describe('Empty titles', () => {
        test('should render cut with empty title', async ({page}) => {
            // Arrange
            const emptyCut = page.locator(`#${CUT_IDS.EMPTY}`);
            const title = emptyCut.locator(selectors.cutTitle);
            const content = emptyCut.locator(selectors.cutContent);

            // Assert - Should render with empty title
            await expect(title).toBeVisible();
            await expect(title).toHaveText('');
            await expect(content).not.toBeVisible();

            // Act - Expand
            await emptyCut.locator(selectors.cutButton).click();

            // Assert - Content should be visible
            await expect(content).toBeVisible();
            await expect(content).toContainText('Контент без заголовка');
        });
    });

    test.describe('Cuts in lists', () => {
        test('should render cuts inside list items correctly', async ({page}) => {
            // Arrange
            const firstListCut = page.locator(`#${CUT_IDS.LIST_1}`);
            const title = firstListCut.locator(selectors.cutTitle);
            const content = firstListCut.locator(selectors.cutContent);

            // Assert - Title should be visible, content hidden
            await expect(title).toBeVisible();
            await expect(title).toHaveText(CUT_TITLES.LIST_1);
            await expect(content).not.toBeVisible();

            // Act - Expand
            await firstListCut.locator(selectors.cutButton).click();

            // Assert - Content should be visible
            await expect(content).toBeVisible();
            await expect(content).toContainText('Контент первого ката в списке');
        });

        test('should maintain independent state for cuts in different list items', async ({
            page,
        }) => {
            // Arrange
            const firstListCut = page.locator(`#${CUT_IDS.LIST_1}`);
            const secondListCut = page.locator(`#${CUT_IDS.LIST_2}`);

            // Act - Expand first list cut
            await firstListCut.locator(selectors.cutButton).click();

            // Assert - Only first should be expanded
            await expect(firstListCut).toHaveAttribute('open');
            await expect(secondListCut).not.toHaveAttribute('open');

            // Act - Expand second list cut
            await secondListCut.locator(selectors.cutButton).click();

            // Assert - Both should be expanded
            await expect(firstListCut).toHaveAttribute('open');
            await expect(secondListCut).toHaveAttribute('open');
        });
    });

    test.describe('URL hash functionality', () => {
        test.beforeEach(async ({page}) => {
            await page.goto(`./`);
        });

        test('should expand cut when URL contains hash', async ({page}) => {
            // Arrange - Navigate with hash for basic cut
            await page.goto(`./ru/syntax/cut#${CUT_IDS.BASIC}`);

            // Get the cut by ID
            const basicCut = page.locator(`#${CUT_IDS.BASIC}`);

            // Assert - Cut should be expanded and highlighted
            await expect(basicCut).toHaveAttribute('open');

            // Assert - Cut should be visible in viewport
            await expect(basicCut).toBeInViewport();
        });

        test('should scroll to cut when opened via hash', async ({page}) => {
            // Arrange - Navigate with hash for last cut
            await page.goto(`./ru/syntax/cut#${CUT_IDS.HEIGHT_TALL}`);

            // Get the cut by ID
            const tallCut = page.locator(`#${CUT_IDS.HEIGHT_TALL}`);

            // Assert - Cut should be expanded
            await expect(tallCut).toHaveAttribute('open');

            // Assert - Cut should be visible in viewport (scrolled to)
            await expect(tallCut).toBeInViewport();
        });

        test('should expand nested cut when URL contains inner cut hash', async ({page}) => {
            // Arrange - Navigate with hash for inner cut
            await page.goto(`./ru/syntax/cut#${CUT_IDS.INNER}`);

            // Get the cuts by ID
            const outerCut = page.locator(`#${CUT_IDS.OUTER}`);
            const innerCut = page.locator(`#${CUT_IDS.INNER}`);

            // Assert - Both outer and inner cuts should be expanded
            await expect(outerCut).toHaveAttribute('open');
            await expect(innerCut).toHaveAttribute('open');

            // Assert - Inner cut should be visible in viewport (target element)
            await expect(innerCut).toBeInViewport();
        });

        test('should show highlight effect when opened via hash', async ({page}) => {
            // Arrange - Navigate with hash
            await page.goto(`./ru/syntax/cut#${CUT_IDS.BASIC}`);

            // Get the cut by ID
            const basicCut = page.locator(`#${CUT_IDS.BASIC}`);

            // Assert - Should have highlight class
            await expect(basicCut).toHaveClass(/cut-highlight/);

            // Assert - Cut should be visible in viewport
            await expect(basicCut).toBeInViewport();

            // Wait for highlight to disappear
            await page.waitForTimeout(1000);

            // Assert - Highlight should be removed
            await expect(basicCut).not.toHaveClass(/cut-highlight/);
        });

        test('should keep BASIC cut in viewport when opened via hash', async ({page}) => {
            await page.goto(`./ru/syntax/cut#${CUT_IDS.BASIC}`);

            const targetCut = page.locator(`#${CUT_IDS.BASIC}`);

            await expect(targetCut).toHaveAttribute('open');
            await expect(targetCut).toBeInViewport();
        });

        test('should keep INNER cut in viewport when opened via hash', async ({page}) => {
            await page.goto(`./ru/syntax/cut#${CUT_IDS.INNER}`);

            const targetCut = page.locator(`#${CUT_IDS.INNER}`);

            await expect(targetCut).toHaveAttribute('open');
            await expect(targetCut).toBeInViewport();
        });

        test('should keep CODE cut in viewport when opened via hash', async ({page}) => {
            await page.goto(`./ru/syntax/cut#${CUT_IDS.CODE}`);

            const targetCut = page.locator(`#${CUT_IDS.CODE}`);

            await expect(targetCut).toHaveAttribute('open');
            await expect(targetCut).toBeInViewport();
        });
    });

    test.describe('Accessibility', () => {
        test('should have proper ARIA attributes and keyboard navigation', async ({page}) => {
            // Arrange
            const basicCut = page.locator(`#${CUT_IDS.BASIC}`);
            const button = basicCut.locator(selectors.cutButton);
            const content = basicCut.locator(selectors.cutContent);

            // Assert - Initial state
            await expect(basicCut).not.toHaveAttribute('open');

            // Act - Expand via click
            await button.click();

            // Assert - Expanded state
            await expect(basicCut).toHaveAttribute('open');

            // Act - Collapse via keyboard
            await button.focus();
            await page.keyboard.press('Enter');

            // Assert - Collapsed state
            await expect(content).not.toBeVisible();
            await expect(basicCut).not.toHaveAttribute('open');
        });
    });

    test.describe('Visual behavior', () => {
        test('should have smooth expand/collapse animation', async ({page}) => {
            // Arrange
            const basicCut = page.locator(`#${CUT_IDS.BASIC}`);
            const content = basicCut.locator(selectors.cutContent);
            const button = basicCut.locator(selectors.cutButton);

            // Act - Expand
            await button.click();

            // Assert - Content should be visible with transition
            await expect(content).toBeVisible();

            // Check for transition CSS property
            const transition = await content.evaluate(
                (el) => window.getComputedStyle(el).transition,
            );
            expect(transition).not.toBe('none');
        });

        test('should maintain proper spacing and layout when expanded', async ({page}) => {
            // Arrange
            const basicCut = page.locator(`#${CUT_IDS.BASIC}`);
            const htmlCut = page.locator(`#${CUT_IDS.HTML}`);

            // Get initial positions
            const basicCutInitialBox = await basicCut.boundingBox();
            const htmlCutInitialBox = await htmlCut.boundingBox();

            // Act - Expand basic cut
            await basicCut.locator(selectors.cutButton).click();

            // Wait for animation
            await page.waitForTimeout(300);

            // Get positions after expansion
            const basicCutExpandedBox = await basicCut.boundingBox();
            const htmlCutExpandedBox = await htmlCut.boundingBox();

            // Assert - Basic cut should be taller, html cut should move down
            expect(basicCutExpandedBox?.height).toBeGreaterThan(basicCutInitialBox?.height || 0);
            expect(htmlCutExpandedBox?.y).toBeGreaterThan(htmlCutInitialBox?.y || 0);
        });
    });
});
