const {defineConfig} = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    testMatch: 'repository.spec.ts',
    retries: 0,
    workers: 1,
});
