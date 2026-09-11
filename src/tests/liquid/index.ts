import {expect, test} from '@playwright/test';

const CONTENT = {
    PAGE_TITLE: 'Liquid',
    USER_NAME: 'alice',
    USER_CITY: 'Moscow',
    CAPITALIZED: 'Alice',
    GREETING_LENGTH: '11',
    EDITOR_ROLE: 'Editor role.',
    ACTIVE_ADULT: 'Active adult user.',
    VIP_TAG: 'VIP tag found.',
    RANGE_ITEMS: ['Range item 1', 'Range item 2', 'Range item 3'],
    GROUP_NAMES: ['Alpha', 'Beta'],
    GROUP_ALPHA_MEMBERS: ['Alice', 'Ivan'],
    GROUP_BETA_MEMBERS: ['Petr', 'Olga'],
    NOT_VAR_LITERAL: '{{ liquid_user.name }}',
    SLICE_RESULT: 'Masha',
    EDITOR_CONFIRMED: 'Editor confirmed.',
    NAME_NOT_BOB: 'Name is not bob.',
    UNDER_THIRTY: 'Under thirty.',
    TWENTY_FIVE_OR_UNDER: 'Twenty five or under.',
    OVER_TWENTY: 'Over twenty.',
    PRIVILEGED_USER: 'Privileged user.',
} as const;

test.describe('Liquid', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/liquid');
    });

    test.describe('Page title', () => {
        test('should display Liquid heading on page', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.PAGE_TITLE);
        });
    });

    test.describe('Variable substitution', () => {
        test('should substitute simple variable from presets', async ({page}) => {
            const paragraph = page.locator('#variables + p');

            await expect(paragraph).toContainText(CONTENT.USER_NAME);
        });

        test('should substitute nested object property via dot notation', async ({page}) => {
            const paragraph = page.locator('#variables + p');

            await expect(paragraph).toContainText(CONTENT.USER_CITY);
        });

        test('should not leave unresolved variable markers in output', async ({page}) => {
            const paragraph = page.locator('#variables + p');

            await expect(paragraph).not.toContainText('{{ liquid_user');
            await expect(paragraph).not.toContainText('}}');
        });
    });

    test.describe('Filters', () => {
        test('should apply capitalize filter to variable', async ({page}) => {
            const paragraph = page.locator('#filters + p');

            await expect(paragraph).toContainText(CONTENT.CAPITALIZED);
        });

        test('should apply length filter to string variable', async ({page}) => {
            const paragraph = page.locator('#filters + p');

            await expect(paragraph).toContainText(CONTENT.GREETING_LENGTH);
        });

        test('should not leave filter syntax in output', async ({page}) => {
            const paragraph = page.locator('#filters + p');

            await expect(paragraph).not.toContainText('| capitalize');
            await expect(paragraph).not.toContainText('| length');
        });
    });

    test.describe('Conditional branches', () => {
        test('should render elsif branch when condition matches', async ({page}) => {
            const paragraph = page.locator('#conditions + p');

            await expect(paragraph).toContainText(CONTENT.EDITOR_ROLE);
        });

        test('should render and-operator conditional content', async ({page}) => {
            const body = page.locator('body');

            await expect(body).toContainText(CONTENT.ACTIVE_ADULT);
        });

        test('should render contains-operator conditional content', async ({page}) => {
            const body = page.locator('body');

            await expect(body).toContainText(CONTENT.VIP_TAG);
        });

        test('should not render admin branch', async ({page}) => {
            const body = page.locator('body');

            await expect(body).not.toContainText('Administrator role.');
        });

        test('should not render else branch', async ({page}) => {
            const body = page.locator('body');

            await expect(body).not.toContainText('Regular role.');
        });

        test('should not leave liquid condition tags in output', async ({page}) => {
            const body = page.locator('body');

            await expect(body).not.toContainText('{% if');
            await expect(body).not.toContainText('{% elsif');
            await expect(body).not.toContainText('{% else');
            await expect(body).not.toContainText('{% endif');
        });
    });

    test.describe('Range loops', () => {
        test('should iterate over range (1..3) producing 3 items', async ({page}) => {
            const list = page.locator('#ranges + ul');
            const items = list.locator('li');

            await expect(items).toHaveCount(3);
        });

        test('should render range item values 1 through 3', async ({page}) => {
            const list = page.locator('#ranges + ul');

            for (const text of CONTENT.RANGE_ITEMS) {
                await expect(list).toContainText(text);
            }
        });

        test('should not leave for-loop liquid tags in output', async ({page}) => {
            const body = page.locator('body');

            await expect(body).not.toContainText('{% for');
            await expect(body).not.toContainText('{% endfor');
        });
    });

    test.describe('Nested loops', () => {
        test('should render group headings from outer loop', async ({page}) => {
            for (const name of CONTENT.GROUP_NAMES) {
                const heading = page.locator('h3', {hasText: name});
                await expect(heading).toBeVisible();
            }
        });

        test('should render Alpha group members from inner loop', async ({page}) => {
            const alphaHeading = page.locator('h3', {hasText: 'Alpha'});
            const list = alphaHeading.locator('~ ul').first();
            const items = list.locator('li');

            await expect(items).toHaveCount(CONTENT.GROUP_ALPHA_MEMBERS.length);
            for (const member of CONTENT.GROUP_ALPHA_MEMBERS) {
                await expect(list).toContainText(member);
            }
        });

        test('should render Beta group members from inner loop', async ({page}) => {
            const betaHeading = page.locator('h3', {hasText: 'Beta'});
            const list = betaHeading.locator('~ ul').first();
            const items = list.locator('li');

            await expect(items).toHaveCount(CONTENT.GROUP_BETA_MEMBERS.length);
            for (const member of CONTENT.GROUP_BETA_MEMBERS) {
                await expect(list).toContainText(member);
            }
        });

        test('should not leave nested for-loop liquid tags in output', async ({page}) => {
            const body = page.locator('body');

            await expect(body).not.toContainText('{% for');
            await expect(body).not.toContainText('{% endfor');
        });
    });

    test.describe('not_var escape', () => {
        test('should keep variable literal when prefixed with not_var', async ({page}) => {
            const paragraph = page.locator('#not-var + p');

            await expect(paragraph).toContainText(CONTENT.NOT_VAR_LITERAL);
        });

        test('should not substitute the not_var variable', async ({page}) => {
            const paragraph = page.locator('#not-var + p');

            await expect(paragraph).toContainText(CONTENT.NOT_VAR_LITERAL);
            await expect(paragraph).not.toContainText('Literal: alice');
        });
    });

    test.describe('Method calls', () => {
        test('should apply slice method to variable', async ({page}) => {
            const paragraph = page.locator('#methods + p');

            await expect(paragraph).toContainText(CONTENT.SLICE_RESULT);
        });

        test('should not leave method call syntax in output', async ({page}) => {
            const paragraph = page.locator('#methods + p');

            await expect(paragraph).not.toContainText('.slice(');
        });
    });

    test.describe('Nested conditions', () => {
        test('should render content when nested conditions are true', async ({page}) => {
            const body = page.locator('body');

            await expect(body).toContainText(CONTENT.EDITOR_CONFIRMED);
        });

        test('should not leave nested condition tags in output', async ({page}) => {
            const body = page.locator('body');

            await expect(body).not.toContainText('{% if');
            await expect(body).not.toContainText('{% endif');
        });
    });

    test.describe('Comparison operators', () => {
        test('should render content for != operator when true', async ({page}) => {
            const body = page.locator('body');

            await expect(body).toContainText(CONTENT.NAME_NOT_BOB);
        });

        test('should render content for < operator when true', async ({page}) => {
            const body = page.locator('body');

            await expect(body).toContainText(CONTENT.UNDER_THIRTY);
        });

        test('should render content for <= operator when true', async ({page}) => {
            const body = page.locator('body');

            await expect(body).toContainText(CONTENT.TWENTY_FIVE_OR_UNDER);
        });

        test('should render content for > operator when true', async ({page}) => {
            const body = page.locator('body');

            await expect(body).toContainText(CONTENT.OVER_TWENTY);
        });
    });

    test.describe('or operator', () => {
        test('should render content when either condition is true', async ({page}) => {
            const body = page.locator('body');

            await expect(body).toContainText(CONTENT.PRIVILEGED_USER);
        });

        test('should not leave or-operator condition tags in output', async ({page}) => {
            const body = page.locator('body');

            await expect(body).not.toContainText('{% if');
            await expect(body).not.toContainText('{% endif');
        });
    });

    test.describe('TOC navigation', () => {
        test('should render sidebar navigation with Liquid link', async ({page}) => {
            const navLink = page.locator('.yfm-sidebar a, .docs-sidebar a, nav a').filter({
                hasText: 'Liquid',
            });

            await expect(navLink).toBeVisible();
        });
    });
});
