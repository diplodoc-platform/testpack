import {expect, test} from '@playwright/test';

const selectors = {
    note: '.yfm-note',
    noteInfo: '.yfm-note.yfm-accent-info',
    noteWarning: '.yfm-note.yfm-accent-warning',
    noteTip: '.yfm-note.yfm-accent-tip',
    noteAlert: '.yfm-note.yfm-accent-alert',
    noteTitle: '.yfm-note-title',
    noteContent: '.yfm-note-content',
    codeBlock: 'pre',
    codeHighlight: '.hljs',
    clipboardButton: '.yfm-clipboard-button',
    codeFloatingContainer: '.yfm-code-floating-container',
    table: 'table',
    tableHeader: 'thead th',
    tableBody: 'tbody td',
    heading: 'h2',
    headingAnchor: '.yfm-anchor',
    blockquote: 'blockquote',
    boldText: 'strong',
    italicText: 'em',
    strikethroughText: 's',
    inlineCode: 'code',
} as const;

const CONTENT = {
    NOTE_INFO: 'Information note content with bold text.',
    NOTE_WARNING: 'Warning note content with italic text.',
    NOTE_ALERT: 'Alert note content.',
    TIP_TITLE: 'Custom Tip Title',
    JS_GREETING: "const greeting = 'hello';",
    PLAIN_CODE: 'Plain code block without language.',
    TABLE_HEADER_1: 'Header 1',
    TABLE_HEADER_2: 'Header 2',
    TABLE_HEADER_3: 'Header 3',
    TABLE_CELL_1: 'cell 1',
    TABLE_CELL_6: 'cell 6',
    SUBSECTION_TITLE: 'Subsection with anchor',
    EXTERNAL_HREF: 'https://diplodoc.com/',
    BLOCKQUOTE_TEXT: 'This is a blockquote with some content.',
    BLOCKQUOTE_SECOND: 'Second paragraph of the blockquote.',
    BOLD_TEXT: 'Bold text',
    ITALIC_TEXT: 'italic text',
    STRIKE_TEXT: 'strikethrough text',
    INLINE_CODE: 'inline code',
} as const;

test.describe('Markdown rendering (CLI)', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/markdown');
    });

    test.describe('Notes', () => {
        test('should render all four note types with correct accent classes', async ({page}) => {
            await expect(page.locator(selectors.noteInfo)).toBeVisible();
            await expect(page.locator(selectors.noteWarning)).toBeVisible();
            await expect(page.locator(selectors.noteTip)).toBeVisible();
            await expect(page.locator(selectors.noteAlert)).toBeVisible();
        });

        test('should render note content inside yfm-note-content', async ({page}) => {
            const infoContent = page.locator(selectors.noteInfo).locator(selectors.noteContent);
            await expect(infoContent).toContainText(CONTENT.NOTE_INFO);

            const alertContent = page.locator(selectors.noteAlert).locator(selectors.noteContent);
            await expect(alertContent).toContainText(CONTENT.NOTE_ALERT);
        });

        test('should render note title with auto-generated title when not specified', async ({page}) => {
            const infoTitle = page.locator(selectors.noteInfo).locator(selectors.noteTitle);
            await expect(infoTitle).toBeVisible();
            await expect(infoTitle).not.toBeEmpty();

            const alertTitle = page.locator(selectors.noteAlert).locator(selectors.noteTitle);
            await expect(alertTitle).toBeVisible();
            await expect(alertTitle).not.toBeEmpty();
        });

        test('should render custom title when specified in note tag', async ({page}) => {
            const tipTitle = page.locator(selectors.noteTip).locator(selectors.noteTitle);
            await expect(tipTitle).toBeVisible();
            await expect(tipTitle).toContainText(CONTENT.TIP_TITLE);
        });

        test('should render note with note-type attribute', async ({page}) => {
            await expect(page.locator(selectors.noteInfo)).toHaveAttribute('note-type', 'info');
            await expect(page.locator(selectors.noteWarning)).toHaveAttribute(
                'note-type',
                'warning',
            );
            await expect(page.locator(selectors.noteTip)).toHaveAttribute('note-type', 'tip');
            await expect(page.locator(selectors.noteAlert)).toHaveAttribute('note-type', 'alert');
        });
    });

    test.describe('Code blocks', () => {
        test('should render fenced code blocks with copy button', async ({page}) => {
            const codeBlocks = page.locator(selectors.codeFloatingContainer);
            const count = await codeBlocks.count();
            expect(count).toBeGreaterThanOrEqual(2);

            for (const i of Array.from({length: count}, (_, idx) => idx)) {
                const button = codeBlocks.nth(i).locator(selectors.clipboardButton);
                await expect(button).toBeVisible();
            }
        });

        test('should render JavaScript code with syntax highlighting', async ({page}) => {
            const firstCode = page.locator(selectors.codeFloatingContainer).first();
            const highlight = firstCode.locator(selectors.codeHighlight);
            await expect(highlight).toBeVisible();
            await expect(firstCode.locator(selectors.codeBlock)).toContainText(
                CONTENT.JS_GREETING,
            );
        });

        test('should render plain code block without language', async ({page}) => {
            const codeBlocks = page.locator(selectors.codeFloatingContainer);
            const plainCode = codeBlocks.nth(1);
            await expect(plainCode.locator(selectors.codeBlock)).toContainText(
                CONTENT.PLAIN_CODE,
            );
        });
    });

    test.describe('Tables', () => {
        test('should render table with header and body rows', async ({page}) => {
            const table = page.locator(selectors.table);
            await expect(table).toBeVisible();

            const headers = table.locator(selectors.tableHeader);
            await expect(headers).toHaveCount(3);
            await expect(headers.nth(0)).toContainText(CONTENT.TABLE_HEADER_1);
            await expect(headers.nth(1)).toContainText(CONTENT.TABLE_HEADER_2);
            await expect(headers.nth(2)).toContainText(CONTENT.TABLE_HEADER_3);

            const bodyCells = table.locator(selectors.tableBody);
            await expect(bodyCells).toHaveCount(6);
            await expect(bodyCells.nth(0)).toContainText(CONTENT.TABLE_CELL_1);
            await expect(bodyCells.nth(5)).toContainText(CONTENT.TABLE_CELL_6);
        });
    });

    test.describe('Headings and anchors', () => {
        test('should render heading with id attribute', async ({page}) => {
            const subsection = page.locator('#subsection-anchor');

            await expect(subsection).toBeVisible();
            await expect(subsection).toContainText(CONTENT.SUBSECTION_TITLE);
        });

        test('should render anchor link inside heading', async ({page}) => {
            const headingAnchor = page
                .locator('#subsection-anchor')
                .locator(selectors.headingAnchor);
            await expect(headingAnchor).toBeVisible();
            await expect(headingAnchor).toHaveAttribute('aria-hidden', 'true');
        });

        test('should generate heading id from custom id syntax', async ({page}) => {
            const notesHeading = page.locator('#notes');

            await expect(notesHeading).toBeVisible();
            await expect(notesHeading).toContainText('Notes');
        });
    });

    test.describe('Links', () => {
        test('should render internal anchor link', async ({page}) => {
            const internalLink = page.locator('a[href*="#notes"]').filter({hasText: 'link to notes'});

            await expect(internalLink).toBeVisible();
            await expect(internalLink).toHaveAttribute('href', /#notes$/);
        });

        test('should render external link with correct href', async ({page}) => {
            const externalLink = page.locator(`a[href="${CONTENT.EXTERNAL_HREF}"]`);

            await expect(externalLink).toBeVisible();
            await expect(externalLink).toHaveAttribute('href', CONTENT.EXTERNAL_HREF);
        });
    });

    test.describe('Blockquotes', () => {
        test('should render blockquote with content', async ({page}) => {
            const blockquote = page.locator(selectors.blockquote);
            await expect(blockquote).toBeVisible();
            await expect(blockquote).toContainText(CONTENT.BLOCKQUOTE_TEXT);
            await expect(blockquote).toContainText(CONTENT.BLOCKQUOTE_SECOND);
        });
    });

    test.describe('Inline formatting', () => {
        test('should render bold, italic, strikethrough, and inline code', async ({page}) => {
            const paragraph = page.locator('#inline-formatting + p');

            await expect(paragraph.locator(selectors.boldText)).toContainText(CONTENT.BOLD_TEXT);
            await expect(paragraph.locator(selectors.italicText)).toContainText(
                CONTENT.ITALIC_TEXT,
            );
            await expect(paragraph.locator(selectors.strikethroughText)).toContainText(
                CONTENT.STRIKE_TEXT,
            );
            await expect(paragraph.locator(selectors.inlineCode)).toContainText(
                CONTENT.INLINE_CODE,
            );
        });
    });
});
