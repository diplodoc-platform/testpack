import {devices} from '@playwright/test';

import config from './src/config';

export default config({
    use: {
        baseURL: 'http://localhost:3000',
        headless: true,
        timeout: 30000,
    },
    projects: [
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']},
        },
    ],
    webServer: {
        command: 'npm run docs && npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
    },
});
