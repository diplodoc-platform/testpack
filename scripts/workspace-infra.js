#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Expose installed infra to Playwright's local-only tsconfig loader.
 * Never install another version or replace an existing package/symlink.
 * @param {string} packageDir Workspace package directory.
 * @returns {string} Path of the existing or newly linked infra package.
 */
function exposeWorkspaceInfra(packageDir) {
    const local = path.resolve(packageDir, 'node_modules/@diplodoc/infra');
    // Node resolves hoisted workspace dependencies; Playwright's loader does not.
    const config = require.resolve('@diplodoc/infra/tsconfig.json', {paths: [packageDir]});
    if (fs.existsSync(local)) {
        if (!fs.existsSync(path.join(local, 'tsconfig.json')))
            throw new Error(`Existing infra package has no tsconfig: ${local}`);
        return local;
    }
    fs.mkdirSync(path.dirname(local), {recursive: true});
    fs.symlinkSync(path.dirname(config), local, 'junction');
    return local;
}

if (require.main === module) {
    if (!process.argv[2]) throw new Error('Expected workspace package directory');
    exposeWorkspaceInfra(path.resolve(process.argv[2]));
}

module.exports = {exposeWorkspaceInfra};
