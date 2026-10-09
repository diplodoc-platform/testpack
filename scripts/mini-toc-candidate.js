#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {createRequire} = require('node:module');

const {inventoryCorpus, prepareBrowser} = require('./candidate-browser');

const digest = (data) => createHash('sha256').update(data).digest('hex');
const revision = (root) =>
    execFileSync('git', ['-C', root, 'rev-parse', '--verify', 'HEAD'], {encoding: 'utf8'}).trim();

/**
 * Require full immutable source identities before building or serving a corpus.
 * @param {Object} env Workflow environment
 * @returns {void}
 */
function validatePins(env) {
    for (const name of ['METAPACKAGE_SHA', 'COMPONENTS_SHA'])
        if (!/^[a-f0-9]{40}$/.test(env[name] || '')) throw new Error(`Invalid ${name}`);
}

/**
 * Prove the client bundle contains the exact compiled components selector.
 * @param {string} clientRoot Built client directory
 * @param {string} compiledSelector Built components selector module
 * @param {string} htmlRoot Frozen HTML corpus directory
 * @returns {Array<object>} Bundles referenced by the Components document
 */
function findBundleProof(clientRoot, compiledSelector, htmlRoot) {
    // Inventory the page's runtime references independently of the source maps.
    const expected = fs.readFileSync(compiledSelector, 'utf8');
    const html = fs.readFileSync(path.join(htmlRoot, 'ru/syntax/components.html'), 'utf8');
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
    const files = inventoryCorpus(htmlRoot);
    const bundles = [];
    const candidates = [];

    // Match exact compiled selector text, bundle bytes and a real script reference.
    for (const name of fs.readdirSync(clientRoot).sort()) {
        if (!name.endsWith('.js.map')) continue;
        const mapPath = path.join(clientRoot, name);
        const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
        const index = map.sources.findIndex((source) =>
            source
                .replace(/\\/g, '/')
                .endsWith('/SubNavigation/hooks/selectIntersectingHeading.js'),
        );
        if (index < 0) continue;
        assert.equal(map.sourcesContent[index], expected, 'Client embeds a different selector');
        const jsName = name.slice(0, -4);
        const sha256 = digest(fs.readFileSync(path.join(clientRoot, jsName)));
        const served = files.filter(
            (file) => file.sha256 === sha256 && scripts.includes(file.path),
        );
        candidates.push({
            jsName,
            sha256,
            matchingFiles: files.filter((file) => file.sha256 === sha256).map((file) => file.path),
        });
        for (const file of served)
            bundles.push({
                path: file.path,
                sha256,
                source: map.sources[index],
                mapSha256: digest(fs.readFileSync(mapPath)),
            });
    }
    assert.ok(
        bundles.length > 0,
        `No candidate selector in served client source maps; bundles not referenced: ${JSON.stringify({candidates, scripts})}`,
    );
    return bundles;
}

/**
 * Bind source revisions, workspace resolution, compiled code and corpus digests.
 * @param {Object} env Build workflow environment
 * @returns {Object} Recorded proof
 */
function recordProof(env) {
    // Validate source identities and workspace resolution before trusting outputs.
    validatePins(env);
    const root = fs.realpathSync(env.METAPACKAGE_ROOT);
    const corpus = fs.realpathSync(env.CORPUS_ROOT);
    const components = path.join(root, 'packages/components');
    const client = path.join(root, 'packages/client');
    const cli = path.join(root, 'packages/cli');
    assert.equal(revision(root), env.METAPACKAGE_SHA);
    assert.equal(revision(components), env.COMPONENTS_SHA);
    const clientRequire = createRequire(path.join(client, 'package.json'));
    const cliRequire = createRequire(path.join(cli, 'package.json'));
    assert.equal(
        fs.realpathSync(clientRequire.resolve('@diplodoc/components')),
        path.join(components, 'build/cjs/index.js'),
    );
    assert.equal(
        fs.realpathSync(cliRequire.resolve('@diplodoc/client/ssr')),
        path.join(client, 'build/server/app.js'),
    );
    assert.equal(
        fs.realpathSync(cliRequire.resolve('@diplodoc/client/manifest')),
        path.join(client, 'build/client/manifest.json'),
    );

    // Bind the reviewed TypeScript selector to its freshly compiled module.
    const selector = 'src/components/SubNavigation/hooks/selectIntersectingHeading.ts';
    const compiled = path.join(
        components,
        'build/esm/components/SubNavigation/hooks/selectIntersectingHeading.js',
    );
    const selectorMap = JSON.parse(fs.readFileSync(`${compiled}.map`, 'utf8'));
    assert.ok(
        selectorMap.sourcesContent.includes(
            fs.readFileSync(path.join(components, selector), 'utf8'),
        ),
        'Compiled selector does not match source',
    );
    const htmlRoot = path.join(corpus, 'html/output');
    const htmlFiles = inventoryCorpus(htmlRoot);

    // Keep the exact build inputs needed to diagnose a failed binding, too.
    const debug = path.join(corpus, 'proof');
    fs.mkdirSync(debug);
    fs.copyFileSync(compiled, path.join(debug, 'selectIntersectingHeading.js'));
    fs.copyFileSync(`${compiled}.map`, path.join(debug, 'selectIntersectingHeading.js.map'));
    for (const name of fs.readdirSync(path.join(client, 'build/client')))
        if (name.endsWith('.js') || name.endsWith('.js.map'))
            fs.copyFileSync(path.join(client, 'build/client', name), path.join(debug, name));

    // Write replayable source, runtime and complete corpus identities.
    const proof = {
        metapackageSha: env.METAPACKAGE_SHA,
        componentsSha: env.COMPONENTS_SHA,
        clientSha: revision(client),
        cliSha: revision(cli),
        fixtureSha: revision(path.join(root, 'devops/testpack')),
        selectorSha256: digest(fs.readFileSync(path.join(components, selector))),
        compiledSelectorSha256: digest(fs.readFileSync(compiled)),
        bundles: findBundleProof(path.join(client, 'build/client'), compiled, htmlRoot),
        htmlFiles,
        corpusSha256: digest(JSON.stringify(htmlFiles)),
    };
    fs.copyFileSync(path.join(root, 'package-lock.json'), path.join(corpus, 'workspace-lock.json'));
    fs.writeFileSync(path.join(corpus, 'source-proof.json'), JSON.stringify(proof, null, 2), {
        flag: 'wx',
    });
    return proof;
}

/**
 * Validate downloaded data and configure the server without rebuilding docs.
 * @param {Object} env Windows workflow environment
 * @returns {Object} Browser configuration and evidence
 */
function prepareCandidateBrowser(env) {
    // Reject foreign source pins before inspecting the downloaded corpus.
    validatePins(env);
    if (!path.isAbsolute(env.CANDIDATE_PROOF || ''))
        throw new Error('Missing absolute CANDIDATE_PROOF');
    const proof = JSON.parse(fs.readFileSync(env.CANDIDATE_PROOF, 'utf8'));
    assert.equal(proof.componentsSha, env.COMPONENTS_SHA);
    assert.equal(proof.metapackageSha, env.METAPACKAGE_SHA);

    // Require complete producer/consumer inventory equality before starting a server.
    const prepared = prepareBrowser({...env, PR_SHA: env.COMPONENTS_SHA});
    assert.deepEqual(
        prepared.evidence.files,
        proof.htmlFiles,
        'Downloaded corpus differs from producer',
    );
    assert.equal(prepared.evidence.corpusSha256, proof.corpusSha256);
    assert.ok(proof.bundles.length > 0, 'Missing candidate bundle identity');
    for (const bundle of proof.bundles)
        assert.ok(
            proof.htmlFiles.some(
                (file) => file.path === bundle.path && file.sha256 === bundle.sha256,
            ),
            'Bundle outside verified corpus',
        );
    return {proof, prepared};
}

function main(command, env = process.env) {
    if (command === 'validate') return validatePins(env);
    if (command === 'record') return recordProof(env);
    if (command !== 'browser') throw new Error('Expected validate, record or browser command');

    // Preserve source proof separately from reports produced by browser attempts.
    const {proof, prepared} = prepareCandidateBrowser(env);
    const output = env.BROWSER_ARTIFACTS;
    fs.mkdirSync(output, {recursive: true});
    fs.writeFileSync(path.join(output, 'source-proof.json'), JSON.stringify(proof, null, 2), {
        flag: 'wx',
    });
    fs.writeFileSync(
        path.join(output, 'candidate-browser.json'),
        JSON.stringify(prepared.evidence, null, 2),
        {flag: 'wx'},
    );

    // Serve the frozen corpus; do not rebuild documentation with published packages.
    const overrides = {
        testDir: prepared.config.testDir,
        outputDir: path.join(output, 'results'),
        webServer: prepared.config.webServer,
        updateSnapshots: 'none',
    };
    fs.writeFileSync(
        path.join(output, 'candidate-playwright.config.ts'),
        `import base from ${JSON.stringify(path.join(env.TESTPACK_ROOT, 'playwright.mini-toc.config'))};\n` +
            `export default {...base, ...${JSON.stringify(overrides)}};\n`,
        {flag: 'wx'},
    );

    // The bundle identity step must not share report/output paths with the suite.
    const identity = {
        ...overrides,
        testMatch: 'mini-toc-candidate.spec.ts',
        outputDir: path.join(output, 'identity-results'),
        reporter: [['json', {outputFile: path.join(output, 'identity-results.json')}], ['line']],
    };
    fs.writeFileSync(
        path.join(output, 'candidate-identity.config.ts'),
        `import base from ${JSON.stringify(path.join(env.TESTPACK_ROOT, 'playwright.mini-toc.config'))};\n` +
            `export default {...base, ...${JSON.stringify(identity)}};\n`,
        {flag: 'wx'},
    );
    return prepared;
}

if (require.main === module) main(process.argv[2]);
module.exports = {validatePins, findBundleProof, prepareCandidateBrowser, main};
