#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

const check = require('./downstream-check');

/**
 * Validate workflow data before checking out or running candidate code.
 * @param {Object} env Workflow input environment.
 * @returns {void} Throws if an input is invalid.
 */
function validateInputs(env) {
    const {REPOSITORY_NAME: repository, EXPECTED_SHA: sha, PROFILE: profile, PR_NUMBER: pr} = env;
    if (!/^[a-f0-9]{40}$/i.test(sha || '')) throw new Error('Invalid candidate SHA');
    if (!/^[a-z0-9-]+$/.test(repository || '') || !check.isSupportedPackage(repository))
        throw new Error('Unsupported repository');
    if (pr && !/^[1-9][0-9]*$/.test(pr)) throw new Error('Invalid PR number');
    if (!['document-transform', 'document-rendering', 'ecosystem'].includes(profile))
        throw new Error('Unsupported verification profile');
}

/**
 * Resolve all build revisions once, treating candidate manifests only as data.
 * @param {Object} env Validated workflow input environment.
 * @param {string} candidateRoot Candidate checkout directory.
 * @param {string} metapackageRoot Metapackage checkout directory.
 * @returns {Object} Registered package identity and exact baseline revisions.
 */
function resolveMetadata(
    env,
    candidateRoot = 'candidate-package',
    metapackageRoot = 'metapackage',
) {
    validateInputs(env);
    const head = (root) =>
        execFileSync('git', ['-C', root, 'rev-parse', '--verify', 'HEAD'], {
            encoding: 'utf8',
        }).trim();
    if (head(candidateRoot) !== env.EXPECTED_SHA.toLowerCase())
        throw new Error('Candidate checkout does not match expected SHA');
    const repository = env.REPOSITORY_NAME;
    const packagePath = check.PACKAGE_PATHS[repository];
    const manifest = JSON.parse(fs.readFileSync(path.join(candidateRoot, 'package.json'), 'utf8'));
    if (manifest.name !== check.PACKAGE_NAMES[repository])
        throw new Error(`Unexpected package name for ${repository}`);
    return {
        path: packagePath,
        name: manifest.name,
        baseSha: head(path.join(metapackageRoot, packagePath)),
        metapackageSha: head(metapackageRoot),
    };
}

function main(command, env = process.env) {
    if (command === 'validate') return validateInputs(env);
    if (command !== 'metadata') throw new Error('Expected validate or metadata command');
    const metadata = resolveMetadata(env);
    fs.appendFileSync(
        env.GITHUB_OUTPUT,
        `path=${metadata.path}\nname=${metadata.name}\nbase-sha=${metadata.baseSha}\nmetapackage-sha=${metadata.metapackageSha}\n`,
    );
    fs.appendFileSync(
        env.GITHUB_STEP_SUMMARY,
        `Candidate repository: \`${env.REPOSITORY_NAME}\`\n\nCandidate package: \`${metadata.name}\`\n\nSubmodule: \`${metadata.path}\`\n\nStandalone baseline SHA: \`${metadata.baseSha}\`\n\nMetapackage SHA: \`${metadata.metapackageSha}\`\n\n`,
    );
}

if (require.main === module) main(process.argv[2]);
module.exports = {validateInputs, resolveMetadata};
