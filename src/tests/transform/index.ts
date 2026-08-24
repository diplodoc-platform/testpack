import {expect, test} from '@playwright/test';

const selectors = {
    defList: 'dl',
    defTerm: 'dt',
    defDesc: 'dd',
    superscript: 'sup',
    monospace: 'samp',
    image: 'img',
    videoContainer: '.embed-responsive',
    videoIframe: 'iframe',
    blockAnchor: 'hr#custom-anchor',
    headingAnchor: '.yfm-anchor',
    codeFloatingContainer: '.yfm-code-floating-container',
    lineNumber: '.yfm-line-number',
    codePrompt: '.yfm-code-prompt',
    wrappingButton: '.yfm-wrapping-button',
    inlineCode: 'code.yfm-clipboard-inline-code',
    orderedList: 'ol',
    externalLink: 'a[href="https://example.com/"]',
} as const;

const CONTENT = {
    TERM_ONE: 'Term one',
    TERM_TWO: 'Term two',
    TERM_THREE: 'Term three',
    DEF_ONE: 'Definition for term one.',
    DEF_TWO: 'Definition for term two.',
    DEF_THREE: 'Definition for term three with bold text.',
    SUP_TEXT: '2',
    FORMULA: 'E = mc',
    MONO_TEXT: 'monospaced',
    MONO_EXAMPLE: 'monospace example',
    SIZED_LOGO_ALT: 'Sized logo',
    SIZED_LOGO_SRC: 'assets/diplodoc-light.jpg',
    INLINE_WIDTH_ALT: 'Inline width',
    GALLERY_ALT: 'Gallery image',
    YOUTUBE_SRC: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    BLOCK_ANCHOR_ID: 'custom-anchor',
    SUBSECTION_TEXT: 'Subsection with explicit id',
    PAGE_TITLE: 'Transform features',
    LINE_NUM_FIRST: '1',
    LINE_NUM_SECOND: '2',
    PROMPT_SYMBOL: '$',
    PROMPT_CMD_ECHO: 'echo hello',
    PROMPT_CMD_LS: 'ls -la',
    WRAP_TEXT: 'wrappable',
    INLINE_CODE_TEXT: 'clipboard inline code',
    OL_FIRST: 'Fifth item',
    OL_LAST: 'Seventh item',
    EXTERNAL_LINK_TEXT: 'external site',
} as const;

test.describe('Transform features', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('./ru/syntax/transform');
    });

    test.describe('Definition lists', () => {
        test('should render a definition list with dt and dd elements', async ({page}) => {
            const defList = page.locator(selectors.defList);

            await expect(defList).toBeVisible();

            const terms = defList.locator(selectors.defTerm);
            await expect(terms).toHaveCount(3);
            await expect(terms.nth(0)).toContainText(CONTENT.TERM_ONE);
            await expect(terms.nth(1)).toContainText(CONTENT.TERM_TWO);
            await expect(terms.nth(2)).toContainText(CONTENT.TERM_THREE);

            const descs = defList.locator(selectors.defDesc);
            await expect(descs).toHaveCount(3);
            await expect(descs.nth(0)).toContainText(CONTENT.DEF_ONE);
            await expect(descs.nth(1)).toContainText(CONTENT.DEF_TWO);
            await expect(descs.nth(2)).toContainText(CONTENT.DEF_THREE);
        });

        test('should render inline markup inside definition descriptions', async ({page}) => {
            const thirdDesc = page.locator(selectors.defList).locator(selectors.defDesc).nth(2);

            await expect(thirdDesc.locator('strong')).toContainText('bold');
        });
    });

    test.describe('Superscript', () => {
        test('should render superscript text inside sup element', async ({page}) => {
            const paragraph = page.locator('#superscript + p');

            await expect(paragraph).toContainText(CONTENT.FORMULA);
            await expect(paragraph.locator(selectors.superscript)).toContainText(CONTENT.SUP_TEXT);
        });

        test('should render exactly one sup element in the paragraph', async ({page}) => {
            const paragraph = page.locator('#superscript + p');

            await expect(paragraph.locator(selectors.superscript)).toHaveCount(1);
        });
    });

    test.describe('Monospace', () => {
        test('should render monospace text inside samp elements', async ({page}) => {
            const paragraph = page.locator('#monospace + p');

            const sampElements = paragraph.locator(selectors.monospace);
            await expect(sampElements).toHaveCount(2);
            await expect(sampElements.nth(0)).toContainText(CONTENT.MONO_TEXT);
            await expect(sampElements.nth(1)).toContainText(CONTENT.MONO_EXAMPLE);
        });

        test('should not leave raw ## markers in output', async ({page}) => {
            const body = page.locator('body');

            await expect(body).not.toContainText('##monospaced');
            await expect(body).not.toContainText('##monospace example##');
        });
    });

    test.describe('Image sizing', () => {
        test('should render image with width and height from =WxH syntax', async ({page}) => {
            const sizedImage = page.locator(`img[alt="${CONTENT.SIZED_LOGO_ALT}"]`);

            await expect(sizedImage).toHaveAttribute('src', CONTENT.SIZED_LOGO_SRC);
            await expect(sizedImage).toHaveAttribute('alt', CONTENT.SIZED_LOGO_ALT);
            await expect(sizedImage).toHaveAttribute('width', '100');
            await expect(sizedImage).toHaveAttribute('height', '50');
        });

        test('should render image with inline width attribute', async ({page}) => {
            const inlineImage = page.locator(`img[alt="${CONTENT.INLINE_WIDTH_ALT}"]`);

            await expect(inlineImage).toHaveAttribute('width', '120');
            await expect(inlineImage).not.toHaveAttribute('height');
        });

        test('should render image with data-gallery attribute', async ({page}) => {
            const galleryImage = page.locator(`img[alt="${CONTENT.GALLERY_ALT}"]`);

            await expect(galleryImage).toHaveAttribute('data-gallery', 'true');
        });
    });

    test.describe('Video embeds', () => {
        test('should render a responsive video container with iframe', async ({page}) => {
            const container = page.locator(selectors.videoContainer);

            await expect(container).toBeVisible();
            await expect(container).toHaveClass(/embed-responsive-16by9/);

            const iframe = container.locator(selectors.videoIframe);
            await expect(iframe).toHaveAttribute('src', CONTENT.YOUTUBE_SRC);
            await expect(iframe).toHaveClass(/youtube-player/);
        });

        test('should set width and height attributes on the iframe', async ({page}) => {
            const iframe = page.locator(selectors.videoIframe);

            await expect(iframe).toHaveAttribute('width', '640');
            await expect(iframe).toHaveAttribute('height', '390');
        });
    });

    test.describe('Block anchors', () => {
        test('should render a hidden hr element with the anchor id', async ({page}) => {
            const anchor = page.locator(selectors.blockAnchor);

            await expect(anchor).toHaveAttribute('id', CONTENT.BLOCK_ANCHOR_ID);
            await expect(anchor).toHaveClass(/visually-hidden/);
        });
    });

    test.describe('Headings and anchors', () => {
        test('should render subsection heading with explicit id', async ({page}) => {
            const subsection = page.locator('#explicit-id');

            await expect(subsection).toBeVisible();
            await expect(subsection).toContainText(CONTENT.SUBSECTION_TEXT);
        });

        test('should render anchor link inside the subsection heading', async ({page}) => {
            const anchorLink = page.locator('#explicit-id').locator(selectors.headingAnchor);

            await expect(anchorLink).toBeVisible();
            await expect(anchorLink).toHaveAttribute('aria-hidden', 'true');
        });
    });

    test.describe('Code with line numbers', () => {
        test('should render line number spans for each line', async ({page}) => {
            const codeSection = page.locator('#line-numbers + ' + selectors.codeFloatingContainer);

            const lineNumbers = codeSection.locator(selectors.lineNumber);
            await expect(lineNumbers).toHaveCount(2);
            await expect(lineNumbers.nth(0)).toContainText(CONTENT.LINE_NUM_FIRST);
            await expect(lineNumbers.nth(1)).toContainText(CONTENT.LINE_NUM_SECOND);
        });
    });

    test.describe('Code with prompt', () => {
        test('should render data-prompt attribute on code element', async ({page}) => {
            const codeSection = page.locator('#code-prompt + ' + selectors.codeFloatingContainer);

            const codeElement = codeSection.locator('code');
            await expect(codeElement).toHaveAttribute('data-prompt', CONTENT.PROMPT_SYMBOL);
        });

        test('should render prompt spans before each command line', async ({page}) => {
            const codeSection = page.locator('#code-prompt + ' + selectors.codeFloatingContainer);

            const promptSpans = codeSection.locator(selectors.codePrompt);
            await expect(promptSpans).toHaveCount(2);
            await expect(promptSpans.nth(0)).toContainText(CONTENT.PROMPT_SYMBOL);
            await expect(promptSpans.nth(1)).toContainText(CONTENT.PROMPT_SYMBOL);
        });

        test('should have aria-hidden on prompt spans', async ({page}) => {
            const codeSection = page.locator('#code-prompt + ' + selectors.codeFloatingContainer);

            const promptSpan = codeSection.locator(selectors.codePrompt).first();
            await expect(promptSpan).toHaveAttribute('aria-hidden', 'true');
        });
    });

    test.describe('Code with line wrapping', () => {
        test('should add wrap class to code element', async ({page}) => {
            const codeSection = page.locator('#code-wrap + ' + selectors.codeFloatingContainer);

            const codeElement = codeSection.locator('code');
            await expect(codeElement).toHaveClass(/wrap/);
        });

        test('should render wrapping button as selected', async ({page}) => {
            const codeSection = page.locator('#code-wrap + ' + selectors.codeFloatingContainer);

            const wrapButton = codeSection.locator(selectors.wrappingButton);
            await expect(wrapButton).toHaveClass(/g-button_selected/);
        });
    });

    test.describe('Inline code clipboard', () => {
        test('should render inline code with clipboard class and role', async ({page}) => {
            const paragraph = page.locator('#inline-code + p');

            const inlineCode = paragraph.locator(selectors.inlineCode);
            await expect(inlineCode).toBeVisible();
            await expect(inlineCode).toContainText(CONTENT.INLINE_CODE_TEXT);
            await expect(inlineCode).toHaveAttribute('role', 'button');
            await expect(inlineCode).toHaveAttribute('tabindex', '0');
        });

        test('should render inline code with unique id', async ({page}) => {
            const paragraph = page.locator('#inline-code + p');

            const inlineCode = paragraph.locator(selectors.inlineCode);
            await expect(inlineCode).toHaveAttribute('id', /inline-code-id-/);
        });
    });

    test.describe('Ordered list with start', () => {
        test('should render ol with start attribute', async ({page}) => {
            const ol = page.locator('#ol-start + ol');

            await expect(ol).toHaveAttribute('start', '5');
        });

        test('should render ol with hier-list-start CSS variable', async ({page}) => {
            const ol = page.locator('#ol-start + ol');

            await expect(ol).toHaveAttribute('style', /--hier-list-start:\s*4/);
        });

        test('should render list items in correct order', async ({page}) => {
            const ol = page.locator('#ol-start + ol');

            const items = ol.locator('li');
            await expect(items).toHaveCount(3);
            await expect(items.nth(0)).toContainText(CONTENT.OL_FIRST);
            await expect(items.nth(2)).toContainText(CONTENT.OL_LAST);
        });
    });

    test.describe('External links', () => {
        test('should render external link with target and rel attributes', async ({page}) => {
            const link = page.locator(selectors.externalLink);

            await expect(link).toBeVisible();
            await expect(link).toContainText(CONTENT.EXTERNAL_LINK_TEXT);
            await expect(link).toHaveAttribute('target', '_blank');
            await expect(link).toHaveAttribute('rel', 'noreferrer noopener');
        });
    });

    test.describe('Page title', () => {
        test('should display Transform features heading on page', async ({page}) => {
            const heading = page.locator('h1').first();

            await expect(heading).toContainText(CONTENT.PAGE_TITLE);
        });
    });

    test.describe('TOC navigation', () => {
        test('should render sidebar navigation with Transform link', async ({page}) => {
            const navLink = page
                .locator('.yfm-sidebar a, .docs-sidebar a, nav a')
                .filter({hasText: 'Transform'});

            await expect(navLink).toBeVisible();
        });
    });
});
