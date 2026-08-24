import {expect, test} from '@playwright/test';

const selectors = {
    headingWithClass: 'h3#heading-with-class-custom-heading-class',
    headingWithDataAttr: 'h3#data-heading',
    headingWithMultipleClasses: 'h3#heading-with-multiple-classes-class-one-class-two',
    anchorLink: '.yfm-anchor',
    tableClassId: 'table#custom-table-id',
    tableDataAttrs: 'table[data-utils-table="true"]',
    tableCellAlign: 'table',
    tableCellBg: 'table',
    tableHeaderRows: 'table[data-header-rows="1"]',
    tocLink: '.yfm-sidebar a, .docs-sidebar a, nav a',
} as const;

const CONTENT = {
    PAGE_TITLE: 'Utils features',
    HEADING_WITH_CLASS: 'Heading with class',
    CUSTOM_CLASS: 'custom-heading-class',
    HEADING_WITH_DATA_ATTR: 'Heading with data attribute',
    DATA_ROLE: 'section',
    HEADING_WITH_MULTIPLE_CLASSES: 'Heading with multiple classes',
    CLASS_ONE: 'class-one',
    CLASS_TWO: 'class-two',
    AUTO_IDS_HEADING: 'Auto-generated heading IDs',
    TABLE_CLASS_ID_HEADING: 'Table with class and id',
    TABLE_CLASS: 'utils-table',
    TABLE_ID: 'custom-table-id',
    CELL_A1: 'Cell A1',
    CELL_B1: 'Cell B1',
    CELL_A2: 'Cell A2',
    CELL_B2: 'Cell B2',
    TABLE_DATA_HEADING: 'Table with data attributes',
    DATA_CELL_1: 'Data cell 1',
    DATA_CELL_2: 'Data cell 2',
    TABLE_ALIGN_HEADING: 'Table with cell align',
    CENTERED_CELL: 'Centered cell',
    TOP_RIGHT_CELL: 'Top-right cell',
    TOP_LEFT_CELL: 'Top-left cell',
    NORMAL_CELL: 'Normal cell',
    TABLE_BG_HEADING: 'Table with cell background',
    RED_CELL: 'Red background',
    BLUE_CELL: 'Blue background',
    TABLE_HEADER_HEADING: 'Table with header rows',
    HEADER_NAME: 'Name',
    HEADER_VALUE: 'Value',
    ROW_ALICE: 'Alice',
    ROW_ALICE_VAL: '30',
    ROW_BOB: 'Bob',
    ROW_BOB_VAL: '25',
    HEADING_ANCHORS: 'Heading anchors',
    ANCHOR_LINKS: 'Anchor link verification',
} as const;

test.describe('Utils features', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/utils');
    });

    test.describe('Page title', () => {
        test('should display Utils features heading on page', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.PAGE_TITLE);
        });
    });

    test.describe('Heading with class', () => {
        test('should apply custom class from {.class} syntax', async ({page}) => {
            const heading = page.locator(selectors.headingWithClass);

            await expect(heading).toBeVisible();
            await expect(heading).toContainText(CONTENT.HEADING_WITH_CLASS);
            await expect(heading).toHaveClass(new RegExp(CONTENT.CUSTOM_CLASS));
        });

        test('should render anchor link inside heading', async ({page}) => {
            const anchor = page.locator(selectors.headingWithClass).locator(selectors.anchorLink);

            await expect(anchor).toBeVisible();
            await expect(anchor).toHaveAttribute('aria-hidden', 'true');
        });
    });

    test.describe('Heading with data attribute', () => {
        test('should apply explicit id and data attribute', async ({page}) => {
            const heading = page.locator(selectors.headingWithDataAttr);

            await expect(heading).toBeVisible();
            await expect(heading).toContainText(CONTENT.HEADING_WITH_DATA_ATTR);
            await expect(heading).toHaveAttribute('id', 'data-heading');
            await expect(heading).toHaveAttribute('data-role', 'section');
        });
    });

    test.describe('Heading with multiple classes', () => {
        test('should apply both classes from {.class-one .class-two}', async ({page}) => {
            const heading = page.locator(selectors.headingWithMultipleClasses);

            await expect(heading).toBeVisible();
            await expect(heading).toContainText(CONTENT.HEADING_WITH_MULTIPLE_CLASSES);
            await expect(heading).toHaveClass(new RegExp(CONTENT.CLASS_ONE));
            await expect(heading).toHaveClass(new RegExp(CONTENT.CLASS_TWO));
        });
    });

    test.describe('Auto-generated heading IDs', () => {
        test('should generate slugified id for heading without explicit id', async ({page}) => {
            const heading = page.locator('#auto-ids');

            await expect(heading).toBeVisible();
            await expect(heading).toContainText(CONTENT.AUTO_IDS_HEADING);
        });
    });

    test.describe('YFM table with class and id', () => {
        test('should render table with custom class', async ({page}) => {
            const table = page.locator(selectors.tableClassId);

            await expect(table).toBeVisible();
            await expect(table).toHaveClass(new RegExp(CONTENT.TABLE_CLASS));
        });

        test('should render table with custom id', async ({page}) => {
            const table = page.locator(selectors.tableClassId);

            await expect(table).toHaveAttribute('id', CONTENT.TABLE_ID);
        });

        test('should render all table cells with correct content', async ({page}) => {
            const table = page.locator(selectors.tableClassId);
            const cells = table.locator('td p');

            await expect(cells).toHaveCount(4);
            await expect(cells.nth(0)).toContainText(CONTENT.CELL_A1);
            await expect(cells.nth(1)).toContainText(CONTENT.CELL_B1);
            await expect(cells.nth(2)).toContainText(CONTENT.CELL_A2);
            await expect(cells.nth(3)).toContainText(CONTENT.CELL_B2);
        });
    });

    test.describe('YFM table with data attributes', () => {
        test('should render table with data-utils-table attribute', async ({page}) => {
            const table = page.locator(selectors.tableDataAttrs);

            await expect(table).toBeVisible();
            await expect(table).toHaveAttribute('data-utils-table', 'true');
        });

        test('should render table with data-cols attribute', async ({page}) => {
            const table = page.locator(selectors.tableDataAttrs);

            await expect(table).toHaveAttribute('data-cols', '2');
        });

        test('should render data cell content', async ({page}) => {
            const table = page.locator(selectors.tableDataAttrs);
            const cells = table.locator('td p');

            await expect(cells).toHaveCount(2);
            await expect(cells.nth(0)).toContainText(CONTENT.DATA_CELL_1);
            await expect(cells.nth(1)).toContainText(CONTENT.DATA_CELL_2);
        });
    });

    test.describe('YFM table with cell alignment', () => {
        test('should render centered cell with data-align attribute', async ({page}) => {
            const table = page.locator('#table-cell-align + table');
            const centeredCell = table.locator('td[data-align="center"]');

            await expect(centeredCell).toHaveAttribute('data-align', 'center');
            await expect(centeredCell).toHaveClass(/cell-align-center/);
            await expect(centeredCell.locator('p')).toContainText(CONTENT.CENTERED_CELL);
        });

        test('should render top-right cell with data-align attribute', async ({page}) => {
            const table = page.locator('#table-cell-align + table');
            const topRightCell = table.locator('td[data-align="top-right"]');

            await expect(topRightCell).toHaveAttribute('data-align', 'top-right');
            await expect(topRightCell).toHaveClass(/cell-align-top-right/);
            await expect(topRightCell.locator('p')).toContainText(CONTENT.TOP_RIGHT_CELL);
        });

        test('should render top-left cell with data-align attribute', async ({page}) => {
            const table = page.locator('#table-cell-align + table');
            const topLeftCell = table.locator('td[data-align="top-left"]');

            await expect(topLeftCell).toHaveAttribute('data-align', 'top-left');
            await expect(topLeftCell).toHaveClass(/cell-align-top-left/);
            await expect(topLeftCell.locator('p')).toContainText(CONTENT.TOP_LEFT_CELL);
        });

        test('should render normal cell without align attribute', async ({page}) => {
            const table = page.locator('#table-cell-align + table');
            const normalCell = table.locator('td').last();

            await expect(normalCell.locator('p')).toContainText(CONTENT.NORMAL_CELL);
            await expect(normalCell).not.toHaveAttribute('data-align');
        });
    });

    test.describe('YFM table with cell background', () => {
        test('should render red background cell with data-bg attribute', async ({page}) => {
            const table = page.locator('#table-cell-bg + table');
            const redCell = table.locator('td[data-bg="red"]');

            await expect(redCell).toHaveAttribute('data-bg', 'red');
            await expect(redCell).toHaveClass(/cell-bg-red/);
            await expect(redCell.locator('p')).toContainText(CONTENT.RED_CELL);
        });

        test('should render blue background cell with data-bg attribute', async ({page}) => {
            const table = page.locator('#table-cell-bg + table');
            const blueCell = table.locator('td[data-bg="blue"]');

            await expect(blueCell).toHaveAttribute('data-bg', 'blue');
            await expect(blueCell).toHaveClass(/cell-bg-blue/);
            await expect(blueCell.locator('p')).toContainText(CONTENT.BLUE_CELL);
        });
    });

    test.describe('YFM table with header rows', () => {
        test('should render table with data-header-rows attribute', async ({page}) => {
            const table = page.locator(selectors.tableHeaderRows);

            await expect(table).toBeVisible();
            await expect(table).toHaveAttribute('data-header-rows', '1');
        });

        test('should render header row with th elements', async ({page}) => {
            const table = page.locator(selectors.tableHeaderRows);
            const headerRow = table.locator('tr[data-header="true"]');
            const headers = headerRow.locator('th');

            await expect(headerRow).toBeVisible();
            await expect(headers).toHaveCount(2);
            await expect(headers.nth(0).locator('p')).toContainText(CONTENT.HEADER_NAME);
            await expect(headers.nth(1).locator('p')).toContainText(CONTENT.HEADER_VALUE);
        });

        test('should render th elements with scope="col"', async ({page}) => {
            const table = page.locator(selectors.tableHeaderRows);
            const headers = table.locator('th');

            await expect(headers.nth(0)).toHaveAttribute('scope', 'col');
            await expect(headers.nth(1)).toHaveAttribute('scope', 'col');
        });

        test('should render data rows with td elements', async ({page}) => {
            const table = page.locator(selectors.tableHeaderRows);
            const dataRows = table.locator('tr:not([data-header])');

            await expect(dataRows).toHaveCount(2);
            await expect(dataRows.nth(0).locator('td p').nth(0)).toContainText(CONTENT.ROW_ALICE);
            await expect(dataRows.nth(0).locator('td p').nth(1)).toContainText(CONTENT.ROW_ALICE_VAL);
            await expect(dataRows.nth(1).locator('td p').nth(0)).toContainText(CONTENT.ROW_BOB);
            await expect(dataRows.nth(1).locator('td p').nth(1)).toContainText(CONTENT.ROW_BOB_VAL);
        });
    });

    test.describe('Heading anchors', () => {
        test('should render anchor link for each heading', async ({page}) => {
            const anchors = page.locator('h2 .yfm-anchor, h3 .yfm-anchor');

            const count = await anchors.count();
            expect(count).toBeGreaterThan(0);
        });

        test('should render anchor with aria-hidden', async ({page}) => {
            const anchor = page.locator('#heading-anchors .yfm-anchor');

            await expect(anchor).toBeVisible();
            await expect(anchor).toHaveAttribute('aria-hidden', 'true');
        });

        test('should render anchor href pointing to heading id', async ({page}) => {
            const anchor = page.locator('#anchor-links .yfm-anchor');

            await expect(anchor).toHaveAttribute('href', /#anchor-links/);
        });

        test('should render visually-hidden span inside anchor', async ({page}) => {
            const anchor = page.locator('#heading-anchors .yfm-anchor');
            const hiddenSpan = anchor.locator('.visually-hidden');

            await expect(hiddenSpan).toHaveAttribute('data-no-index', 'true');
        });
    });

    test.describe('TOC navigation', () => {
        test('should render sidebar navigation with Utils link', async ({page}) => {
            const navLink = page
                .locator(selectors.tocLink)
                .filter({hasText: 'Utils'});

            await expect(navLink).toBeVisible();
        });

        test('should navigate to Utils page via sidebar link', async ({page}) => {
            const navLink = page
                .locator(selectors.tocLink)
                .filter({hasText: 'Utils'});

            const href = await navLink.first().getAttribute('href');
            expect(href).toBeTruthy();
            expect(href).toContain('utils');
        });
    });
});
