import {expect, test} from '@playwright/test';

const CONTENT = {
    PAGE_TITLE: 'Package Template',
    PAGE_DESCRIPTION:
        'Documentation for @diplodoc/package-template — scaffolding template for new Diplodoc packages',
    STAGE_LABEL: 'NEW',
    TAGS: ['package-template', 'scaffolding', 'template', 'devops', 'starter'],
    TEMPLATE_PACKAGE: '@diplodoc/package-template',
    TEMPLATE_VERSION: '2.0.1',
    TEMPLATE_DESCRIPTION: 'Template package for creating new packages on the Diplodoc platform',
    EXPORTS: ['example', 'greet'],
    CONFIG_FILES: [
        '.eslintrc.js',
        '.prettierrc.js',
        '.stylelintrc.js',
        '.lintstagedrc.js',
        '.editorconfig',
        '.husky/pre-commit',
        'sonar-project.properties',
    ],
    CI_WORKFLOWS: [
        'tests.yml',
        'security.yml',
        'coverage.yml',
        'release.yml',
        'release-please.yml',
        'package-lock.yml',
        'update-deps.yml',
    ],
    H2_EXAMPLE_API: 'Example API',
    H3_EXAMPLE_FUNCTION: 'example()',
    H3_GREET_FUNCTION: 'greet(name)',
    H2_INIT_SCRIPT: 'Initialization Script',
    H2_PACKAGE_STRUCTURE: 'Package Structure',
    H2_BUILD_CONFIG: 'Build Configuration',
    H2_VITEST_CONFIG: 'Vitest Configuration',
    H2_SCAFFOLDING_FILES: 'Scaffolding Files',
    H2_CI_CD: 'CI/CD Workflows',
    H2_RELEASE_PROCESS: 'Release Process',
    H2_PACKAGE_INFO: 'Package Information',
    H2_TOC_NAVIGATION: 'TOC Navigation',
    PLACEHOLDER_TEXT: '{{PACKAGE_NAME}}',
} as const;

test.describe('Package Template', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/package-template');
    });

    test.describe('Page title', () => {
        test('should display page title as h1 heading', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.TEMPLATE_PACKAGE);
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
                await expect(tagElements.filter({hasText: new RegExp(`^${tag}$`)})).toHaveCount(1);
            }
        });
    });

    test.describe('Preset variables', () => {
        test('should substitute package name variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.TEMPLATE_PACKAGE);
        });

        test('should substitute version variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.TEMPLATE_VERSION);
        });

        test('should substitute description variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.TEMPLATE_DESCRIPTION);
        });

        test('should not leave unresolved package_template_info variable markers in output', async ({
            page,
        }) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).not.toContainText('{{ package_template_info');
            await expect(body).not.toContainText('{% for');
        });
    });

    test.describe('Example API', () => {
        test('should render example api heading section', async ({page}) => {
            const section = page.locator('h2#example-api');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_EXAMPLE_API);
        });

        test('should render example function heading section', async ({page}) => {
            const section = page.locator('h3#example-function');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_EXAMPLE_FUNCTION);
        });

        test('should render greet function heading section', async ({page}) => {
            const section = page.locator('h3#greet-function');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_GREET_FUNCTION);
        });

        test('should render typescript code block for example function', async ({page}) => {
            const codeBlock = page
                .locator('#example-function ~ .yfm-code-floating-container pre code')
                .first();

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText(
                "import {example} from '@diplodoc/package-template'",
            );
            await expect(codeBlock).toContainText('example()');
        });

        test('should render typescript code block for greet function', async ({page}) => {
            const codeBlock = page
                .locator('#greet-function ~ .yfm-code-floating-container pre code')
                .first();

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText(
                "import {greet} from '@diplodoc/package-template'",
            );
            await expect(codeBlock).toContainText("greet('Alice')");
        });
    });

    test.describe('Initialization Script', () => {
        test('should render init script heading section', async ({page}) => {
            const section = page.locator('h2#init-script');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_INIT_SCRIPT);
        });

        test('should render bash code block with clone and init commands', async ({page}) => {
            const codeBlock = page
                .locator('#init-script ~ .yfm-code-floating-container pre code')
                .first();

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('git clone');
            await expect(codeBlock).toContainText('./init.sh new-package');
        });

        test('should list init steps in ordered list', async ({page}) => {
            const section = page.locator('#init-script');
            const orderedList = section.locator('~ ol').first();

            await expect(orderedList).toBeVisible();

            const items = orderedList.locator('li');
            const count = await items.count();
            expect(count).toBeGreaterThanOrEqual(6);
        });

        test('should mention @diplodoc/infra init in init steps', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText('@diplodoc/infra init');
        });
    });

    test.describe('Package Structure', () => {
        test('should render package structure heading section', async ({page}) => {
            const section = page.locator('h2#package-structure');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_PACKAGE_STRUCTURE);
        });

        test('should render text code block with package structure tree', async ({page}) => {
            const codeBlock = page
                .locator('#package-structure ~ .yfm-code-floating-container pre code')
                .first();

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('index.ts');
            await expect(codeBlock).toContainText('build.mjs');
            await expect(codeBlock).toContainText('vitest.config.mjs');
        });
    });

    test.describe('Build Configuration', () => {
        test('should render build config heading section', async ({page}) => {
            const section = page.locator('h2#build-config');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_BUILD_CONFIG);
        });

        test('should render javascript code block with esbuild config', async ({page}) => {
            const codeBlock = page
                .locator('#build-config ~ .yfm-code-floating-container pre code')
                .first();

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('@diplodoc/infra/esbuild');
            await expect(codeBlock).toContainText('entryPoints');
            await expect(codeBlock).toContainText('tsconfig.publish.json');
        });

        test('should render bash code block with tsc declarations command', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body
                .locator('pre code')
                .filter({hasText: 'tsc --project tsconfig.publish.json'});

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('--emitDeclarationOnly');
        });
    });

    test.describe('Vitest Configuration', () => {
        test('should render vitest config heading section', async ({page}) => {
            const section = page.locator('h2#vitest-config');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_VITEST_CONFIG);
        });

        test('should render javascript code block with vitest config', async ({page}) => {
            const codeBlock = page
                .locator('#vitest-config ~ .yfm-code-floating-container pre code')
                .first();

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('defineConfig');
            await expect(codeBlock).toContainText("provider: 'v8'");
        });
    });

    test.describe('Scaffolding Files', () => {
        test('should render scaffolding files heading section', async ({page}) => {
            const section = page.locator('h2#scaffolding-files');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_SCAFFOLDING_FILES);
        });

        test('should list all scaffolding files', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            for (const file of CONTENT.CONFIG_FILES) {
                await expect(body).toContainText(file);
            }
        });
    });

    test.describe('CI/CD Workflows', () => {
        test('should render ci cd heading section', async ({page}) => {
            const section = page.locator('h2#ci-cd');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_CI_CD);
        });

        test('should render table with workflow entries', async ({page}) => {
            const table = page.locator('#ci-cd ~ table').first();

            await expect(table).toBeVisible();
        });

        test('should list all workflows in table rows', async ({page}) => {
            const table = page.locator('#ci-cd ~ table').first();

            for (const workflow of CONTENT.CI_WORKFLOWS) {
                await expect(table).toContainText(workflow);
            }
        });

        test('should render table headers', async ({page}) => {
            const table = page.locator('#ci-cd ~ table').first();
            const headers = table.locator('th');

            await expect(headers).toHaveCount(2);
            await expect(headers.first()).toContainText('Workflow');
            await expect(headers.nth(1)).toContainText('Purpose');
        });
    });

    test.describe('Release Process', () => {
        test('should render release process heading section', async ({page}) => {
            const section = page.locator('h2#release-process');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_RELEASE_PROCESS);
        });

        test('should mention release-please in release process', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText('release-please');
        });

        test('should list release steps in ordered list', async ({page}) => {
            const section = page.locator('#release-process');
            const orderedList = section.locator('~ ol').first();

            await expect(orderedList).toBeVisible();

            const items = orderedList.locator('li');
            const count = await items.count();
            expect(count).toBeGreaterThanOrEqual(5);
        });
    });

    test.describe('Package Information', () => {
        test('should render package info heading section', async ({page}) => {
            const section = page.locator('h2#package-info');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_PACKAGE_INFO);
        });

        test('should iterate over exports from presets', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            for (const exportName of CONTENT.EXPORTS) {
                await expect(body).toContainText(exportName);
            }
        });

        test('should iterate over config files from presets', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            for (const configFile of CONTENT.CONFIG_FILES) {
                await expect(body).toContainText(configFile);
            }
        });

        test('should not leave liquid for-loop tags in output', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).not.toContainText('{% for');
            await expect(body).not.toContainText('{% endfor');
        });
    });

    test.describe('Note directive', () => {
        test('should render note block for template substitution', async ({page}) => {
            const note = page.locator('.yfm-note');

            await expect(note).toBeVisible();
            await expect(note).toContainText('Template Substitution');
        });

        test('should render note content with placeholder text', async ({page}) => {
            const note = page.locator('.yfm-note');

            await expect(note).toContainText(CONTENT.PLACEHOLDER_TEXT);
        });
    });

    test.describe('TOC navigation', () => {
        test('should render Package Template link in sidebar', async ({page}) => {
            const navLink = page.locator('.dc-toc a').filter({
                hasText: CONTENT.PAGE_TITLE,
            });

            await expect(navLink).toBeVisible();
        });

        test('should mark Package Template as active in TOC', async ({page}) => {
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
