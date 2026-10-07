import {defineConfig} from '@playwright/test';

import base from './playwright.config';

const scenario = process.env.MINI_TOC_SCENARIO || 'navigation';
if (!['navigation', 'full-suite'].includes(scenario)) throw new Error('Invalid Mini TOC scenario');
const output = `.playwright/mini-toc/${scenario}`;

export default defineConfig({
    ...base,
    // The suite starts/stops tracing only for Mini TOC, including attempt zero.
    use: {...base.use, trace: 'off'},
    updateSnapshots: 'none',
    outputDir: `${output}/results`,
    reporter: [
        ['html', {outputFolder: `${output}/html`, open: 'never'}],
        ['json', {outputFile: `${output}/results.json`}],
        ['line'],
    ],
});
