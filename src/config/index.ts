import type {Config, ReporterDescription} from '@playwright/test';

import {defineConfig} from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'https://hostmachine';

type Reporters = {
    reporter?: ReporterDescription[];
};

export default (additionals: Partial<Omit<Config, 'reporter'>> & Reporters) =>
    defineConfig({
        testDir: './tests',
        outputDir: '.playwright/result',
        updateSnapshots: 'missing',
        snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{projectName}/{arg}{ext}',
        forbidOnly: true,
        retries: process.env.CI ? 2 : 0,
        workers: process.env.CI ? 1 : 4,
        fullyParallel: true,
        ...additionals,
        expect: {
            toHaveScreenshot: {
                maxDiffPixels: 0,
            },
            ...(additionals.expect || {}),
        },
        use: {
            baseURL,
            ignoreHTTPSErrors: true,
            trace: 'on-first-retry',
            ...(additionals.use || {}),
        },
        reporter: (
            [
                ['html', {outputFolder: '.playwright/html'}],
                ['json', {outputFile: '.playwright/json/results.json'}],
            ] as ReporterDescription[]
        ).concat(additionals.reporter || []),
    });
