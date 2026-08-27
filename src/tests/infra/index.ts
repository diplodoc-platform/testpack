import {expect, test} from '@playwright/test';

const CONTENT = {
    PAGE_TITLE: 'Infra',
    PAGE_DESCRIPTION:
        'Documentation for @diplodoc/infra — linting, CI workflows, and scaffolding',
    STAGE_LABEL: 'NEW',
    TAGS: ['infra', 'linting', 'scaffolding', 'ci', 'devops'],
    INFRA_PACKAGE: '@diplodoc/infra',
    INFRA_VERSION: '2.2.3',
    INFRA_DESCRIPTION:
        'Central infrastructure package for linting, CI workflows, and scaffolding',
    BINARIES: ['lint', 'infra'],
    EXPORTS: ['eslint-config', 'prettier-config', 'stylelint-config', 'esbuild'],
    H2_CLI_REFERENCE: 'CLI Reference',
    H2_ESLINT_CONFIG: 'ESLint Configuration',
    H2_DEPENDABOT_CONFIG: 'Dependabot Configuration',
    H2_DISTRIBUTION_MATRIX: 'Distribution Matrix',
    H2_EXPORTS: 'Exports',
    H2_SCAFFOLDING_FILES: 'Scaffolding Files',
    H2_PACKAGE_INFO: 'Package Information',
    H2_TOC_NAVIGATION: 'TOC Navigation',
    H3_LINT_BINARY: 'lint Binary',
    H3_INFRA_BINARY: 'infra Binary',
    LINT_COMMANDS: ['lint', 'lint fix', 'lint init', 'lint update'],
    INFRA_COMMANDS: [
        'infra init',
        'infra update',
        'infra sync',
        'infra gate sync',
        'infra blacklist show',
        'infra blacklist audit',
    ],
    SCAFFOLDING_FILES: [
        '.eslintrc.js',
        '.prettierrc.js',
        '.stylelintrc.js',
        '.lintstagedrc.js',
        '.editorconfig',
        '.husky/pre-commit',
        'sonar-project.properties',
    ],
    DISTRIBUTION_REPOS: ['cli', 'transform', 'cut-extension', 'components'],
    PLACEHOLDER_TEXT: '{{PACKAGE_NAME}}',
} as const;

test.describe('Infra', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/infra');
    });

    test.describe('Page title', () => {
        test('should display page title as h1 heading', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.INFRA_PACKAGE);
        });

        test('should set browser tab title from frontmatter', async ({page}) => {
            const title = await page.title();

            expect(title).toContain(CONTENT.PAGE_TITLE);
        });
    });

    test.describe('Frontmatter description', () => {
        test('should render meta description tag in HTML head', async ({page}) => {
            const metaDescription = page.locator('meta[name="description"]');

            await expect(metaDescription).toHaveAttribute(
                'content',
                CONTENT.PAGE_DESCRIPTION,
            );
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

    test.describe('Preset variables', () => {
        test('should substitute package name variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.INFRA_PACKAGE);
        });

        test('should substitute version variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.INFRA_VERSION);
        });

        test('should substitute description variable', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).toContainText(CONTENT.INFRA_DESCRIPTION);
        });

        test('should not leave unresolved infra_info variable markers in output', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            await expect(body).not.toContainText('{{ infra_info');
            await expect(body).not.toContainText('{% for');
        });
    });

    test.describe('CLI Reference', () => {
        test('should render CLI reference heading section', async ({page}) => {
            const section = page.locator('h2#cli-reference');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_CLI_REFERENCE);
        });

        test('should render lint binary heading section', async ({page}) => {
            const section = page.locator('h3#lint-binary');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_LINT_BINARY);
        });

        test('should render infra binary heading section', async ({page}) => {
            const section = page.locator('h3#infra-binary');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H3_INFRA_BINARY);
        });

        test('should list all lint commands in table', async ({page}) => {
            const table = page.locator('h3#lint-binary + table');

            await expect(table).toBeVisible();

            for (const cmd of CONTENT.LINT_COMMANDS) {
                await expect(table).toContainText(cmd);
            }
        });

        test('should list all infra commands in table', async ({page}) => {
            const table = page.locator('h3#infra-binary + table');

            await expect(table).toBeVisible();

            for (const cmd of CONTENT.INFRA_COMMANDS) {
                await expect(table).toContainText(cmd);
            }
        });
    });

    test.describe('ESLint Configuration', () => {
        test('should render eslint config heading section', async ({page}) => {
            const section = page.locator('h2#eslint-config');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_ESLINT_CONFIG);
        });

        test('should render javascript code block', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: 'module.exports'});

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('@gravity-ui/eslint-config');
        });
    });

    test.describe('Dependabot Configuration', () => {
        test('should render dependabot config heading section', async ({page}) => {
            const section = page.locator('h2#dependabot-config');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_DEPENDABOT_CONFIG);
        });

        test('should render yaml code block with dependabot config', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');
            const codeBlock = body.locator('pre code').filter({hasText: 'package-ecosystem'});

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('open-pull-requests-limit');
            await expect(codeBlock).toContainText('dev-tools');
        });
    });

    test.describe('Distribution Matrix', () => {
        test('should render distribution matrix heading section', async ({page}) => {
            const section = page.locator('h2#distribution-matrix');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_DISTRIBUTION_MATRIX);
        });

        test('should render table with repository entries', async ({page}) => {
            const table = page.locator('#distribution-matrix ~ table').first();

            await expect(table).toBeVisible();
        });

        test('should list all repositories in table rows', async ({page}) => {
            const table = page.locator('#distribution-matrix ~ table').first();

            for (const repo of CONTENT.DISTRIBUTION_REPOS) {
                await expect(table).toContainText(repo);
            }
        });

        test('should render table headers', async ({page}) => {
            const table = page.locator('#distribution-matrix ~ table').first();
            const headers = table.locator('th');

            await expect(headers).toHaveCount(3);
            await expect(headers.first()).toContainText('Repository');
            await expect(headers.nth(1)).toContainText('Auto-merge');
        });
    });

    test.describe('Exports', () => {
        test('should render exports heading section', async ({page}) => {
            const section = page.locator('h2#exports');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_EXPORTS);
        });

        test('should render json code block with subpath exports', async ({page}) => {
            const codeBlock = page.locator('#exports ~ .yfm-code-floating-container pre code').first();

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('prettier-config');
            await expect(codeBlock).toContainText('stylelint-config');
            await expect(codeBlock).toContainText('esbuild');
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

            for (const file of CONTENT.SCAFFOLDING_FILES) {
                await expect(body).toContainText(file);
            }
        });
    });

    test.describe('Package Information', () => {
        test('should render package info heading section', async ({page}) => {
            const section = page.locator('h2#package-info');

            await expect(section).toBeVisible();
            await expect(section).toContainText(CONTENT.H2_PACKAGE_INFO);
        });

        test('should iterate over binaries from presets', async ({page}) => {
            const body = page.locator('.dc-doc-page__body');

            for (const binary of CONTENT.BINARIES) {
                await expect(body).toContainText(binary);
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
        test('should render Infra link in sidebar', async ({page}) => {
            const navLink = page.locator('.dc-toc a').filter({
                hasText: CONTENT.PAGE_TITLE,
            });

            await expect(navLink).toBeVisible();
        });

        test('should mark Infra as active in TOC', async ({page}) => {
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
