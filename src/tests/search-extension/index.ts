import {expect, test} from '@playwright/test';

const CONTENT = {
    PAGE_TITLE: 'Search Extension',
    PAGE_DESCRIPTION:
        'Documentation for @diplodoc/search-extension — Lunr-based offline search for Diplodoc',
    STAGE_LABEL: 'PREVIEW',
    TAGS: ['search', 'lunr', 'offline', 'indexing', 'worker', 'search-extension'],
    SEARCH_PACKAGE: '@diplodoc/search-extension',
    SEARCH_VERSION: '3.1.1',
    SEARCH_DESCRIPTION: 'Lunr based offline search extension for Diplodoc platform',
    TOLERANCE_LEVELS: ['word', 'word*', '*word*'],
    CONFIDENCE_MODES: ['phrased', 'sparsed'],
    FIELD_BOOSTS: ['title', 'keywords', 'content'],
    DEPENDENCIES: ['he', 'lunr', 'lunr-languages', 'node-html-parser'],
    EXPORTS: ['.', './indexer', './worker', './worker/langs'],
    H2_OVERVIEW: 'Overview',
    H2_CONFIGURATION: 'Configuration',
    H2_INDEXING: 'Indexing',
    H2_WORKER_API: 'Worker API',
    H2_FIELD_BOOSTING: 'Field Boosting',
    H2_HTML_EXTRACTION: 'HTML Extraction',
    H2_TAG_FILTERING: 'Tag Filtering',
    H2_RESULT_FORMATTING: 'Result Formatting',
    H2_MULTI_LANGUAGE: 'Multi-Language Support',
    H2_PACKAGE_INFO: 'Package Information',
    H2_TOC_NAVIGATION: 'TOC Navigation',
    H3_KEY_FEATURES: 'Key Features',
    H3_WORKER_CONFIG: 'Worker Configuration',
    H3_INDEXER_API: 'Indexer API',
    H3_RELEASE_FORMATS: 'Release Formats',
    H3_TOLERANCE_LEVELS: 'Tolerance Levels',
    H3_CONFIDENCE_MODES: 'Confidence Modes',
    H3_HIGHLIGHTING: 'Highlighting',
    H3_PAGINATION: 'Pagination',
} as const;

test.describe('Search Extension', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/search-extension');
    });

    test.describe('Page title', () => {
        test('should display page title as h1 heading', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.SEARCH_PACKAGE);
        });

        test('should set browser tab title from frontmatter', async ({page}) => {
            const title = await page.title();

            expect(title).toContain(CONTENT.PAGE_TITLE);
        });
    });

    test.describe('Frontmatter description', () => {
        test('should render meta description tag in HTML head', async ({page}) => {
            const metaDescription = page.locator('meta[name="description"]');

            await expect(metaDescription).toHaveAttribute('content', CONTENT.PAGE_DESCRIPTION);
        });
    });

    test.describe('Frontmatter stage', () => {
        test('should render stage badge for preview stage', async ({page}) => {
            const mark = page.locator('.dc-mark');

            await expect(mark).toBeVisible();
            await expect(mark).toContainText(CONTENT.STAGE_LABEL);
        });

        test('should uppercase stage label text', async ({page}) => {
            const mark = page.locator('.dc-mark');
            const text = await mark.textContent();

            expect(text).toBe(text?.toUpperCase());
        });
    });

    test.describe('Frontmatter tags', () => {
        test('should render tags container', async ({page}) => {
            const tags = page.locator('.dc-tags');

            await expect(tags).toBeVisible();
        });

        test('should render all tags from frontmatter', async ({page}) => {
            const tagElements = page.locator('.dc-tags__tag');

            await expect(tagElements).toHaveCount(CONTENT.TAGS.length);

            for (const tag of CONTENT.TAGS) {
                await expect(tagElements.filter({hasText: new RegExp(`^${tag}$`)})).toHaveCount(1);
            }
        });
    });

    test.describe('Preset variables', () => {
        test('should substitute package name variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.SEARCH_PACKAGE);
        });

        test('should substitute version variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.SEARCH_VERSION);
        });

        test('should substitute description variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.SEARCH_DESCRIPTION);
        });

        test('should not leave unresolved search_info variable markers in output', async ({
            page,
        }) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).not.toContainText('{{ search_info');
            await expect(body).not.toContainText('{% for');
        });
    });

    test.describe('Overview', () => {
        test('should render overview heading section', async ({page}) => {
            const section = page.locator('h2#overview');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_OVERVIEW);
        });

        test('should render key features subsection', async ({page}) => {
            const section = page.locator('h3#key-features');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_KEY_FEATURES);
        });

        test('should list all key features', async ({page}) => {
            const features = [
                'Build-time indexing via Lunr',
                'Client-side Web Worker for offline search',
                'Configurable tolerance for fuzzy matching',
                'Phrased and sparsed confidence scoring modes',
                'Field boosting for title, keywords, and content',
                'Multi-language support with stemmers and stop words',
            ];

            const body = page.locator('.dc-doc-page__body');

            for (const feature of features) {
                await expect(body).toContainText(feature);
            }
        });
    });

    test.describe('Configuration', () => {
        test('should render configuration heading section', async ({page}) => {
            const section = page.locator('h2#configuration');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_CONFIGURATION);
        });

        test('should render worker configuration subsection', async ({page}) => {
            const section = page.locator('h3#worker-config');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_WORKER_CONFIG);
        });

        test('should list worker config parameters in table', async ({page}) => {
            const table = page.locator('#worker-config ~ table').first();

            await expect(table).toBeVisible();
            await expect(table).toContainText('tolerance');
            await expect(table).toContainText('confidence');
            await expect(table).toContainText('resources.index');
            await expect(table).toContainText('resources.registry');
        });
    });

    test.describe('Indexing', () => {
        test('should render indexing heading section', async ({page}) => {
            const section = page.locator('h2#indexing');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_INDEXING);
        });

        test('should render indexer api subsection', async ({page}) => {
            const section = page.locator('h3#indexer-api');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_INDEXER_API);
        });

        test('should render TypeScript code block with Indexer usage', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: 'Indexer'});

            await expect(codeBlock.first()).toBeVisible();
            await expect(codeBlock.first()).toContainText('ReleaseFormat');
            await expect(codeBlock.first()).toContainText('indexer.add');
            await expect(codeBlock.first()).toContainText('indexer.release');
        });

        test('should render release formats subsection', async ({page}) => {
            const section = page.locator('h3#release-formats');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_RELEASE_FORMATS);
        });

        test('should list release formats in table', async ({page}) => {
            const table = page.locator('h3#release-formats + table');

            await expect(table).toBeVisible();
            await expect(table).toContainText('JSONP');
            await expect(table).toContainText('RAW');
            await expect(table).toContainText('importScripts');
        });
    });

    test.describe('Worker API', () => {
        test('should render worker api heading section', async ({page}) => {
            const section = page.locator('h2#worker-api');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_WORKER_API);
        });

        test('should render JavaScript code block with worker api', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: 'workerScope.api'});

            await expect(codeBlock.first()).toBeVisible();
            await expect(codeBlock.first()).toContainText('suggest');
            await expect(codeBlock.first()).toContainText('search');
        });

        test('should mention MAX_COUNT_RESULT cap', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText('MAX_COUNT_RESULT');
        });

        test('should render tolerance levels subsection', async ({page}) => {
            const section = page.locator('h3#tolerance-levels');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_TOLERANCE_LEVELS);
        });

        test('should list tolerance levels in table', async ({page}) => {
            const table = page.locator('h3#tolerance-levels + table');

            await expect(table).toBeVisible();
            await expect(table).toContainText('word');
            await expect(table).toContainText('word*');
            await expect(table).toContainText('*word*');
        });

        test('should render confidence modes subsection', async ({page}) => {
            const section = page.locator('h3#confidence-modes');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_CONFIDENCE_MODES);
        });

        test('should list confidence modes in table', async ({page}) => {
            const table = page.locator('h3#confidence-modes + table');

            await expect(table).toBeVisible();
            await expect(table).toContainText('phrased');
            await expect(table).toContainText('sparsed');
        });
    });

    test.describe('Field Boosting', () => {
        test('should render field boosting heading section', async ({page}) => {
            const section = page.locator('h2#field-boosting');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_FIELD_BOOSTING);
        });

        test('should list field boosts in table', async ({page}) => {
            const table = page.locator('#field-boosting ~ table').first();

            await expect(table).toBeVisible();
            await expect(table).toContainText('title');
            await expect(table).toContainText('keywords');
            await expect(table).toContainText('content');
        });
    });

    test.describe('HTML Extraction', () => {
        test('should render html extraction heading section', async ({page}) => {
            const section = page.locator('h2#html-extraction');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_HTML_EXTRACTION);
        });

        test('should render TypeScript code block with html2text usage', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: 'html2text'});

            await expect(codeBlock.first()).toBeVisible();
            await expect(codeBlock.first()).toContainText("from '@diplodoc/search-extension'");
        });

        test('should mention node-html-parser for parsing', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText('node-html-parser');
        });

        test('should mention data-no-index support', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText('data-no-index');
        });
    });

    test.describe('Tag Filtering', () => {
        test('should render tag filtering heading section', async ({page}) => {
            const section = page.locator('h2#tag-filtering');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_TAG_FILTERING);
        });

        test('should document underscore-prefixed tag exclusion', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText('filterResultsByTags');
        });
    });

    test.describe('Result Formatting', () => {
        test('should render result formatting heading section', async ({page}) => {
            const section = page.locator('h2#result-formatting');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_RESULT_FORMATTING);
        });

        test('should render highlighting subsection', async ({page}) => {
            const section = page.locator('h3#highlighting');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_HIGHLIGHTING);
        });

        test('should document mark css class for highlighting', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText('SearchSuggestPageItem');
            await expect(body).toContainText('mark');
        });

        test('should render pagination subsection', async ({page}) => {
            const section = page.locator('h3#pagination');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_PAGINATION);
        });

        test('should document MAX_LENGTH constant', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText('MAX_LENGTH');
        });
    });

    test.describe('Multi-Language Support', () => {
        test('should render multi-language heading section', async ({page}) => {
            const section = page.locator('h2#multi-language');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_MULTI_LANGUAGE);
        });

        test('should document 30 language modules', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText('30');
            await expect(body).toContainText('lunr.multiLanguage');
        });
    });

    test.describe('Package Information', () => {
        test('should render package info heading section', async ({page}) => {
            const section = page.locator('h2#package-info');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_PACKAGE_INFO);
        });

        test('should iterate over dependencies from presets', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            for (const dep of CONTENT.DEPENDENCIES) {
                await expect(body).toContainText(dep);
            }
        });

        test('should iterate over entry points from presets', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            for (const entry of CONTENT.EXPORTS) {
                await expect(body).toContainText(entry);
            }
        });

        test('should not leave liquid for-loop tags in output', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).not.toContainText('{% for');
            await expect(body).not.toContainText('{% endfor');
        });
    });

    test.describe('Note directive', () => {
        test('should render note block for offline search', async ({page}) => {
            const note = page.locator('.yfm-note');

            await expect(note).toBeVisible();
            await expect(note).toContainText('Offline Search');
        });

        test('should render note content mentioning client-side', async ({page}) => {
            const note = page.locator('.yfm-note');

            await expect(note).toContainText('client-side');
        });
    });

    test.describe('Cut directive', () => {
        test('should render cut block for index loading', async ({page}) => {
            const cut = page.locator('details').filter({hasText: 'Index Loading'});

            await expect(cut).toBeVisible();
        });

        test('should document importScripts and Index.load in cut content', async ({page}) => {
            const cut = page.locator('details').filter({hasText: 'Index Loading'});

            await expect(cut).toContainText('importScripts');
            await expect(cut).toContainText('Index.load');
        });
    });

    test.describe('TOC navigation', () => {
        test('should render Search Extension link in sidebar', async ({page}) => {
            const navLink = page.locator('.dc-toc a').filter({
                hasText: CONTENT.PAGE_TITLE,
            });

            await expect(navLink).toBeVisible();
        });

        test('should mark Search Extension as active in TOC', async ({page}) => {
            const activeItem = page.locator('.dc-toc__list-item_active');

            await expect(activeItem).toBeVisible();
            await expect(activeItem).toContainText(CONTENT.PAGE_TITLE);
        });

        test('should render TOC navigation heading section', async ({page}) => {
            const section = page.locator('h2#toc-navigation');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_TOC_NAVIGATION);
        });
    });

    test.describe('Mini TOC', () => {
        test('should render mini-toc navigation element', async ({page}) => {
            const miniToc = page.locator('.dc-mini-toc');

            await expect(miniToc).toBeVisible();
        });

        test('should list page headings as sections', async ({page}) => {
            const sections = page.locator('.dc-mini-toc__section');

            const count = await sections.count();
            expect(count).toBeGreaterThan(0);
        });
    });
});
