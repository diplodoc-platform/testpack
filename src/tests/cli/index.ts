import {expect, test} from '@playwright/test';

const CONTENT = {
    PROJECT_NAME: 'Diplodoc',
    ENVIRONMENT: 'test',
    VERSION: '5.55',
    TEST_ENV_TEXT: 'Running in',
    LOOP_ITEM_ALPHA: 'Alpha: First',
    LOOP_ITEM_BETA: 'Beta: Second',
    LOOP_ITEM_GAMMA: 'Gamma: Third',
    INCLUDED_TEXT: 'This content comes from an included file.',
    INCLUDED_SECTION_TEXT: 'This is a section inside the included fragment.',
} as const;

test.describe('CLI features', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/cli-features');
    });

    test.describe('Variable substitution', () => {
        test('should substitute variables from presets.yaml', async ({page}) => {
            const paragraph = page.locator('#variables + p');

            await expect(paragraph).toContainText(CONTENT.PROJECT_NAME);
            await expect(paragraph).toContainText(CONTENT.ENVIRONMENT);
            await expect(paragraph).toContainText(CONTENT.VERSION);
        });

        test('should not leave unresolved variable markers in output', async ({page}) => {
            const paragraph = page.locator('#variables + p');

            await expect(paragraph).not.toContainText('{{');
            await expect(paragraph).not.toContainText('}}');
        });
    });

    test.describe('Conditional content', () => {
        test('should render content when condition is true', async ({page}) => {
            const paragraph = page.locator('#conditions + p');

            await expect(paragraph).toContainText(CONTENT.TEST_ENV_TEXT);
            await expect(paragraph.locator('strong')).toContainText('test');
        });

        test('should not render content when condition is false', async ({page}) => {
            const body = page.locator('body');

            await expect(body).not.toContainText('This should not appear');
        });

        test('should not leave liquid condition tags in output', async ({page}) => {
            const body = page.locator('body');

            await expect(body).not.toContainText('{%');
            await expect(body).not.toContainText('%}');
        });
    });

    test.describe('For loops', () => {
        test('should iterate over array items', async ({page}) => {
            const list = page.locator('#loops + ul');
            const items = list.locator('li');

            await expect(items).toHaveCount(3);
        });

        test('should render each item with substituted properties', async ({page}) => {
            const list = page.locator('#loops + ul');

            await expect(list).toContainText(CONTENT.LOOP_ITEM_ALPHA);
            await expect(list).toContainText(CONTENT.LOOP_ITEM_BETA);
            await expect(list).toContainText(CONTENT.LOOP_ITEM_GAMMA);
        });

        test('should not leave for-loop liquid tags in output', async ({page}) => {
            const body = page.locator('body');

            await expect(body).not.toContainText('{% for');
            await expect(body).not.toContainText('{% endfor');
        });
    });

    test.describe('Includes', () => {
        test('should render included file content inline', async ({page}) => {
            const paragraph = page.locator('#includes ~ h1 + p');

            await expect(paragraph).toContainText(CONTENT.INCLUDED_TEXT);
        });

        test('should render included file heading', async ({page}) => {
            const heading = page.locator('#includes ~ h1');

            await expect(heading).toBeVisible();
            await expect(heading).toContainText('Included Fragment');
        });

        test('should render included file section heading', async ({page}) => {
            const sectionHeading = page.locator('h2#section');

            await expect(sectionHeading).toBeVisible();
            await expect(sectionHeading).toContainText('Section');
        });

        test('should not leave include directive markers in output', async ({page}) => {
            const body = page.locator('body');

            await expect(body).not.toContainText('{% include');
        });
    });

    test.describe('Include with anchor', () => {
        test('should render only the anchored section content', async ({page}) => {
            const paragraph = page.locator('#section1 + p');

            await expect(paragraph).toContainText(CONTENT.INCLUDED_SECTION_TEXT);
        });

        test('should not render non-anchored content from the included file', async ({page}) => {
            const anchorParagraph = page.locator('#section1 + p');

            await expect(anchorParagraph).not.toContainText(CONTENT.INCLUDED_TEXT);
        });

        test('should not leave include directive markers in output', async ({page}) => {
            const body = page.locator('body');

            await expect(body).not.toContainText('{% include');
        });
    });

    test.describe('TOC navigation', () => {
        test('should render sidebar navigation with CLI Features link', async ({page}) => {
            const navLink = page.locator('.yfm-sidebar a, .docs-sidebar a, nav a').filter({
                hasText: 'CLI Features',
            });

            await expect(navLink).toBeVisible();
        });

        test('should display CLI Features heading on page', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText('CLI Features');
        });
    });
});
