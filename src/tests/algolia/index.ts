import {expect, test} from '@playwright/test';

const CONTENT = {
    PAGE_TITLE: 'Algolia',
    PAGE_DESCRIPTION:
        'Documentation for @diplodoc/algolia-extension — Algolia search integration for Diplodoc',
    STAGE_LABEL: 'PREVIEW',
    TAGS: ['algolia', 'search', 'indexing', 'provider', 'algolia-extension'],
    ALGOLIA_PACKAGE: '@diplodoc/algolia-extension',
    ALGOLIA_VERSION: '0.7.1',
    ALGOLIA_DESCRIPTION:
        'Algolia search integration extension for Diplodoc — indexing and client-side search',
    OPTIONS: [
        '--app-id',
        '--api-key',
        '--index-name',
        '--index',
        '--search-api-key',
        '--search-provider',
        '--search-api',
    ],
    DEPENDENCIES: ['@diplodoc/search-extension', 'algoliasearch', 'cheerio', 'lodash', 'ts-dedent'],
    H2_OVERVIEW: 'Overview',
    H2_CONFIGURATION: 'Configuration',
    H2_USAGE: 'Usage',
    H2_INDEX_COMMAND: 'Index Command',
    H2_DOCUMENT_PROCESSING: 'Document Processing',
    H2_SEARCH_PROVIDER: 'Search Provider',
    H2_CLIENT_SEARCH: 'Client-Side Search',
    H2_PACKAGE_INFO: 'Package Information',
    H2_TOC_NAVIGATION: 'TOC Navigation',
    H3_KEY_FEATURES: 'Key Features',
    H3_REQUIRED_CONFIG: 'Required Configuration',
    H3_OPTIONAL_CONFIG: 'Optional Configuration',
    H3_BASIC_USAGE: 'Basic Usage',
    H3_RECORD_LIMITS: 'Record Size Limits',
} as const;

test.describe('Algolia', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/algolia');
    });

    test.describe('Page title', () => {
        test('should display page title as h1 heading', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.ALGOLIA_PACKAGE);
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

            await expect(body).toContainText(CONTENT.ALGOLIA_PACKAGE);
        });

        test('should substitute version variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.ALGOLIA_VERSION);
        });

        test('should substitute description variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.ALGOLIA_DESCRIPTION);
        });

        test('should not leave unresolved algolia_info variable markers in output', async ({
            page,
        }) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).not.toContainText('{{ algolia_info');
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
                'Automatic indexing',
                'Multi-language support',
                'Parallel processing',
                'Section-based search',
                'Client-side search',
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

        test('should render required configuration subsection', async ({page}) => {
            const section = page.locator('h3#required-config');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_REQUIRED_CONFIG);
        });

        test('should list required config parameters in table', async ({page}) => {
            const table = page.locator('h3#required-config + table');

            await expect(table).toBeVisible();
            await expect(table).toContainText('ALGOLIA_APP_ID');
            await expect(table).toContainText('ALGOLIA_API_KEY');
            await expect(table).toContainText('ALGOLIA_INDEX_NAME');
        });

        test('should render optional configuration subsection', async ({page}) => {
            const section = page.locator('h3#optional-config');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_OPTIONAL_CONFIG);
        });

        test('should list optional config parameters in table', async ({page}) => {
            const table = page.locator('h3#optional-config + table');

            await expect(table).toBeVisible();
            await expect(table).toContainText('--index');
            await expect(table).toContainText('--search-api-key');
            await expect(table).toContainText('_search/api.js');
        });
    });

    test.describe('Usage', () => {
        test('should render usage heading section', async ({page}) => {
            const section = page.locator('h2#usage');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_USAGE);
        });

        test('should render basic usage subsection', async ({page}) => {
            const section = page.locator('h3#basic-usage');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_BASIC_USAGE);
        });

        test('should render bash code block with CLI command', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body
                .locator('pre code')
                .filter({hasText: '@diplodoc/algolia-extension'});

            await expect(codeBlock.first()).toBeVisible();
            await expect(codeBlock.first()).toContainText('@diplodoc/cli');
        });

        test('should render environment variables code block', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: 'ALGOLIA_APP_ID'});

            await expect(codeBlock.first()).toBeVisible();
            await expect(codeBlock.first()).toContainText('export');
        });

        test('should render CLI flags code block', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: '--app-id'});

            await expect(codeBlock.first()).toBeVisible();
        });

        test('should render yaml config file code block', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: 'searchableAttributes'});

            await expect(codeBlock.first()).toBeVisible();
            await expect(codeBlock.first()).toContainText('hitsPerPage');
        });
    });

    test.describe('Index Command', () => {
        test('should render index command heading section', async ({page}) => {
            const section = page.locator('h2#index-command');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_INDEX_COMMAND);
        });

        test('should render code block with index command', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: 'index -i'});

            await expect(codeBlock.first()).toBeVisible();
            await expect(codeBlock.first()).toContainText('--index-name');
        });
    });

    test.describe('Document Processing', () => {
        test('should render document processing heading section', async ({page}) => {
            const section = page.locator('h2#document-processing');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_DOCUMENT_PROCESSING);
        });

        test('should render TypeScript code block with AlgoliaRecord interface', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: 'AlgoliaRecord'});

            await expect(codeBlock.first()).toBeVisible();
            await expect(codeBlock.first()).toContainText('objectID');
            await expect(codeBlock.first()).toContainText('headings');
        });

        test('should render record size limits subsection', async ({page}) => {
            const section = page.locator('h3#record-limits');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_RECORD_LIMITS);
        });

        test('should document maximum record size', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText('9600');
        });

        test('should document chunk size', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText('4000');
        });
    });

    test.describe('Search Provider', () => {
        test('should render search provider heading section', async ({page}) => {
            const section = page.locator('h2#search-provider');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_SEARCH_PROVIDER);
        });

        test('should render provider methods table', async ({page}) => {
            const table = page.locator('#search-provider ~ table').first();

            await expect(table).toBeVisible();
            await expect(table).toContainText('add');
            await expect(table).toContainText('release');
            await expect(table).toContainText('addObjects');
            await expect(table).toContainText('clearIndex');
            await expect(table).toContainText('config');
        });
    });

    test.describe('Client-Side Search', () => {
        test('should render client-side search heading section', async ({page}) => {
            const section = page.locator('h2#client-search');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_CLIENT_SEARCH);
        });

        test('should render JavaScript code block with worker API', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: 'workerScope.api'});

            await expect(codeBlock.first()).toBeVisible();
            await expect(codeBlock.first()).toContainText('suggest');
            await expect(codeBlock.first()).toContainText('search');
        });
    });

    test.describe('Package Information', () => {
        test('should render package info heading section', async ({page}) => {
            const section = page.locator('h2#package-info');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_PACKAGE_INFO);
        });

        test('should iterate over config options from presets', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            for (const option of CONTENT.OPTIONS) {
                await expect(body).toContainText(option);
            }
        });

        test('should iterate over dependencies from presets', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            for (const dep of CONTENT.DEPENDENCIES) {
                await expect(body).toContainText(dep);
            }
        });

        test('should not leave liquid for-loop tags in output', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).not.toContainText('{% for');
            await expect(body).not.toContainText('{% endfor');
        });
    });

    test.describe('Note directive', () => {
        test('should render note block for local indexing', async ({page}) => {
            const note = page.locator('.yfm-note');

            await expect(note).toBeVisible();
            await expect(note).toContainText('Local Indexing');
        });

        test('should render note content with _search directory mention', async ({page}) => {
            const note = page.locator('.yfm-note');

            await expect(note).toContainText('_search');
        });
    });

    test.describe('Cut directive', () => {
        test('should render cut block for index naming convention', async ({page}) => {
            const cut = page.locator('details').filter({hasText: 'Index Naming Convention'});

            await expect(cut).toBeVisible();
        });

        test('should document index naming pattern in cut content', async ({page}) => {
            const cut = page.locator('details').filter({hasText: 'Index Naming Convention'});

            await expect(cut).toContainText('{indexName}-{lang}');
            await expect(cut).toContainText('docs-ru');
        });
    });

    test.describe('TOC navigation', () => {
        test('should render Algolia link in sidebar', async ({page}) => {
            const navLink = page.locator('.dc-toc a').filter({
                hasText: CONTENT.PAGE_TITLE,
            });

            await expect(navLink).toBeVisible();
        });

        test('should mark Algolia as active in TOC', async ({page}) => {
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
