import {expect, test} from '@playwright/test';

import {readMiniTocDiagnostics, recordMiniTocEvents} from '../components/mini-toc-diagnostics';

test.describe('Mini TOC diagnostic recorder', () => {
    test('forwards native observer options, entries, receiver and observer', async ({page}) => {
        await page.setContent('<h2 id="content-rendering">Heading</h2>');
        await page.evaluate(recordMiniTocEvents);
        const result = await page.evaluate(
            () =>
                new Promise((resolve) => {
                    const NativeObserver = Object.getPrototypeOf(
                        window.IntersectionObserver,
                    ) as typeof IntersectionObserver;
                    const observer = new IntersectionObserver(
                        function (this: IntersectionObserver, entries, instance) {
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
        ]);
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

    test('bounds event history, reports truncation and installs only once', async ({page}) => {
        await page.setContent('<nav class="dc-mini-toc"><a id="target">Heading</a></nav>');
        await page.evaluate(recordMiniTocEvents);
        await page.evaluate(recordMiniTocEvents);
        await page.evaluate(() => {
            const element = document.getElementById('target');
            if (!element) throw new Error('Missing diagnostic target');
            for (let index = 0; index < 505; index++) {
                element.dispatchEvent(new Event('focusin', {bubbles: true}));
            }
        });
        const state = await readMiniTocDiagnostics(page);
        expect({count: state.events?.events.length, dropped: state.events?.droppedEvents}).toEqual({
            count: 500,
            dropped: 5,
        });
        expect(state.events?.events.every(({kind}) => kind === 'focusin')).toBe(true);
    });
});
