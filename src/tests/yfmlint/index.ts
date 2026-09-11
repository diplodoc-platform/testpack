import {expect, test} from '@playwright/test';

const selectors = {
    term: 'i.yfm-term_title',
    inlineCode: 'code',
    autotitleLink: 'a[href*="#terms"]',
    note: '.yfm-note.yfm-accent-info',
    noteContent: '.yfm-note-content',
    noteTitle: '.yfm-note-title',
    anchor: 'hr#lint-anchor',
    ruleTable: '#rule-coverage ~ table',
    ruleTableHeader: 'thead th',
    ruleTableBody: 'tbody td',
    stageBadge: '.dc-mark',
    tagsContainer: '.dc-tags',
    tagItem: '.dc-tags__tag',
    miniToc: '.dc-mini-toc',
    miniTocLink: '.dc-mini-toc__section-link',
} as const;

const CONTENT = {
    PAGE_TITLE: 'YFM Lint',
    STAGE_BADGE: 'NEW',
    TAGS: ['linting', 'validation', 'syntax'],
    TERM_TEXT_1: 'terms',
    TERM_TEXT_2: 'term',
    INLINE_CODE_1: 'npm install',
    INLINE_CODE_2: 'yfmlint --check',
    AUTOTITLE_TEXT: 'Terms',
    NOTE_TEXT: 'valid YFM directive syntax',
    ANCHOR_ID: 'lint-anchor',
    CONDITIONAL_TEXT: 'environment is test',
    FOR_LOOP_ITEMS: ['Alpha: First', 'Beta: Second', 'Gamma: Third'],
    NON_BMP_TEXT: 'Basic Multilingual Plane',
    RULE_TABLE_HEADERS: ['Rule', 'Alias', 'Description'],
    RULE_IDS: [
        'YFM001',
        'YFM002',
        'YFM003',
        'YFM004',
        'YFM005',
        'YFM006',
        'YFM007',
        'YFM008',
        'YFM009',
        'YFM010',
        'YFM011',
        'YFM018',
        'YFM020',
        'YFM021',
    ],
    RULE_ALIASES: [
        'inline-code-length',
        'no-header-found-for-link',
        'unreachable-link',
        'table-not-closed',
        'tab-list-not-closed',
        'term-definition-duplicated',
        'term-used-without-definition',
        'term-inside-definition-not-allowed',
        'no-term-definition-in-content',
        'unreachable-autotitle-anchor',
        'max-svg-size',
        'term-definition-from-include',
        'invalid-yfm-directive',
        'no-non-bmp-characters',
    ],
} as const;

test.describe('YFM Lint', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/yfmlint');
    });

    test.describe('Page title', () => {
        test('should display YFM Lint heading on page', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.PAGE_TITLE);
        });

        test('should set browser tab title from frontmatter', async ({page}) => {
            const title = await page.title();

            expect(title).toContain(CONTENT.PAGE_TITLE);
        });
    });

    test.describe('Frontmatter stage', () => {
        test('should render stage badge with uppercased text', async ({page}) => {
            const badge = page.locator(selectors.stageBadge).first();

            await expect(badge).toBeVisible();
            await expect(badge).toContainText(CONTENT.STAGE_BADGE);
            const text = await badge.textContent();
            expect(text?.trim()).toBe(text?.trim().toUpperCase());
        });

        test('should render stage badge as mark element', async ({page}) => {
            const badge = page.locator(selectors.stageBadge).first();

            await expect(badge).toHaveClass(/dc-mark/);
        });
    });

    test.describe('Frontmatter tags', () => {
        test('should render tags container', async ({page}) => {
            const tags = page.locator(selectors.tagsContainer).first();

            await expect(tags).toBeVisible();
        });

        test('should render all three tags', async ({page}) => {
            const tagItems = page.locator(selectors.tagItem);

            await expect(tagItems).toHaveCount(CONTENT.TAGS.length);
            for (const tag of CONTENT.TAGS) {
                await expect(page.locator(selectors.tagsContainer)).toContainText(tag);
            }
        });
    });

    test.describe('Terms (YFM006-YFM009)', () => {
        test('should render term elements with correct attributes', async ({page}) => {
            const terms = page.locator(selectors.term);

            await expect(terms).toHaveCount(2);

            await expect(terms.nth(0)).toHaveAttribute('role', 'button');
            await expect(terms.nth(0)).toHaveAttribute('tabindex', '0');
            await expect(terms.nth(0)).toHaveAttribute('term-key');
            await expect(terms.nth(0)).toHaveAttribute('aria-controls');
            await expect(terms.nth(0)).toHaveAttribute('id');

            await expect(terms.nth(1)).toHaveAttribute('role', 'button');
            await expect(terms.nth(1)).toHaveAttribute('tabindex', '0');
            await expect(terms.nth(1)).toHaveAttribute('term-key');
        });

        test('should render first term with correct text', async ({page}) => {
            const term = page.locator(selectors.term).first();

            await expect(term).toContainText(CONTENT.TERM_TEXT_1);
        });

        test('should render second term with correct text', async ({page}) => {
            const term = page.locator(selectors.term).nth(1);

            await expect(term).toContainText(CONTENT.TERM_TEXT_2);
        });

        test('should show tooltip on term click', async ({page}) => {
            const term = page.locator(selectors.term).first();
            const termId = await term.getAttribute('aria-controls');
            const tooltip = page.locator(`dfn[id="${termId}"]`);

            await expect(tooltip).not.toBeVisible();

            await term.click();
            await expect(tooltip).toBeVisible();
            await expect(tooltip).toHaveClass(/yfm-term_dfn/);
            await expect(tooltip).toHaveClass(/open/);
        });

        test('should close tooltip on Escape key', async ({page}) => {
            const term = page.locator(selectors.term).first();
            const termId = await term.getAttribute('aria-controls');
            const tooltip = page.locator(`dfn[id="${termId}"]`);

            await term.click();
            await expect(tooltip).toBeVisible();

            await page.keyboard.press('Escape');
            await expect(tooltip).not.toBeVisible();
        });
    });

    test.describe('Inline code (YFM001)', () => {
        test('should render short inline code within length limit', async ({page}) => {
            const paragraph = page.locator('#inline-code + p');

            await expect(paragraph.locator(selectors.inlineCode).first()).toContainText(
                CONTENT.INLINE_CODE_1,
            );
            await expect(paragraph.locator(selectors.inlineCode).nth(1)).toContainText(
                CONTENT.INLINE_CODE_2,
            );
        });

        test('should render inline code as code elements', async ({page}) => {
            const paragraph = page.locator('#inline-code + p');

            const codeElements = paragraph.locator(selectors.inlineCode);
            await expect(codeElements).toHaveCount(2);
        });
    });

    test.describe('Autotitle links (YFM002/YFM010)', () => {
        test('should render link to Terms section', async ({page}) => {
            const link = page.locator(selectors.autotitleLink).first();

            await expect(link).toBeVisible();
            await expect(link).toContainText(CONTENT.AUTOTITLE_TEXT);
            await expect(link).toHaveAttribute('href', /#terms$/);
        });
    });

    test.describe('Note directive (YFM020)', () => {
        test('should render note with info accent class', async ({page}) => {
            const note = page.locator(selectors.note).first();

            await expect(note).toBeVisible();
            await expect(note).toHaveAttribute('note-type', 'info');
        });

        test('should render note content inside yfm-note-content', async ({page}) => {
            const note = page.locator(selectors.note).first();
            const content = note.locator(selectors.noteContent);

            await expect(content).toContainText(CONTENT.NOTE_TEXT);
        });

        test('should render note title', async ({page}) => {
            const note = page.locator(selectors.note).first();
            const title = note.locator(selectors.noteTitle);

            await expect(title).toBeVisible();
            await expect(title).not.toBeEmpty();
        });
    });

    test.describe('Anchor directive (YFM020)', () => {
        test('should render hidden hr with anchor id', async ({page}) => {
            const anchor = page.locator(selectors.anchor);

            await expect(anchor).toHaveAttribute('id', CONTENT.ANCHOR_ID);
            await expect(anchor).toHaveClass(/visually-hidden/);
        });
    });

    test.describe('Conditional directives (YFM020)', () => {
        test('should render content when condition is true', async ({page}) => {
            const body = page.locator('body');

            await expect(body).toContainText(CONTENT.CONDITIONAL_TEXT);
        });

        test('should not leave liquid condition tags in output', async ({page}) => {
            const body = page.locator('body');

            await expect(body).not.toContainText('{% if');
            await expect(body).not.toContainText('{% endif');
        });
    });

    test.describe('For loop directives (YFM020)', () => {
        test('should render list items from preset array', async ({page}) => {
            const body = page.locator('body');

            for (const item of CONTENT.FOR_LOOP_ITEMS) {
                await expect(body).toContainText(item);
            }
        });

        test('should not leave for-loop liquid tags in output', async ({page}) => {
            const body = page.locator('body');

            await expect(body).not.toContainText('{% for');
            await expect(body).not.toContainText('{% endfor');
        });
    });

    test.describe('Non-BMP compliance (YFM021)', () => {
        test('should render content with only BMP characters', async ({page}) => {
            const section = page.locator('#non-bmp-compliance + p');

            await expect(section).toContainText(CONTENT.NON_BMP_TEXT);
        });
    });

    test.describe('Rule coverage table', () => {
        test('should render table with headers', async ({page}) => {
            const table = page.locator(selectors.ruleTable);

            await expect(table).toBeVisible();

            const headers = table.locator(selectors.ruleTableHeader);
            await expect(headers).toHaveCount(3);
            await expect(headers.nth(0)).toContainText(CONTENT.RULE_TABLE_HEADERS[0]);
            await expect(headers.nth(1)).toContainText(CONTENT.RULE_TABLE_HEADERS[1]);
            await expect(headers.nth(2)).toContainText(CONTENT.RULE_TABLE_HEADERS[2]);
        });

        test('should list all 14 YFM rules', async ({page}) => {
            const table = page.locator(selectors.ruleTable);
            const bodyCells = table.locator(selectors.ruleTableBody);

            await expect(bodyCells).toHaveCount(CONTENT.RULE_IDS.length * 3);

            for (const ruleId of CONTENT.RULE_IDS) {
                await expect(table).toContainText(ruleId);
            }
        });

        test('should list all rule aliases', async ({page}) => {
            const table = page.locator(selectors.ruleTable);

            for (const alias of CONTENT.RULE_ALIASES) {
                await expect(table).toContainText(alias);
            }
        });
    });

    test.describe('TOC navigation', () => {
        test('should render sidebar navigation with YFM Lint link', async ({page}) => {
            const navLink = page
                .locator('.yfm-sidebar a, .docs-sidebar a, nav a')
                .filter({hasText: 'YFM Lint'});

            await expect(navLink).toBeVisible();
        });

        test('should mark current page as active in TOC', async ({page}) => {
            const activeItem = page.locator('.dc-toc__list-item_active');

            await expect(activeItem).toBeVisible();
            await expect(activeItem).toContainText('YFM Lint');
        });
    });

    test.describe('Mini TOC', () => {
        test('should render mini TOC container', async ({page}) => {
            const miniToc = page.locator(selectors.miniToc).first();

            await expect(miniToc).toBeVisible();
        });

        test('should list page sections in mini TOC', async ({page}) => {
            const links = page.locator(selectors.miniTocLink);

            const count = await links.count();
            expect(count).toBeGreaterThanOrEqual(8);
        });
    });
});
