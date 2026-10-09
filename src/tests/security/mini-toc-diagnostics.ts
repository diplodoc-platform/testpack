import {expect, test} from '@playwright/test';

import {
    captureMiniTocDiagnostics,
    readMiniTocDiagnostics,
    recordMiniTocEvents,
} from '../components/mini-toc-diagnostics';

test.describe('Mini TOC diagnostic recorder', () => {
    test('forwards native observer options, entries, receiver and observer', async ({page}) => {
        // Arrange distinct active states before and after the native callback.
        await page.setContent(
            '<nav><span class="dc-mini-toc__section_active" data-hash="before"></span><span id="after" class="dc-mini-toc__section" data-hash="after"></span></nav><h2 id="content-rendering">Heading</h2>',
        );
        await page.evaluate(recordMiniTocEvents);
        const result = await page.evaluate(
            () =>
                new Promise((resolve) => {
                    const NativeObserver = Object.getPrototypeOf(
                        window.IntersectionObserver,
                    ) as typeof IntersectionObserver;
                    const observer = new IntersectionObserver(
                        function (this: IntersectionObserver, entries, instance) {
                            document
                                .querySelector('.dc-mini-toc__section_active')
                                ?.classList.remove('dc-mini-toc__section_active');
                            document
                                .getElementById('after')
                                ?.classList.add('dc-mini-toc__section_active');
                            const result = {
                                nativeInstance: instance instanceof NativeObserver,
                                sameInstance: instance === observer,
                                receiver: this === observer,
                                target: entries[0].target.id,
                                visible: entries[0].isIntersecting,
                                rootMargin: instance.rootMargin,
                                thresholds: instance.thresholds,
                            };
                            observer.disconnect();
                            resolve(result);
                        },
                        {rootMargin: '12px', threshold: [0, 0.5, 1]},
                    );
                    const heading = document.getElementById('content-rendering');
                    if (!heading) throw new Error('Missing test heading');
                    observer.observe(heading);
                }),
        );
        expect(result).toEqual({
            nativeInstance: true,
            sameInstance: true,
            receiver: true,
            target: 'content-rendering',
            visible: true,
            rootMargin: '12px 12px 12px 12px',
            thresholds: [0, 0.5, 1],
        });
        const state = await readMiniTocDiagnostics(page);
        expect(state.events?.events.map(({kind}) => kind)).toEqual([
            'observer-created',
            'intersection',
            'active-class-change',
        ]);
        expect(state.events?.events.find(({kind}) => kind === 'intersection')?.active).toEqual([
            'before',
        ]);
        expect(
            (
                state.events?.events.find(({kind}) => kind === 'intersection')?.details as {
                    phase: string;
                }
            ).phase,
        ).toBe('before-callback');
        expect(state.active).toEqual(['after']);
    });

    test('retains native constructor validation', async ({page}) => {
        await page.evaluate(recordMiniTocEvents);
        const errors = await page.evaluate(() => {
            const NativeObserver = Object.getPrototypeOf(
                window.IntersectionObserver,
            ) as typeof IntersectionObserver;
            return [NativeObserver, window.IntersectionObserver].map((Observer) => {
                try {
                    const observer = new Observer(
                        undefined as unknown as IntersectionObserverCallback,
                    );
                    observer.disconnect();
                    return null;
                } catch (error) {
                    return error instanceof TypeError ? 'TypeError' : 'other error';
                }
            });
        });
        expect(errors).toEqual(['TypeError', 'TypeError']);
    });

    test('preserves the first events, reports later drops and installs only once', async ({
        page,
    }) => {
        await page.setContent('<nav class="dc-mini-toc"><a id="target">Heading</a></nav>');
        await page.evaluate(recordMiniTocEvents);
        await page.evaluate(recordMiniTocEvents);
        await page.evaluate(() => {
            const element = document.getElementById('target');
            if (!element) throw new Error('Missing diagnostic target');
            element.dispatchEvent(new Event('focusin', {bubbles: true}));
            element.id = 'later';
            for (let index = 0; index < 505; index++) {
                element.dispatchEvent(new Event('focusin', {bubbles: true}));
            }
        });
        const state = await readMiniTocDiagnostics(page);
        expect({count: state.events?.events.length, dropped: state.events?.droppedEvents}).toEqual({
            count: 500,
            dropped: 6,
        });
        expect(state.events?.events.every(({kind}) => kind === 'focusin')).toBe(true);
        expect(state.events?.events[0].details).toEqual({id: 'target', tag: 'A', href: null});
        expect(
            state.events?.events
                .slice(1)
                .every(({details}) => (details as {id: string}).id === 'later'),
        ).toBe(true);
    });

    test('keeps the initial native observer batch after a long scroll burst', async ({page}) => {
        // Arrange a real observer callback before a noisy sequence of scroll events.
        await page.setContent('<h2 id="initial">Heading</h2>');
        await page.evaluate(recordMiniTocEvents);
        await page.evaluate(
            () =>
                new Promise<void>((resolve) => {
                    const observer = new IntersectionObserver(() => {
                        observer.disconnect();
                        resolve();
                    });
                    const target = document.getElementById('initial');
                    if (!target) throw new Error('Missing initial heading');
                    observer.observe(target);
                }),
        );

        // Act: overflow the bounded history without scrolling the target by hand.
        await page.evaluate(() => {
            for (let index = 0; index < 600; index++) window.dispatchEvent(new Event('scroll'));
        });

        // Assert: the hydration evidence is preserved instead of displaced by noise.
        const state = await readMiniTocDiagnostics(page);
        expect(state.events?.events).toHaveLength(500);
        expect(state.events?.droppedEvents).toBeGreaterThan(0);
        const initial = state.events?.events.find(({kind}) => kind === 'intersection');
        expect((initial?.details as {entries: {id: string}[]}).entries.map(({id}) => id)).toEqual([
            'initial',
        ]);
    });

    test('state capture failure still saves the trace without throwing', async () => {
        const attachments: {name: string; body?: string | Buffer; path?: string}[] = [];
        await expect(
            captureMiniTocDiagnostics({
                readState: async () => {
                    throw new Error('Execution context destroyed');
                },
                stopTrace: async () => 'retained-trace.zip',
                attach: async (name, options) => {
                    attachments.push({name, ...options});
                },
            }),
        ).resolves.toBeUndefined();
        expect(attachments.map(({name}) => name)).toEqual([
            'mini-toc-trace',
            'mini-toc-diagnostic-error',
        ]);
        expect(attachments[0].path).toBe('retained-trace.zip');
        expect(JSON.parse(String(attachments[1].body))).toEqual({
            errors: [{phase: 'state', message: 'Execution context destroyed'}],
        });
    });

    test('independent state and trace failures are explicit incomplete evidence', async () => {
        const attachments: {name: string; body?: string | Buffer}[] = [];
        await expect(
            captureMiniTocDiagnostics({
                readState: async () => {
                    throw new Error('Page closed');
                },
                stopTrace: async () => {
                    throw new Error('Trace unavailable');
                },
                attach: async (name, options) => {
                    attachments.push({name, ...options});
                },
            }),
        ).resolves.toBeUndefined();
        expect(attachments.map(({name}) => name)).toEqual(['mini-toc-diagnostic-error']);
        expect(JSON.parse(String(attachments[0].body))).toEqual({
            errors: [
                {phase: 'state', message: 'Page closed'},
                {phase: 'trace', message: 'Trace unavailable'},
            ],
        });
    });
});
