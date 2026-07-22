import type {Locator, Page} from '@playwright/test';

export async function openTerm(page: Page) {
    // Find the term element
    const termElement = await findTerm(page);
    // Click on the term
    await termElement.click();

    return termElement;
}

export async function findTerm(page: Page, nth = 0) {
    return page.locator('i.yfm-term_title').nth(nth);
}

export async function findTooltip(page: Page, term?: Locator) {
    term = term || (await findTerm(page));
    // Get aria-controls to find the corresponding tooltip
    const termId = await term.getAttribute('aria-controls');

    return page.locator(`dfn[id="${termId}"]`);
}
