import {expect, test} from '@playwright/test';

const selectors = {
    tocLink: '.dc-toc a',
    codeBlock: 'pre code',
    body: '.dc-doc-page__body',
} as const;

const CONTENT = {
    PAGE_TITLE: '@diplodoc/sentenizer',
    DESCRIPTION: 'Rule-based NLP library for Russian sentence segmentation',
    STAGE: 'NEW',
    TAGS: ['sentenizer', 'nlp', 'segmentation', 'russian', 'parser'],
    PACKAGE: '@diplodoc/sentenizer',
    VERSION: '0.0.11',
    LICENSE: 'MIT',
    DEPENDENCY: 'ramda',
    OVERVIEW_HEADING: 'Overview',
    API_HEADING: 'API',
    ALGORITHM_HEADING: 'Algorithm',
    RULE_CONDITIONS_HEADING: 'Rule Conditions',
    BREAK_CONDITIONS_HEADING: 'Break conditions',
    JOIN_CONDITIONS_HEADING: 'Join conditions',
    CONSTANTS_HEADING: 'Constants',
    MARKERS_HEADING: 'Markers',
    PARAMETERS_HEADING: 'Parameters',
    PROJECT_STRUCTURE_HEADING: 'Project Structure',
    DEBUGGING_HEADING: 'Debugging',
    SENTENIZE_IMPORT: '@diplodoc/sentenizer',
    SENTENIZE_FN: 'sentenize',
    BREAK_CONDITION_1: 'leftEndsWithHardbreak',
    BREAK_CONDITION_2: 'rightStartsWithHardbreak',
    BREAK_CONDITION_3: 'rightStartsNewlineUppercased',
    JOIN_CONDITION_1: 'spaceBothSides',
    JOIN_CONDITION_2: 'leftInitials',
    JOIN_CONDITION_3: 'leftAbbreviation',
    JOIN_CONDITION_4: 'pairAbbreviation',
    SENTENCE_END_MARKERS: 'SENTENCE_END_MARKERS',
    QUOTATION_GENERIC_MARKERS: 'QUOTATION_GENERIC_MARKERS',
    QUOTATION_CLOSE_MARKERS: 'QUOTATION_CLOSE_MARKERS',
    BRACKETS_CLOSE_MARKERS: 'BRACKETS_CLOSE_MARKERS',
    WINDOW_WIDTH: 'WINDOW_WIDTH',
    INITIALS_ABBR: 'INITIALS',
    HEAD_ABBR: 'HEAD',
    TAIL_ABBR: 'TAIL',
    OTHER_ABBR: 'OTHER',
    HEAD_PAIR_ABBR: 'HEAD_PAIR',
    TAIL_PAIR_ABBR: 'TAIL_PAIR',
    OTHER_PAIR_ABBR: 'OTHER_PAIR',
    SRC_INDEX: 'src/index.ts',
    SRC_RULES_BASE: 'src/rules/base.ts',
    SRC_RULES_ABBR: 'src/rules/abbreviations.ts',
    SRC_CONSTANTS_MARKERS: 'src/constants/markers.ts',
    SRC_CONSTANTS_ABBR: 'src/constants/abbreviations.ts',
    SRC_CONSTANTS_PARAMS: 'src/constants/parameters.ts',
    DEBUG_ENV: 'DEBUG=1',
} as const;

test.describe('Sentenizer', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/sentenizer');
    });

    test.describe('Page title', () => {
        test('should display package name as h1 heading', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.PACKAGE);
        });

        test('should set browser tab title to package name', async ({page}) => {
            const title = await page.title();

            expect(title).toContain('Sentenizer');
        });
    });

    test.describe('Frontmatter description', () => {
        test('should render meta description tag', async ({page}) => {
            const meta = page.locator('meta[name="description"]');

            await expect(meta).toHaveAttribute('content', CONTENT.DESCRIPTION);
        });
    });

    test.describe('Frontmatter stage', () => {
        test('should render visible stage badge', async ({page}) => {
            const badge = page.locator('.dc-mark').first();

            await expect(badge).toBeVisible();
        });

        test('should uppercase the stage text', async ({page}) => {
            const badge = page.locator('.dc-mark').first();

            const text = (await badge.textContent()) ?? '';
            expect(text.trim().toUpperCase()).toBe(CONTENT.STAGE);
        });
    });

    test.describe('Frontmatter tags', () => {
        test('should render tags container', async ({page}) => {
            const tags = page.locator('.dc-tags').first();

            await expect(tags).toBeVisible();
        });

        test('should render all tags', async ({page}) => {
            for (const tag of CONTENT.TAGS) {
                const tagEl = page
                    .locator('.dc-tags__list .dc-tags__tag')
                    .filter({hasText: new RegExp(`^${tag}$`)});

                await expect(tagEl).toHaveCount(1);
            }
        });
    });

    test.describe('Preset variables', () => {
        test('should substitute package name from presets', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.PACKAGE);
        });

        test('should substitute version from presets', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.VERSION);
        });

        test('should substitute description from presets', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.DESCRIPTION);
        });

        test('should not leave unresolved liquid markers', async ({page}) => {
            const body = page.locator(selectors.body);

            const text = (await body.textContent()) ?? '';
            expect(text).not.toContain('{{');
            expect(text).not.toContain('}}');
        });
    });

    test.describe('Overview', () => {
        test('should render Overview section heading', async ({page}) => {
            const heading = page.locator('h2#overview');

            await expect(heading).toBeVisible();
        });

        test('should mention rule-based segmentation', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('rule-based');
        });

        test('should mention Russian language focus', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('Russian');
        });
    });

    test.describe('Package Information', () => {
        test('should render Package Information section heading', async ({page}) => {
            const heading = page.locator('h2#package-information');

            await expect(heading).toBeVisible();
        });

        test('should list the runtime dependency ramda', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.DEPENDENCY);
        });

        test('should list the MIT license', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.LICENSE);
        });

        test('should render keywords from presets for-loop', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('nlp');
            await expect(body).toContainText('tokenization');
            await expect(body).toContainText('sentence-segmentation');
        });

        test('should not leak liquid for-loop tags', async ({page}) => {
            const body = page.locator(selectors.body);

            const text = (await body.textContent()) ?? '';
            expect(text).not.toContain('{% for');
            expect(text).not.toContain('{% endfor');
        });
    });

    test.describe('API', () => {
        test('should render API section heading', async ({page}) => {
            const heading = page.locator('h2#api');

            await expect(heading).toBeVisible();
        });

        test('should render a TypeScript code block importing sentenize', async ({page}) => {
            const code = page
                .locator(selectors.codeBlock)
                .filter({hasText: CONTENT.SENTENIZE_IMPORT})
                .filter({hasText: CONTENT.SENTENIZE_FN})
                .first();

            await expect(code).toBeVisible();
        });

        test('should document the sentenize function signature', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('string -> string[]');
        });

        test('should render a basic usage code block', async ({page}) => {
            const code = page
                .locator(selectors.codeBlock)
                .filter({hasText: 'Последовательно обходим кандидатов'})
                .first();

            await expect(code).toBeVisible();
        });
    });

    test.describe('Algorithm', () => {
        test('should render Algorithm section heading', async ({page}) => {
            const heading = page.locator('h2#algorithm');

            await expect(heading).toBeVisible();
        });

        test('should list the 5-stage pipeline as an ordered list', async ({page}) => {
            const ol = page.locator('#algorithm ~ ol').first();

            await expect(ol).toBeVisible();
            const steps = ol.locator('li');

            await expect(steps).toHaveCount(5);
        });

        test('should mention paragraph splitting stage', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('Paragraph splitting');
        });

        test('should mention rule evaluation stage', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('Rule evaluation');
        });

        test('should render a code block with the join/break logic', async ({page}) => {
            const code = page
                .locator(selectors.codeBlock)
                .filter({hasText: 'breaks([left, right])'})
                .filter({hasText: 'join([left, right])'})
                .first();

            await expect(code).toBeVisible();
        });

        test('should document the rule evaluation order', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText('Break conditions');
            await expect(body).toContainText('Join conditions');
        });
    });

    test.describe('Rule Conditions', () => {
        test('should render Rule Conditions section heading', async ({page}) => {
            const heading = page.locator('h2#rule-conditions');

            await expect(heading).toBeVisible();
        });

        test('should render Break conditions subsection heading', async ({page}) => {
            const heading = page.locator('h3#break-conditions');

            await expect(heading).toBeVisible();
        });

        test('should list all 3 break conditions in a table', async ({page}) => {
            const table = page.locator('#break-conditions ~ table').first();

            await expect(table).toBeVisible();
            await expect(table).toContainText(CONTENT.BREAK_CONDITION_1);
            await expect(table).toContainText(CONTENT.BREAK_CONDITION_2);
            await expect(table).toContainText(CONTENT.BREAK_CONDITION_3);
        });

        test('should render Join conditions subsection heading', async ({page}) => {
            const heading = page.locator('h3#join-conditions');

            await expect(heading).toBeVisible();
        });

        test('should list join conditions from presets for-loop', async ({page}) => {
            const body = page.locator(selectors.body);

            await expect(body).toContainText(CONTENT.JOIN_CONDITION_1);
            await expect(body).toContainText(CONTENT.JOIN_CONDITION_2);
            await expect(body).toContainText(CONTENT.JOIN_CONDITION_3);
            await expect(body).toContainText(CONTENT.JOIN_CONDITION_4);
        });

        test('should not leak liquid for-loop tags in join conditions', async ({page}) => {
            const body = page.locator(selectors.body);

            const text = (await body.textContent()) ?? '';
            expect(text).not.toContain('{% for');
            expect(text).not.toContain('{% endfor');
        });
    });

    test.describe('Constants', () => {
        test('should render Constants section heading', async ({page}) => {
            const heading = page.locator('h2#constants');

            await expect(heading).toBeVisible();
        });

        test('should render Markers subsection heading', async ({page}) => {
            const heading = page.locator('h3#markers');

            await expect(heading).toBeVisible();
        });

        test('should list all 4 marker sets in a table', async ({page}) => {
            const table = page.locator('#markers ~ table').first();

            await expect(table).toBeVisible();
            await expect(table).toContainText(CONTENT.SENTENCE_END_MARKERS);
            await expect(table).toContainText(CONTENT.QUOTATION_GENERIC_MARKERS);
            await expect(table).toContainText(CONTENT.QUOTATION_CLOSE_MARKERS);
            await expect(table).toContainText(CONTENT.BRACKETS_CLOSE_MARKERS);
        });

        test('should render Parameters subsection heading', async ({page}) => {
            const heading = page.locator('h3#parameters');

            await expect(heading).toBeVisible();
        });

        test('should document the WINDOW_WIDTH parameter', async ({page}) => {
            const table = page.locator('#parameters ~ table').first();

            await expect(table).toBeVisible();
            await expect(table).toContainText(CONTENT.WINDOW_WIDTH);
            await expect(table).toContainText('10');
        });
    });

    test.describe('Abbreviations cut block', () => {
        test('should render a cut block for abbreviations', async ({page}) => {
            const cut = page.locator('details').filter({hasText: 'Abbreviations'});

            await expect(cut).toBeVisible();
        });

        test('should list all 7 abbreviation categories in a table', async ({page}) => {
            const cut = page.locator('details').filter({hasText: 'Abbreviations'});

            await expect(cut).toContainText(CONTENT.INITIALS_ABBR);
            await expect(cut).toContainText(CONTENT.HEAD_ABBR);
            await expect(cut).toContainText(CONTENT.TAIL_ABBR);
            await expect(cut).toContainText(CONTENT.OTHER_ABBR);
            await expect(cut).toContainText(CONTENT.HEAD_PAIR_ABBR);
            await expect(cut).toContainText(CONTENT.TAIL_PAIR_ABBR);
            await expect(cut).toContainText(CONTENT.OTHER_PAIR_ABBR);
        });
    });

    test.describe('Note directive', () => {
        test('should render a note block with Primary use case title', async ({page}) => {
            const note = page.locator('.yfm-note').filter({hasText: 'Primary use case'});

            await expect(note).toBeVisible();
        });

        test('should mention translation package in the note', async ({page}) => {
            const note = page.locator('.yfm-note').filter({hasText: 'Primary use case'});

            await expect(note).toContainText('@diplodoc/translation');
        });
    });

    test.describe('Project Structure', () => {
        test('should render Project Structure section heading', async ({page}) => {
            const heading = page.locator('h2#project-structure');

            await expect(heading).toBeVisible();
        });

        test('should list key source paths in a table', async ({page}) => {
            const table = page.locator('#project-structure ~ table').first();

            await expect(table).toBeVisible();
            await expect(table).toContainText(CONTENT.SRC_INDEX);
            await expect(table).toContainText(CONTENT.SRC_RULES_BASE);
            await expect(table).toContainText(CONTENT.SRC_RULES_ABBR);
            await expect(table).toContainText(CONTENT.SRC_CONSTANTS_MARKERS);
            await expect(table).toContainText(CONTENT.SRC_CONSTANTS_ABBR);
            await expect(table).toContainText(CONTENT.SRC_CONSTANTS_PARAMS);
        });
    });

    test.describe('Debugging', () => {
        test('should render Debugging section heading', async ({page}) => {
            const heading = page.locator('h2#debugging');

            await expect(heading).toBeVisible();
        });

        test('should render a bash code block with DEBUG env var', async ({page}) => {
            const code = page
                .locator(selectors.codeBlock)
                .filter({hasText: CONTENT.DEBUG_ENV})
                .first();

            await expect(code).toBeVisible();
        });
    });

    test.describe('TOC navigation', () => {
        test('should render sidebar navigation with Sentenizer link', async ({page}) => {
            const navLink = page.locator(selectors.tocLink).filter({hasText: 'Sentenizer'});

            await expect(navLink).toBeVisible();
        });

        test('should have an href pointing to the sentenizer page', async ({page}) => {
            const navLink = page.locator(selectors.tocLink).filter({hasText: 'Sentenizer'});

            const href = await navLink.first().getAttribute('href');
            expect(href).toBeTruthy();
            expect(href).toContain('sentenizer');
        });

        test('should mark Sentenizer as the active TOC item', async ({page}) => {
            const activeItem = page.locator('.dc-toc__list-item_active');

            await expect(activeItem).toContainText('Sentenizer');
        });
    });

    test.describe('Mini TOC', () => {
        test('should render a mini TOC element', async ({page}) => {
            const miniToc = page.locator('.dc-mini-toc').first();

            await expect(miniToc).toBeVisible();
        });

        test('should list multiple sections in the mini TOC', async ({page}) => {
            const sections = page.locator('.dc-mini-toc__section');

            const count = await sections.count();
            expect(count).toBeGreaterThan(0);
        });
    });
});
