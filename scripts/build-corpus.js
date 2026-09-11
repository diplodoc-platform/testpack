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
 * 2. Creates an isolated detached git worktree for the ref
 * 3. Runs `npm ci` (or `npm install` if no lockfile) + `npm run docs`
 * 4. Copies the `docs/output/` tree to the specified output directory
 * 5. Writes a metadata.json with the ref, SHA, timestamp, and node version
 * 6. Removes the temporary worktree
 *
 * The output directory structure mirrors `docs/output/`:
 *   <output>/output/          — full docs/output tree
 *   <output>/metadata.json    — build metadata
 *
 * @module scripts/build-corpus
 */

'use strict';

/* eslint-disable no-console -- CLI diagnostics are part of this script's interface. */

const {execFileSync} = require('child_process');
const fs = require('fs');
const os = require('os');
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
    return execFileSync('git', ['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`], {
        encoding: 'utf-8',
    }).trim();
}

/**
 * Recursively copy a directory.
 * @param {string} src - Source directory.
 * @param {string} dest - Destination directory.
 * @returns {void}
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
 * @returns {void}
 */
function rmrf(dir) {
    fs.rmSync(dir, {recursive: true, force: true});
}

/**
 * Write build metadata to a JSON file.
 * @param {string} outputDir - Output directory.
 * @param {string} ref - Original ref argument.
 * @param {string} sha - Resolved commit SHA.
 * @returns {void}
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
 * @returns {void}
 */
function buildCorpus(ref, outputDir) {
    const sha = resolveSha(ref);
    const destination = path.resolve(outputDir);
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'diplodoc-corpus-'));
    const worktree = path.join(tempRoot, 'worktree');
    try {
        execFileSync('git', ['worktree', 'add', '--detach', worktree, sha], {stdio: 'inherit'});

        if (fs.existsSync(path.join(worktree, 'package-lock.json'))) {
            execFileSync('npm', ['ci'], {cwd: worktree, stdio: 'inherit'});
        } else {
            execFileSync('npm', ['install'], {cwd: worktree, stdio: 'inherit'});
        }

        execFileSync('npm', ['run', 'docs'], {cwd: worktree, stdio: 'inherit'});

        rmrf(destination);
        const docsOutput = path.join(worktree, 'docs', 'output');
        if (fs.existsSync(docsOutput)) {
            copyDir(docsOutput, path.join(destination, 'output'));
        } else {
            throw new Error(`Corpus build produced no docs/output for ${sha}`);
        }

        writeMetadata(destination, ref, sha);
    } finally {
        if (fs.existsSync(worktree)) {
            execFileSync('git', ['worktree', 'remove', '--force', worktree], {stdio: 'pipe'});
        }
        fs.rmSync(tempRoot, {recursive: true, force: true});
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
    writeMetadata,
    buildCorpus,
};
