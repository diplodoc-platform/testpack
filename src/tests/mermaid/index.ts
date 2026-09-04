import {expect, test} from '@playwright/test';

const selectors = {
    mermaidDiv: 'div.mermaid',
    mermaidSvg: 'div.mermaid > svg',
    codeBlock: 'pre > code',
} as const;

const CONTENT = {
    PAGE_TITLE: 'Mermaid',
    TOC_ITEM_MERMAID: 'Mermaid',
} as const;

test.describe('Mermaid', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/mermaid/');
    });

    test.describe('Page structure', () => {
        test('should render page title', async ({page}) => {
            const title = page.locator('h1');

            await expect(title).toBeVisible();
            await expect(title).toContainText(CONTENT.PAGE_TITLE);
        });

        test('should render mermaid div elements for all mermaid blocks', async ({page}) => {
            const mermaidDivs = page.locator(selectors.mermaidDiv);

            const count = await mermaidDivs.count();
            expect(count).toBeGreaterThanOrEqual(8);
        });
    });

    test.describe('Flowchart', () => {
        test('should render a mermaid div after the flowchart heading', async ({page}) => {
            const div = page.locator('#flowchart + ' + selectors.mermaidDiv);

            await expect(div).toBeVisible();
            await expect(div).toHaveClass(/mermaid/);
        });

        test('should encode flowchart source in data-content attribute', async ({page}) => {
            const div = page.locator('#flowchart + ' + selectors.mermaidDiv);

            const decoded = await div.evaluate((el) => {
                const raw = el.getAttribute('data-content') || '';
                return decodeURIComponent(raw);
            });

            expect(decoded).toContain('graph TD');
            expect(decoded).toContain('A[Start]');
            expect(decoded).toContain('B{Decision}');
            expect(decoded).toContain('C[Process A]');
            expect(decoded).toContain('E[End]');
        });

        test('should render an SVG inside the flowchart mermaid div', async ({page}) => {
            const svg = page.locator('#flowchart + ' + selectors.mermaidDiv + ' > svg');

            await expect(svg).toBeVisible({timeout: 15000});
        });
    });

    test.describe('Sequence Diagram', () => {
        test('should render a mermaid div after the sequence heading', async ({page}) => {
            const div = page.locator('#sequence + ' + selectors.mermaidDiv);

            await expect(div).toBeVisible();
        });

        test('should encode sequence diagram source in data-content', async ({page}) => {
            const div = page.locator('#sequence + ' + selectors.mermaidDiv);

            const decoded = await div.evaluate((el) => {
                const raw = el.getAttribute('data-content') || '';
                return decodeURIComponent(raw);
            });

            expect(decoded).toContain('sequenceDiagram');
            expect(decoded).toContain('participant Alice');
            expect(decoded).toContain('participant Bob');
            expect(decoded).toContain('Hello Bob!');
        });

        test('should render an SVG inside the sequence diagram mermaid div', async ({page}) => {
            const svg = page.locator('#sequence + ' + selectors.mermaidDiv + ' > svg');

            await expect(svg).toBeVisible({timeout: 15000});
        });
    });

    test.describe('Class Diagram', () => {
        test('should render a mermaid div after the class diagram heading', async ({page}) => {
            const div = page.locator('#class-diagram + ' + selectors.mermaidDiv);

            await expect(div).toBeVisible();
        });

        test('should encode class diagram source in data-content', async ({page}) => {
            const div = page.locator('#class-diagram + ' + selectors.mermaidDiv);

            const decoded = await div.evaluate((el) => {
                const raw = el.getAttribute('data-content') || '';
                return decodeURIComponent(raw);
            });

            expect(decoded).toContain('classDiagram');
            expect(decoded).toContain('Animal <|-- Dog');
            expect(decoded).toContain('Animal <|-- Cat');
            expect(decoded).toContain('+makeSound()');
        });

        test('should render an SVG inside the class diagram mermaid div', async ({page}) => {
            const svg = page.locator('#class-diagram + ' + selectors.mermaidDiv + ' > svg');

            await expect(svg).toBeVisible({timeout: 15000});
        });
    });

    test.describe('State Diagram', () => {
        test('should render a mermaid div after the state diagram heading', async ({page}) => {
            const div = page.locator('#state-diagram + ' + selectors.mermaidDiv);

            await expect(div).toBeVisible();
        });

        test('should encode state diagram source in data-content', async ({page}) => {
            const div = page.locator('#state-diagram + ' + selectors.mermaidDiv);

            const decoded = await div.evaluate((el) => {
                const raw = el.getAttribute('data-content') || '';
                return decodeURIComponent(raw);
            });

            expect(decoded).toContain('stateDiagram-v2');
            expect(decoded).toContain('Locked');
            expect(decoded).toContain('Unlocked');
            expect(decoded).toContain('Coin');
            expect(decoded).toContain('Push');
        });

        test('should render an SVG inside the state diagram mermaid div', async ({page}) => {
            const svg = page.locator('#state-diagram + ' + selectors.mermaidDiv + ' > svg');

            await expect(svg).toBeVisible({timeout: 15000});
        });
    });

    test.describe('Pie Chart', () => {
        test('should render a mermaid div after the pie chart heading', async ({page}) => {
            const div = page.locator('#pie-chart + ' + selectors.mermaidDiv);

            await expect(div).toBeVisible();
        });

        test('should encode pie chart source in data-content', async ({page}) => {
            const div = page.locator('#pie-chart + ' + selectors.mermaidDiv);

            const decoded = await div.evaluate((el) => {
                const raw = el.getAttribute('data-content') || '';
                return decodeURIComponent(raw);
            });

            expect(decoded).toContain('pie title Market Share');
            expect(decoded).toContain('Product A');
            expect(decoded).toContain('Product B');
        });

        test('should render an SVG inside the pie chart mermaid div', async ({page}) => {
            const svg = page.locator('#pie-chart + ' + selectors.mermaidDiv + ' > svg');

            await expect(svg).toBeVisible({timeout: 15000});
        });
    });

    test.describe('Styled Flowchart', () => {
        test('should render a mermaid div after the styled flowchart heading', async ({page}) => {
            const div = page.locator('#styled-flowchart + ' + selectors.mermaidDiv);

            await expect(div).toBeVisible();
        });

        test('should encode styled flowchart source in data-content', async ({page}) => {
            const div = page.locator('#styled-flowchart + ' + selectors.mermaidDiv);

            const decoded = await div.evaluate((el) => {
                const raw = el.getAttribute('data-content') || '';
                return decodeURIComponent(raw);
            });

            expect(decoded).toContain('graph TB');
            expect(decoded).toContain('Incoming');
            expect(decoded).toContain('classDef orange');
            expect(decoded).toContain('classDef blue');
        });

        test('should render an SVG inside the styled flowchart mermaid div', async ({page}) => {
            const svg = page.locator('#styled-flowchart + ' + selectors.mermaidDiv + ' > svg');

            await expect(svg).toBeVisible({timeout: 15000});
        });
    });

    test.describe('Git Graph', () => {
        test('should render a mermaid div after the git graph heading', async ({page}) => {
            const div = page.locator('#git-graph + ' + selectors.mermaidDiv);

            await expect(div).toBeVisible();
        });

        test('should encode git graph source in data-content', async ({page}) => {
            const div = page.locator('#git-graph + ' + selectors.mermaidDiv);

            const decoded = await div.evaluate((el) => {
                const raw = el.getAttribute('data-content') || '';
                return decodeURIComponent(raw);
            });

            expect(decoded).toContain('gitGraph');
            expect(decoded).toContain('commit');
            expect(decoded).toContain('branch develop');
            expect(decoded).toContain('merge develop');
        });

        test('should render an SVG inside the git graph mermaid div', async ({page}) => {
            const svg = page.locator('#git-graph + ' + selectors.mermaidDiv + ' > svg');

            await expect(svg).toBeVisible({timeout: 15000});
        });
    });

    test.describe('Non-Mermaid Code Block', () => {
        test('should NOT render a mermaid div for regular code blocks', async ({page}) => {
            const mermaidDiv = page.locator('#regular-code + ' + selectors.mermaidDiv);

            await expect(mermaidDiv).toHaveCount(0);
        });

        test('should render a regular code block instead', async ({page}) => {
            const codeBlock = page.locator('#regular-code + div pre code');

            await expect(codeBlock).toBeVisible();
            await expect(codeBlock).toContainText('const x = 42');
        });
    });

    test.describe('Multiple Diagrams', () => {
        test('should render two mermaid divs in the multiple section', async ({page}) => {
            const section = page.locator('#multiple');
            const mermaidDivs = section.locator('~ ' + selectors.mermaidDiv);

            const count = await mermaidDivs.count();
            expect(count).toBeGreaterThanOrEqual(2);
        });

        test('should encode left-to-right graph in first diagram', async ({page}) => {
            const firstDiv = page.locator('#multiple + ' + selectors.mermaidDiv);

            const decoded = await firstDiv.evaluate((el) => {
                const raw = el.getAttribute('data-content') || '';
                return decodeURIComponent(raw);
            });

            expect(decoded).toContain('graph LR');
            expect(decoded).toContain('X --> Y');
        });

        test('should render SVGs for both diagrams', async ({page}) => {
            const svgs = page.locator(
                '#multiple + ' +
                    selectors.mermaidDiv +
                    ' > svg, #multiple + ' +
                    selectors.mermaidDiv +
                    ' ~ ' +
                    selectors.mermaidDiv +
                    ' > svg',
            );

            await expect(svgs.first()).toBeVisible({timeout: 15000});
        });
    });

    test.describe('All mermaid diagrams', () => {
        test('should have non-empty data-content on every mermaid div', async ({page}) => {
            const divs = page.locator(selectors.mermaidDiv);
            const count = await divs.count();

            for (let i = 0; i < count; i++) {
                const dataContent = await divs.nth(i).getAttribute('data-content');
                expect(dataContent).toBeTruthy();
                expect(dataContent!.length).toBeGreaterThan(0);
            }
        });

        test('should render SVGs for all valid mermaid diagrams', async ({page}) => {
            const svgs = page.locator(selectors.mermaidSvg);

            await expect(svgs.first()).toBeVisible({timeout: 15000});
            const count = await svgs.count();
            expect(count).toBeGreaterThanOrEqual(7);
        });
    });

    test.describe('TOC navigation', () => {
        test('should contain mermaid link in sidebar', async ({page}) => {
            const mermaidLink = page.locator('.dc-toc__list-item a', {
                hasText: CONTENT.TOC_ITEM_MERMAID,
            });

            await expect(mermaidLink).toHaveCount(1);
        });
    });
});
