#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

/**
 * Inventory a frozen corpus without executing its contents or following links.
 * @param {string} directory Built candidate HTML directory.
 * @returns {Array<object>} Sorted relative paths and content digests.
 */
function inventoryCorpus(directory) {
    const root = path.resolve(directory);
    if (fs.realpathSync(root) !== root || !fs.statSync(root).isDirectory())
        throw new Error('Corpus must be a real directory');
    const files = [];
    const visit = (relative) => {
        for (const name of fs.readdirSync(path.join(root, relative)).sort()) {
            const child = path.join(relative, name);
            const absolute = path.join(root, child);
            const stat = fs.lstatSync(absolute);
            if (stat.isSymbolicLink()) throw new Error('Corpus symlinks are not supported');
            if (stat.isDirectory()) visit(child);
            else if (stat.isFile())
                files.push({
                    path: child.split(path.sep).join('/'),
                    sha256: createHash('sha256').update(fs.readFileSync(absolute)).digest('hex'),
                });
            else throw new Error('Unsupported corpus entry');
        }
    };
    visit('');
    if (!files.some((file) => file.path.endsWith('.html')))
        throw new Error('Candidate corpus contains no HTML');
    return files;
}

/**
 * Configure browsers to serve the already-built comparison corpus, never npx CLI.
 * @param {Object} env Workflow environment.
 * @returns {Object} Browser evidence and explicit Playwright overrides.
 */
function prepareBrowser(env) {
    if (!/^[a-f0-9]{40}$/i.test(env.PR_SHA || '')) throw new Error('Invalid candidate SHA');
    for (const name of ['TESTPACK_ROOT', 'CANDIDATE_CORPUS', 'BROWSER_ARTIFACTS'])
        if (!env[name] || !path.isAbsolute(env[name])) throw new Error(`Missing absolute ${name}`);
    const root = fs.realpathSync(env.TESTPACK_ROOT);
    const corpus = path.resolve(env.CANDIDATE_CORPUS);
    const artifacts = path.resolve(env.BROWSER_ARTIFACTS);
    const server = path.join(root, 'build/server/index.js');
    if (!fs.statSync(server).isFile()) throw new Error('Missing built testpack server');
    const files = inventoryCorpus(corpus);
    const evidence = {
        candidateSha: env.PR_SHA.toLowerCase(),
        corpus,
        files,
        corpusSha256: createHash('sha256').update(JSON.stringify(files)).digest('hex'),
    };
    const config = {
        testDir: path.join(root, 'tests'),
        updateSnapshots: 'none',
        use: {baseURL: 'http://localhost:3000'},
        webServer: {
            command: `node ${JSON.stringify(server)}`,
            cwd: root,
            url: 'http://localhost:3000',
            env: {PROJECT: corpus, PORT: '3000'},
            reuseExistingServer: false,
        },
        reporter: [
            ['html', {outputFolder: path.join(artifacts, 'playwright-report'), open: 'never'}],
            ['json', {outputFile: path.join(artifacts, 'browser-results.json')}],
        ],
    };
    return {evidence, config};
}

function main(env = process.env) {
    const prepared = prepareBrowser(env);
    const artifacts = env.BROWSER_ARTIFACTS;
    fs.writeFileSync(
        path.join(artifacts, 'candidate-browser.json'),
        JSON.stringify(prepared.evidence, null, 2),
        {flag: 'wx'},
    );
    const configPath = path.join(artifacts, 'candidate-playwright.config.ts');
    fs.writeFileSync(
        configPath,
        `import base from ${JSON.stringify(path.join(env.TESTPACK_ROOT, 'playwright.config'))};\n` +
            `const verification = ${JSON.stringify(prepared.config, null, 2)};\n` +
            'export default {...base, ...verification, use: {...base.use, ...verification.use}};\n',
        {flag: 'wx'},
    );
    // eslint-disable-next-line no-console
    console.log(
        `Serving candidate ${prepared.evidence.candidateSha} from ${prepared.evidence.corpus}`,
    );
    return prepared;
}

if (require.main === module) main();
module.exports = {inventoryCorpus, prepareBrowser};
