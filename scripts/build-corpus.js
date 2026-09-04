#!/usr/bin/env node

/**
 * Build the reference document corpus at a specific git ref.
 *
 * Usage:
 *   node scripts/build-corpus.js --ref <sha-or-branch> --output <dir>
 *   node scripts/build-corpus.js --ref HEAD --output artifacts/actual/
 *   node scripts/build-corpus.js --ref ${BASE_SHA} --output artifacts/expected/
 *
 * This script:
 * 1. Resolves the git ref to a full commit SHA
 * 2. Stashes any uncommitted changes (restores on exit)
 * 3. Checks out the ref
 * 4. Runs `npm ci` (or `npm install` if no lockfile) + `npm run docs`
 * 5. Copies the `docs/output/` tree to the specified output directory
 * 6. Writes a metadata.json with the ref, SHA, timestamp, and node version
 * 7. Restores the original working tree state
 *
 * The output directory structure mirrors `docs/output/`:
 *   <output>/output/          — full docs/output tree
 *   <output>/metadata.json    — build metadata
 *
 * @module scripts/build-corpus
 */

'use strict';

const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Parse command-line arguments into a key-value map.
 * @returns {Record<string, string>}
 */
function parseArgs() {
    const args = {};
    const argv = process.argv.slice(2);
    for (let i = 0; i < argv.length; i++) {
        if (argv[i].startsWith('--')) {
            const key = argv[i].slice(2);
            const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
            args[key] = value;
        }
    }
    return args;
}

/**
 * Resolve a git ref to a full 40-character commit SHA.
 * @param {string} ref - Branch name, tag, or partial SHA.
 * @returns {string} Full commit SHA.
 */
function resolveSha(ref) {
    return execSync(`git rev-parse "${ref}"`, {encoding: 'utf-8'}).trim();
}

/**
 * Recursively copy a directory.
 * @param {string} src - Source directory.
 * @param {string} dest - Destination directory.
 */
function copyDir(src, dest) {
    fs.mkdirSync(dest, {recursive: true});
    const entries = fs.readdirSync(src, {withFileTypes: true});
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else if (entry.isFile()) {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Recursively remove a directory.
 * @param {string} dir - Directory to remove.
 */
function rmrf(dir) {
    fs.rmSync(dir, {recursive: true, force: true});
}

/**
 * Check whether there are uncommitted changes in the working tree.
 * @returns {boolean}
 */
function hasUncommittedChanges() {
    const status = execSync('git status --porcelain', {encoding: 'utf-8'}).trim();
    return status.length > 0;
}

/**
 * Stash uncommitted changes (if any) and return the stash result.
 * @returns {string|null} Stash reference or null if nothing was stashed.
 */
function stashChanges() {
    if (!hasUncommittedChanges()) return null;
    execSync('git stash push -u -m "build-corpus: auto-stash"', {stdio: 'pipe'});
    return execSync('git stash list --format=%gd -1', {encoding: 'utf-8'}).trim();
}

/**
 * Pop the most recent stash (if one was created).
 * @param {string|null} stashRef - Stash reference from stashChanges().
 */
function popStash(stashRef) {
    if (!stashRef) return;
    try {
        execSync(`git stash pop "${stashRef}"`, {stdio: 'pipe'});
    } catch {
        execSync(`git stash apply "${stashRef}"`, {stdio: 'pipe'});
    }
}

/**
 * Write build metadata to a JSON file.
 * @param {string} outputDir - Output directory.
 * @param {string} ref - Original ref argument.
 * @param {string} sha - Resolved commit SHA.
 */
function writeMetadata(outputDir, ref, sha) {
    const meta = {
        ref,
        sha,
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
    };
    fs.writeFileSync(
        path.join(outputDir, 'metadata.json'),
        JSON.stringify(meta, null, 2) + '\n',
        'utf-8',
    );
}

/**
 * Build the corpus at a given git ref and copy output to the target directory.
 * @param {string} ref - Git ref (branch, tag, SHA).
 * @param {string} outputDir - Destination directory for the corpus.
 */
function buildCorpus(ref, outputDir) {
    const sha = resolveSha(ref);
    const originalHead = execSync('git rev-parse HEAD', {encoding: 'utf-8'}).trim();

    const stash = stashChanges();
    try {
        execSync(`git checkout "${ref}"`, {stdio: 'inherit'});

        if (fs.existsSync('package-lock.json')) {
            execSync('npm ci', {stdio: 'inherit'});
        } else {
            execSync('npm install', {stdio: 'inherit'});
        }

        execSync('npm run docs', {stdio: 'inherit'});

        rmrf(outputDir);
        const docsOutput = path.join('docs', 'output');
        if (fs.existsSync(docsOutput)) {
            copyDir(docsOutput, path.join(outputDir, 'output'));
        }

        writeMetadata(outputDir, ref, sha);
    } finally {
        execSync(`git checkout "${originalHead}"`, {stdio: 'pipe'});
        popStash(stash);
    }
}

function main() {
    const args = parseArgs();
    const ref = args.ref;
    const output = args.output;

    if (!ref || !output) {
        console.error('Usage: build-corpus.js --ref <sha-or-branch> --output <dir>');
        process.exit(1);
    }

    buildCorpus(ref, output);
    console.log(`Corpus built from "${ref}" -> ${output}`);
}

if (require.main === module) {
    main();
}

module.exports = {
    parseArgs,
    resolveSha,
    copyDir,
    rmrf,
    hasUncommittedChanges,
    stashChanges,
    popStash,
    writeMetadata,
    buildCorpus,
};
