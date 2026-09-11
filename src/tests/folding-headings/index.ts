import {readFileSync} from 'fs';
import {resolve} from 'path';
import {expect, test} from '@playwright/test';

const cssContent = readFileSync(
    resolve(__dirname, '../../../_assets/folding-headings-extension.css'),
    'utf8',
);
const jsContent = readFileSync(
    resolve(__dirname, '../../../_assets/folding-headings-extension.js'),
    'utf8',
);

const HEADING_SECTION = '.heading-section';
const HEADING_SECTION_CONTENT = '.heading-section-content';
const DATA_KEY = 'heading-section';

const CONTENT = {
    PAGE_TITLE: 'Folding Headings Test',
    FIRST_FOLDING_HEADING: 'Folding Heading One',
    NESTED_H1: 'Top Level Folding',
    NESTED_H2: 'Nested Folding Heading',
    PLAIN_CHILD: 'Folding With Plain Child',
    PLAIN_CHILD_SUB: 'Plain Child Heading',
    PLAIN_TOP: 'Plain Top Heading',
    FOLDING_AFTER_PLAIN: 'Folding After Plain',
    H1_FOLDING: 'H1 Folding',
    H2_FOLDING: 'H2 Folding',
    H3_FOLDING: 'H3 Folding',
    H4_FOLDING: 'H4 Folding',
    H5_FOLDING: 'H5 Folding',
    H6_FOLDING: 'H6 Folding',
    RICH_CONTENT: 'Rich Content Folding',
    FIRST_SIBLING: 'First Sibling Folding',
    SECOND_SIBLING: 'Second Sibling Folding',
    TOC_NAME: 'Folding Test',
} as const;

test.describe('Folding Headings', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/folding-test');
    });

    test.describe('Page structure', () => {
        test('should display Folding Headings Test heading on page', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.PAGE_TITLE);
        });

        test('should set browser tab title to Folding Headings Test', async ({page}) => {
            const title = await page.title();

            expect(title).toContain(CONTENT.PAGE_TITLE);
        });
    });

    test.describe('Section structure', () => {
        test('should render heading-section elements on page', async ({page}) => {
            const sections = page.locator(HEADING_SECTION);

            const count = await sections.count();
            expect(count).toBeGreaterThan(0);
        });

        test('should set data-diplodoc-key attribute on all sections', async ({page}) => {
            const sections = page.locator(HEADING_SECTION);
            const count = await sections.count();

            for (let i = 0; i < count; i++) {
                const section = sections.nth(i);
                await expect(section).toHaveAttribute('data-diplodoc-key', DATA_KEY);
            }
        });

        test('should set data-diplodoc-id attribute on all sections', async ({page}) => {
            const sections = page.locator(HEADING_SECTION);
            const count = await sections.count();

            for (let i = 0; i < count; i++) {
                const section = sections.nth(i);
                const id = await section.getAttribute('data-diplodoc-id');
                expect(id).toBeTruthy();
                expect(id).toContain(DATA_KEY);
            }
        });

        test('should have heading-section-content div inside each section', async ({page}) => {
            const sections = page.locator(HEADING_SECTION);
            const count = await sections.count();

            for (let i = 0; i < count; i++) {
                const content = sections.nth(i).locator(`> ${HEADING_SECTION_CONTENT}`);
                await expect(content).toHaveCount(1);
            }
        });

        test('should have heading element as direct child of each section', async ({page}) => {
            const sections = page.locator(HEADING_SECTION);
            const count = await sections.count();

            for (let i = 0; i < count; i++) {
                const heading = sections.nth(i).locator('> h1, > h2, > h3, > h4, > h5, > h6');
                await expect(heading).toHaveCount(1);
            }
        });
    });

    test.describe('Basic folding heading', () => {
        test('should wrap folding heading in section', async ({page}) => {
            const section = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.FIRST_FOLDING_HEADING});

            await expect(section).toHaveCount(1);
            await expect(section).toHaveClass(/heading-section/);
        });

        test('should contain heading text inside section', async ({page}) => {
            const heading = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.FIRST_FOLDING_HEADING})
                .locator('> h1');

            await expect(heading).toHaveCount(1);
            await expect(heading).toContainText(CONTENT.FIRST_FOLDING_HEADING);
        });

        test('should contain content paragraph inside heading-section-content', async ({page}) => {
            const content = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.FIRST_FOLDING_HEADING})
                .locator(`> ${HEADING_SECTION_CONTENT}`);

            await expect(content).toHaveCount(1);
            await expect(content.locator('> p').first()).toContainText(
                'Content under the folding heading',
            );
        });
    });

    test.describe('Plain headings', () => {
        test('should not wrap plain headings in sections', async ({page}) => {
            const plainHeading = page.locator('h2#plain-heading-between-foldings');

            await expect(plainHeading).toHaveCount(1);

            const parentSection = plainHeading.locator(
                'xpath=ancestor::section[@class="heading-section"]',
            );
            await expect(parentSection).toHaveCount(1);

            const directParent = plainHeading.locator(
                'xpath=./parent::section[@class="heading-section"]',
            );
            await expect(directParent).toHaveCount(0);
        });

        test('should render plain h1 without section wrapper', async ({page}) => {
            const plainH1 = page.locator('h1').filter({hasText: CONTENT.PLAIN_TOP});

            await expect(plainH1).toHaveCount(1);

            const directParent = plainH1.locator(
                'xpath=./parent::section[@class="heading-section"]',
            );
            await expect(directParent).toHaveCount(0);
        });

        test('should render non-folding headings normally', async ({page}) => {
            const section = page.locator('h2#non-folding-headings-render-normally');
            await expect(section).toHaveCount(1);

            const directParent = section.locator(
                'xpath=./parent::section[@class="heading-section"]',
            );
            await expect(directParent).toHaveCount(0);

            const regularH1 = page.locator('h1').filter({hasText: 'Regular H1'});
            await expect(regularH1).toHaveCount(1);
            const regularH1Parent = regularH1.locator(
                'xpath=./parent::section[@class="heading-section"]',
            );
            await expect(regularH1Parent).toHaveCount(0);

            const regularH2 = page.locator('h2').filter({hasText: 'Regular H2'});
            await expect(regularH2).toHaveCount(1);
            const regularH2Parent = regularH2.locator(
                'xpath=./parent::section[@class="heading-section"]',
            );
            await expect(regularH2Parent).toHaveCount(0);

            const regularH3 = page.locator('h3').filter({hasText: 'Regular H3'});
            await expect(regularH3).toHaveCount(1);
            const regularH3Parent = regularH3.locator(
                'xpath=./parent::section[@class="heading-section"]',
            );
            await expect(regularH3Parent).toHaveCount(0);
        });
    });

    test.describe('All heading levels', () => {
        test('should create section for H1 folding heading', async ({page}) => {
            const section = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.H1_FOLDING})
                .first();

            await expect(section).toHaveCount(1);
            const heading = section.locator('> h1');
            await expect(heading).toHaveCount(1);
            await expect(heading).toContainText(CONTENT.H1_FOLDING);
        });

        test('should create section for H2 folding heading inside H1 section', async ({page}) => {
            const h1Section = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.H1_FOLDING})
                .first();
            const h2Section = h1Section
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.H2_FOLDING});

            await expect(h2Section).toHaveCount(1);
            const heading = h2Section.locator('> h2');
            await expect(heading).toHaveCount(1);
        });

        test('should create section for H3 folding heading inside H2 section', async ({page}) => {
            const h2Section = page
                .locator(`#h2-folding`)
                .locator(`xpath=./ancestor::section[@class="heading-section"][1]`);
            const h3Section = h2Section
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.H3_FOLDING});

            await expect(h3Section).toHaveCount(1);
            const heading = h3Section.locator('> h3');
            await expect(heading).toHaveCount(1);
        });

        test('should create section for H4 folding heading', async ({page}) => {
            const heading = page.locator('#h4-folding');
            await expect(heading).toHaveCount(1);
            const section = heading.locator('xpath=./parent::section[@class="heading-section"]');
            await expect(section).toHaveCount(1);
        });

        test('should create section for H5 folding heading', async ({page}) => {
            const heading = page.locator('#h5-folding');
            await expect(heading).toHaveCount(1);
            const section = heading.locator('xpath=./parent::section[@class="heading-section"]');
            await expect(section).toHaveCount(1);
        });

        test('should create section for H6 folding heading', async ({page}) => {
            const heading = page.locator('#h6-folding');
            await expect(heading).toHaveCount(1);
            const section = heading.locator('xpath=./parent::section[@class="heading-section"]');
            await expect(section).toHaveCount(1);
        });
    });

    test.describe('Nested folding sections', () => {
        test('should nest inner section inside outer section content', async ({page}) => {
            const outer = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.NESTED_H1})
                .first();

            await expect(outer).toHaveCount(1);

            const innerContent = outer.locator(`> ${HEADING_SECTION_CONTENT}`);
            const innerSection = innerContent
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.NESTED_H2});

            await expect(innerSection).toHaveCount(1);
        });

        test('should have correct heading levels for nested sections', async ({page}) => {
            const outer = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.NESTED_H1})
                .first();

            const outerHeading = outer.locator('> h1');
            await expect(outerHeading).toHaveCount(1);

            const inner = outer.locator(HEADING_SECTION).filter({hasText: CONTENT.NESTED_H2});
            const innerHeading = inner.locator('> h2');
            await expect(innerHeading).toHaveCount(1);
        });
    });

    test.describe('Section closing', () => {
        test('should close first sibling section before opening second', async ({page}) => {
            const firstSection = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.FIRST_SIBLING})
                .first();

            await expect(firstSection).toHaveCount(1);

            const secondSection = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.SECOND_SIBLING})
                .first();

            await expect(secondSection).toHaveCount(1);

            const firstHeading = firstSection.locator('> h1');
            await expect(firstHeading).toContainText(CONTENT.FIRST_SIBLING);

            const secondHeading = secondSection.locator('> h1');
            await expect(secondHeading).toContainText(CONTENT.SECOND_SIBLING);
        });

        test('should not nest second sibling inside first', async ({page}) => {
            const firstSection = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.FIRST_SIBLING})
                .first();

            const secondSection = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.SECOND_SIBLING})
                .first();

            const secondInsideFirst = firstSection
                .locator(`> ${HEADING_SECTION_CONTENT} ${HEADING_SECTION}`)
                .filter({hasText: CONTENT.SECOND_SIBLING});

            await expect(secondInsideFirst).toHaveCount(0);
            await expect(secondSection).toHaveCount(1);
        });
    });

    test.describe('Folding with plain child', () => {
        test('should include plain subheading inside folding section content', async ({page}) => {
            const section = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.PLAIN_CHILD})
                .first();

            await expect(section).toHaveCount(1);

            const plainSubheading = section.locator('h3#plain-child-heading');
            await expect(plainSubheading).toHaveCount(1);
            await expect(plainSubheading).toContainText(CONTENT.PLAIN_CHILD_SUB);

            const plainParent = plainSubheading.locator(
                'xpath=./parent::section[@class="heading-section"]',
            );
            await expect(plainParent).toHaveCount(0);
        });
    });

    test.describe('Folding after plain', () => {
        test('should create section for folding heading after plain heading', async ({page}) => {
            const heading = page.locator('#folding-after-plain');
            await expect(heading).toHaveCount(1);

            const section = heading.locator('xpath=./parent::section[@class="heading-section"]');
            await expect(section).toHaveCount(1);
        });

        test('should not wrap plain heading before folding in section', async ({page}) => {
            const plainH1 = page.locator('h1').filter({hasText: CONTENT.PLAIN_TOP});
            await expect(plainH1).toHaveCount(1);

            const parentSection = plainH1.locator(
                'xpath=./parent::section[@class="heading-section"]',
            );
            await expect(parentSection).toHaveCount(0);
        });
    });

    test.describe('Rich content inside folding sections', () => {
        test('should render list inside folding section', async ({page}) => {
            const section = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.RICH_CONTENT})
                .first();

            const content = section.locator(`> ${HEADING_SECTION_CONTENT}`);
            const list = content.locator('ul');
            await expect(list).toHaveCount(1);
            const items = list.locator('li');
            await expect(items).toHaveCount(2);
        });

        test('should render table inside folding section', async ({page}) => {
            const section = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.RICH_CONTENT})
                .first();

            const content = section.locator(`> ${HEADING_SECTION_CONTENT}`);
            const table = content.locator('table');
            await expect(table).toHaveCount(1);
        });

        test('should render code block inside folding section', async ({page}) => {
            const section = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.RICH_CONTENT})
                .first();

            const content = section.locator(`> ${HEADING_SECTION_CONTENT}`);
            const code = content.locator('pre code');
            await expect(code).toHaveCount(1);
        });

        test('should render blockquote inside folding section', async ({page}) => {
            const section = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.RICH_CONTENT})
                .first();

            const content = section.locator(`> ${HEADING_SECTION_CONTENT}`);
            const blockquote = content.locator('blockquote');
            await expect(blockquote).toHaveCount(1);
        });
    });

    test.describe('Toggle behavior', () => {
        test.beforeEach(async ({page}) => {
            await page.addStyleTag({content: cssContent});
            await page.addScriptTag({content: jsContent});
        });

        test('should hide content by default', async ({page}) => {
            const section = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.FIRST_FOLDING_HEADING})
                .first();

            const content = section.locator(`> ${HEADING_SECTION_CONTENT}`);
            await expect(content).not.toBeVisible();
        });

        test('should show content after clicking heading', async ({page}) => {
            const section = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.FIRST_FOLDING_HEADING})
                .first();

            const heading = section.locator('> h1');
            const content = section.locator(`> ${HEADING_SECTION_CONTENT}`);

            await heading.click();
            await expect(section).toHaveClass(/open/);
            await expect(content).toBeVisible();
        });

        test('should hide content after clicking heading twice', async ({page}) => {
            const section = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.FIRST_FOLDING_HEADING})
                .first();

            const heading = section.locator('> h1');
            const content = section.locator(`> ${HEADING_SECTION_CONTENT}`);

            await heading.click();
            await expect(section).toHaveClass(/open/);
            await expect(content).toBeVisible();

            await heading.click();
            await expect(section).not.toHaveClass(/open/);
            await expect(content).not.toBeVisible();
        });

        test('should toggle nested sections independently', async ({page}) => {
            const outer = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.NESTED_H1})
                .first();

            const inner = outer
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.NESTED_H2})
                .first();

            const outerHeading = outer.locator('> h1');
            const innerHeading = inner.locator('> h2');

            const outerContent = outer.locator(`> ${HEADING_SECTION_CONTENT}`);
            const innerContent = inner.locator(`> ${HEADING_SECTION_CONTENT}`);

            await outerHeading.click();
            await expect(outer).toHaveClass(/open/);
            await expect(outerContent).toBeVisible();

            await innerHeading.click();
            await expect(inner).toHaveClass(/open/);
            await expect(innerContent).toBeVisible();

            await innerHeading.click();
            await expect(inner).not.toHaveClass(/open/);
            await expect(innerContent).not.toBeVisible();

            await expect(outer).toHaveClass(/open/);
        });

        test('should toggle rich content section', async ({page}) => {
            const section = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.RICH_CONTENT})
                .first();

            const heading = section.locator('> h1');
            const content = section.locator(`> ${HEADING_SECTION_CONTENT}`);

            await heading.click();
            await expect(section).toHaveClass(/open/);
            await expect(content).toBeVisible();

            const list = content.locator('ul');
            await expect(list).toBeVisible();
        });

        test('should toggle all H1-H6 sections', async ({page}) => {
            const h1Section = page
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.H1_FOLDING})
                .first();
            const h1Heading = h1Section.locator('> h1');
            const h1Content = h1Section.locator(`> ${HEADING_SECTION_CONTENT}`);

            await h1Heading.click();
            await expect(h1Section).toHaveClass(/open/);
            await expect(h1Content).toBeVisible();

            const h2Section = h1Section
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.H2_FOLDING})
                .first();
            const h2Heading = h2Section.locator('> h2');
            const h2Content = h2Section.locator(`> ${HEADING_SECTION_CONTENT}`);

            await h2Heading.click();
            await expect(h2Section).toHaveClass(/open/);
            await expect(h2Content).toBeVisible();

            const h3Section = h2Section
                .locator(HEADING_SECTION)
                .filter({hasText: CONTENT.H3_FOLDING})
                .first();
            const h3Heading = h3Section.locator('> h3');
            const h3Content = h3Section.locator(`> ${HEADING_SECTION_CONTENT}`);

            await h3Heading.click();
            await expect(h3Section).toHaveClass(/open/);
            await expect(h3Content).toBeVisible();
        });
    });

    test.describe('All sections summary', () => {
        test('should render at least 10 heading sections', async ({page}) => {
            const sections = page.locator(HEADING_SECTION);
            const count = await sections.count();

            expect(count).toBeGreaterThanOrEqual(10);
        });

        test('should have unique data-diplodoc-id for each section', async ({page}) => {
            const sections = page.locator(HEADING_SECTION);
            const count = await sections.count();
            const ids = new Set<string>();

            for (let i = 0; i < count; i++) {
                const id = await sections.nth(i).getAttribute('data-diplodoc-id');
                expect(id).toBeTruthy();
                ids.add(id || '');
            }

            expect(ids.size).toBe(count);
        });

        test('should not have heading-section-content outside a heading-section', async ({
            page,
        }) => {
            const allContent = page.locator(HEADING_SECTION_CONTENT);
            const total = await allContent.count();

            const insideSection = page.locator(`${HEADING_SECTION} > ${HEADING_SECTION_CONTENT}`);
            const inside = await insideSection.count();

            expect(total).toBe(inside);
        });
    });

    test.describe('TOC navigation', () => {
        test('should show Folding Test link in sidebar', async ({page}) => {
            const tocLink = page.locator('.dc-toc a').filter({hasText: CONTENT.TOC_NAME});

            await expect(tocLink).toHaveCount(1);
        });

        test('should navigate to Folding Test page', async ({page}) => {
            const tocLink = page.locator('.dc-toc a').filter({hasText: CONTENT.TOC_NAME});

            const href = await tocLink.getAttribute('href');
            expect(href).toContain('folding-test');
        });
    });
});
