#!/usr/bin/env node

/* eslint-env node */
/* eslint-disable no-console */
const {execSync} = require('node:child_process');
const {existsSync, readdirSync} = require('node:fs');
const {homedir} = require('node:os');
const {join} = require('node:path');

function getPlaywrightCachePath() {
    const platform = process.platform;
    const home = homedir();

    if (platform === 'win32') {
        return join(home, 'AppData', 'Local', 'ms-playwright');
    } else if (platform === 'darwin') {
        return join(home, 'Library', 'Caches', 'ms-playwright');
    } else {
        // Linux, FreeBSD, etc.
        return join(home, '.cache', 'ms-playwright');
    }
}

function hasChromium(cachePath) {
    if (!existsSync(cachePath)) {
        return false;
    }

    try {
        const entries = readdirSync(cachePath);
        return entries.some((entry) => entry.includes('chromium'));
    } catch {
        return false;
    }
}

function checkDiplodocCli() {
    try {
        require.resolve('@diplodoc/cli');
        return true;
    } catch {
        return false;
    }
}

function main() {
    const cachePath = getPlaywrightCachePath();
    console.log(`PLAYWRIGHT CACHE: ${cachePath}`);

    // List cache directory if it exists
    if (existsSync(cachePath)) {
        try {
            const entries = readdirSync(cachePath);
            entries.forEach((entry) => {
                console.log(entry);
            });
        } catch (error) {
            // Ignore read errors
        }
    }

    // Install Playwright if chromium is not in cache
    if (!hasChromium(cachePath)) {
        console.log('Installing Playwright with chromium...');
        const args = process.argv.slice(2);
        execSync(`npx playwright install --with-deps chromium ${args.join(' ')}`, {
            stdio: 'inherit',
        });
    }

    // Install @diplodoc/cli if not available
    if (!checkDiplodocCli()) {
        console.log('Installing @diplodoc/cli...');
        execSync('npm i @diplodoc/cli@latest --no-save', {
            stdio: 'inherit',
        });
    }
}

main();
