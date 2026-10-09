import type {Page, TestInfo} from '@playwright/test';

type DiagnosticEvent = {
    kind: string;
    time: number;
    scrollY: number;
    active: (string | null)[];
    details: unknown;
};

type DiagnosticWindow = Window & {
    __diplodocMiniToc?: {
        events: DiagnosticEvent[];
        droppedEvents: number;
    };
};

/**
 * Record native observer and navigation events without changing their behavior.
 * @returns {void} Installs a bounded recorder in the current document.
 */
export function recordMiniTocEvents() {
    // Retain the beginning of hydration, even when later scroll events are noisy.
    const diagnosticWindow = window as DiagnosticWindow;
    if (diagnosticWindow.__diplodocMiniToc) return;
    const state = {events: [] as DiagnosticEvent[], droppedEvents: 0};
    diagnosticWindow.__diplodocMiniToc = state;
    const record = (kind: string, details: unknown) => {
        if (state.events.length >= 500) {
            state.droppedEvents++;
            return;
        }

        state.events.push({
            kind,
            time: performance.now(),
            scrollY,
            active: Array.from(
                document.querySelectorAll('.dc-mini-toc__section_active'),
                (element) => element.getAttribute('data-hash'),
            ),
            details,
        });
    };

    // Observe native callback delivery without replacing entries or their order.
    const NativeObserver = window.IntersectionObserver;
    let observerId = 0;
    window.IntersectionObserver = class extends NativeObserver {
        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
            const id = ++observerId;
            super(
                typeof callback === 'function'
                    ? function (this: IntersectionObserver, entries, observer) {
                          record('intersection', {
                              phase: 'before-callback',
                              observer: id,
                              entries: entries.map((entry) => ({
                                  id: entry.target.id,
                                  intersecting: entry.isIntersecting,
                                  ratio: entry.intersectionRatio,
                                  entryTime: entry.time,
                                  rect: entry.boundingClientRect.toJSON(),
                                  root: entry.rootBounds?.toJSON(),
                              })),
                          });
                          // `active` is the pre-callback snapshot; React's later DOM
                          // updates are recorded as separate active-class-change events.
                          callback.call(this, entries, observer);
                      }
                    : callback,
                options,
            );
            record('observer-created', {
                id,
                rootMargin: this.rootMargin,
                thresholds: this.thresholds,
            });
        }
    };

    // Correlate observer delivery with real navigation and rendering events.
    for (const name of ['click', 'focusin']) {
        document.addEventListener(
            name,
            (event) => {
                const element = event.target;
                if (!(element instanceof Element)) return;
                if (!element.closest('.dc-mini-toc, h2[id], h3[id]')) return;
                record(name, {
                    id: element.id,
                    tag: element.tagName,
                    href: element.getAttribute('href'),
                });
            },
            true,
        );
    }
    window.addEventListener(
        'scroll',
        (event) => {
            const element = event.target;
            record('scroll', {target: element instanceof Element ? element.className : 'document'});
        },
        {capture: true, passive: true},
    );
    document.addEventListener('DOMContentLoaded', () => record('dom-ready', null), {once: true});
    document.fonts.addEventListener('loadingdone', () => record('fonts-ready', null));
    new MutationObserver((changes) => {
        if (
            changes.some(
                ({target}) =>
                    target instanceof Element && target.classList.contains('dc-mini-toc__section'),
            )
        )
            record('active-class-change', null);
    }).observe(document, {subtree: true, attributes: true, attributeFilter: ['class']});
}

/**
 * Install before navigation so hydration cannot create unobserved instances.
 * @param {Page} page Test page before navigation.
 * @returns {Promise<void>} Resolves when the init script is registered.
 */
export async function installMiniTocDiagnostics(page: Page) {
    await page.addInitScript(recordMiniTocEvents);
}

/**
 * Return serializable state; the JSON attachment retains every recorded event.
 * @param {Page} page Test page to inspect.
 * @returns {Promise<object>} Current geometry and bounded native event history.
 */
export async function readMiniTocDiagnostics(page: Page) {
    return page.evaluate(() => ({
        url: location.href,
        viewport: {width: innerWidth, height: innerHeight, devicePixelRatio},
        userAgent: navigator.userAgent,
        scrollY,
        target: document.getElementById('content-rendering')?.getBoundingClientRect().toJSON(),
        headings: Array.from(document.querySelectorAll('h2[id], h3[id]'), (element) => ({
            id: element.id,
            rect: element.getBoundingClientRect().toJSON(),
        })),
        active: Array.from(document.querySelectorAll('.dc-mini-toc__section_active'), (element) =>
            element.getAttribute('data-hash'),
        ),
        fonts: document.fonts.status,
        events: (window as DiagnosticWindow).__diplodocMiniToc ?? null,
    }));
}

type DiagnosticCapture = {
    readState: () => Promise<unknown>;
    stopTrace?: () => Promise<string>;
    attach: TestInfo['attach'];
};

/**
 * Retain capture failures separately without changing the test's assertion outcome.
 * @param {DiagnosticCapture} capture Independent state and trace collectors.
 * @returns {Promise<void>} Resolves even when diagnostic collection fails.
 */
export async function captureMiniTocDiagnostics(capture: DiagnosticCapture) {
    const errors: {phase: string; message: string}[] = [];
    const describeError = (error: unknown) =>
        error instanceof Error ? error.message : String(error);

    // A lost page execution context must not prevent the trace from being saved.
    try {
        const state = await capture.readState();
        await capture.attach('mini-toc-state', {
            body: JSON.stringify(state, null, 2),
            contentType: 'application/json',
        });
    } catch (error) {
        errors.push({phase: 'state', message: describeError(error)});
    }

    if (capture.stopTrace) {
        try {
            const trace = await capture.stopTrace();
            await capture.attach('mini-toc-trace', {path: trace, contentType: 'application/zip'});
        } catch (error) {
            errors.push({phase: 'trace', message: describeError(error)});
        }
    }

    // Missing diagnostics are explicit incomplete evidence, never a product failure.
    if (errors.length > 0) {
        try {
            await capture.attach('mini-toc-diagnostic-error', {
                body: JSON.stringify({errors}, null, 2),
                contentType: 'application/json',
            });
        } catch (error) {
            // The attachment channel itself failed; retain the capture error in CI logs.
            // eslint-disable-next-line no-console
            console.error('Mini TOC diagnostic attachment failed', {
                errors,
                error: describeError(error),
            });
        }
    }
}
