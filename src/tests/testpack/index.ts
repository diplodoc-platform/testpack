import {expect, test} from '@playwright/test';

const CONTENT = {
    PAGE_TITLE: 'Testpack',
    PAGE_DESCRIPTION:
        '@diplodoc/testpack — E2E test infrastructure for the Diplodoc documentation platform',
    STAGE_LABEL: 'NEW',
    TAGS: ['testpack', 'testing', 'playwright', 'e2e', 'devops'],
    TESTPACK_PACKAGE: '@diplodoc/testpack',
    TESTPACK_VERSION: '1.0.1',
    TESTPACK_DESCRIPTION: 'E2E test infrastructure for the Diplodoc documentation platform',
    SCRIPTS: ['npm run build', 'npm run start', 'npm run test', 'npm run docs', 'npm run lint'],
    EXPORTS: ['@diplodoc/testpack/config', '@diplodoc/testpack/server', '@diplodoc/testpack/tests'],
    SUITES: ['Terms', 'Tabs', 'Cut', 'Search', 'Mermaid'],
    CONFIG_SETTINGS: ['testDir', 'retries', 'workers', 'maxDiffPixels', 'updateSnapshots'],
    ENV_VARS: ['PROJECT', 'PORT', 'BASE_URL', 'CI'],
    BUILD_OUTPUTS: ['build/config', 'build/server', 'build/tests'],
    H2_ARCHITECTURE: 'Architecture',
    H2_CONFIG_FACTORY: 'Configuration Factory',
    H2_TEST_SERVER: 'Test Server',
    H2_TEST_SUITES: 'Test Suites',
    H2_PACKAGE_INFO: 'Package Information',
    H2_BUILD_PIPELINE: 'Build Pipeline',
    H2_TOC_NAVIGATION: 'TOC Navigation',
    NOTE_TITLE: 'Self-Bootstrapping',
    CUT_TITLE: 'Screenshot Testing',
    DIAGRAM_TEXT: 'docs/input/*.md',
    CONFIG_IMPORT: '@diplodoc/testpack/config',
} as const;

test.describe('Testpack', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/testpack');
    });

    test.describe('Page title', () => {
        test('should display page title as h1 heading', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.TESTPACK_PACKAGE);
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
        test('should render stage badge for new stage', async ({page}) => {
            const mark = page.locator('.dc-mark');

            await expect(mark).toBeVisible();
            await expect(mark).toContainText(CONTENT.STAGE_LABEL);
        });

        test('should uppercase stage label text', async ({page}) => {
            const mark = page.locator('.dc-mark');
            const text = await mark.textContent();

            expect(text).toBe(text?.toUpperCase());
        });

        test('should render stage meta tag with new value', async ({page}) => {
            const stageMeta = page.locator('meta[name="stage"]');

            await expect(stageMeta).toHaveAttribute('content', 'new');
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
                await expect(tagElements.filter({hasText: tag})).toHaveCount(1);
            }
        });
    });

    test.describe('Architecture', () => {
        test('should render architecture heading section', async ({page}) => {
            const section = page.locator('h2#architecture');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_ARCHITECTURE);
        });

        test('should render ordered list of test flow steps', async ({page}) => {
            const list = page.locator('h2#architecture ~ ol').first();

            await expect(list).toBeVisible();
            await expect(list.locator('li')).toHaveCount(4);
        });

        test('should render architecture diagram code block', async ({page}) => {
            const codeBlock = page
                .locator('h2#architecture ~ .yfm-code-floating-container pre code')
                .first();

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText(CONTENT.DIAGRAM_TEXT);
        });
    });

    test.describe('Configuration Factory', () => {
        test('should render config factory heading section', async ({page}) => {
            const section = page.locator('h2#config-factory');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_CONFIG_FACTORY);
        });

        test('should render typescript code block with config import', async ({page}) => {
            const codeBlock = page
                .locator('h2#config-factory ~ .yfm-code-floating-container pre code')
                .first();

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText(CONTENT.CONFIG_IMPORT);
        });

        test('should render settings table with all config settings', async ({page}) => {
            const table = page.locator('h2#config-factory ~ table').first();

            await expect(table).toBeVisible();

            for (const setting of CONTENT.CONFIG_SETTINGS) {
                await expect(table).toContainText(setting);
            }
        });

        test('should render three table headers for settings', async ({page}) => {
            const table = page.locator('h2#config-factory ~ table').first();
            const headers = table.locator('th');

            await expect(headers).toHaveCount(3);
            await expect(headers.first()).toContainText('Setting');
            await expect(headers.nth(1)).toContainText('Default');
        });
    });

    test.describe('Test Server', () => {
        test('should render test server heading section', async ({page}) => {
            const section = page.locator('h2#test-server');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_TEST_SERVER);
        });

        test('should render env vars table with all variables', async ({page}) => {
            const table = page.locator('h2#test-server ~ table').first();

            await expect(table).toBeVisible();

            for (const envVar of CONTENT.ENV_VARS) {
                await expect(table).toContainText(envVar);
            }
        });

        test('should render env vars table headers', async ({page}) => {
            const table = page.locator('h2#test-server ~ table').first();
            const headers = table.locator('th');

            await expect(headers).toHaveCount(3);
            await expect(headers.first()).toContainText('Environment Variable');
            await expect(headers.nth(1)).toContainText('Default');
        });

        test('should document URL rewriting behaviour', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText('index.html');
            await expect(body).toContainText('.html');
        });
    });

    test.describe('Test Suites', () => {
        test('should render test suites heading section', async ({page}) => {
            const section = page.locator('h2#test-suites');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_TEST_SUITES);
        });

        test('should render table listing all suites', async ({page}) => {
            const table = page.locator('h2#test-suites ~ table').first();

            await expect(table).toBeVisible();

            for (const suite of CONTENT.SUITES) {
                await expect(table).toContainText(suite);
            }
        });

        test('should render two table headers for suites', async ({page}) => {
            const table = page.locator('h2#test-suites ~ table').first();
            const headers = table.locator('th');

            await expect(headers).toHaveCount(2);
            await expect(headers.first()).toContainText('Suite');
            await expect(headers.nth(1)).toContainText('Focus');
        });
    });

    test.describe('Package Information', () => {
        test('should render package info heading section', async ({page}) => {
            const section = page.locator('h2#package-info');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_PACKAGE_INFO);
        });

        test('should substitute package name variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.TESTPACK_PACKAGE);
        });

        test('should substitute version variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.TESTPACK_VERSION);
        });

        test('should iterate over scripts from presets', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            for (const script of CONTENT.SCRIPTS) {
                await expect(body).toContainText(script);
            }
        });

        test('should iterate over exports from presets', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            for (const exportName of CONTENT.EXPORTS) {
                await expect(body).toContainText(exportName);
            }
        });

        test('should not leave liquid for-loop tags in output', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).not.toContainText('{% for');
            await expect(body).not.toContainText('{% endfor');
        });
    });

    test.describe('Note directive', () => {
        test('should render note block for self-bootstrapping', async ({page}) => {
            const note = page.locator('.yfm-note');

            await expect(note).toBeVisible();
            await expect(note).toContainText(CONTENT.NOTE_TITLE);
        });

        test('should mention init.js in note content', async ({page}) => {
            const note = page.locator('.yfm-note');

            await expect(note).toContainText('scripts/init.js');
        });
    });

    test.describe('Build Pipeline', () => {
        test('should render build pipeline heading section', async ({page}) => {
            const section = page.locator('h2#build-pipeline');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_BUILD_PIPELINE);
        });

        test('should render table listing all build outputs', async ({page}) => {
            const table = page.locator('h2#build-pipeline ~ table').first();

            await expect(table).toBeVisible();

            for (const output of CONTENT.BUILD_OUTPUTS) {
                await expect(table).toContainText(output);
            }
        });

        test('should render three table headers for build outputs', async ({page}) => {
            const table = page.locator('h2#build-pipeline ~ table').first();
            const headers = table.locator('th');

            await expect(headers).toHaveCount(3);
            await expect(headers.first()).toContainText('Output');
            await expect(headers.nth(1)).toContainText('Mode');
        });
    });

    test.describe('Cut block', () => {
        test('should render cut block for screenshot testing', async ({page}) => {
            const details = page.locator('details').filter({
                has: page.locator('summary', {hasText: CONTENT.CUT_TITLE}),
            });

            await expect(details).toBeVisible();
        });

        test('should mention strict diff checking inside cut', async ({page}) => {
            const details = page.locator('details').filter({
                has: page.locator('summary', {hasText: CONTENT.CUT_TITLE}),
            });

            await expect(details).toContainText('maxDiffPixels');
            await expect(details).toContainText('--update-snapshots');
        });
    });

    test.describe('TOC navigation', () => {
        test('should render Testpack link in sidebar', async ({page}) => {
            const navLink = page.locator('.dc-toc a').filter({
                hasText: CONTENT.PAGE_TITLE,
            });

            await expect(navLink).toBeVisible();
        });

        test('should mark Testpack as active in TOC', async ({page}) => {
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
