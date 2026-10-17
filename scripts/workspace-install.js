'use strict';

const fs = require('node:fs');
const path = require('node:path');

function inside(root, directory) {
    const real = fs.realpathSync(directory);
    if (!real.startsWith(root + path.sep)) throw new Error('Install path escapes its checkout');
    return real;
}

function copyBins(source, destination, packageDirectory, installed) {
    const bins =
        typeof installed.bin === 'string'
            ? {[installed.name.split('/').at(-1)]: installed.bin}
            : installed.bin || {};
    const namespace = (directory) => {
        const parent = path.dirname(directory);
        return path.basename(parent).startsWith('@') ? path.dirname(parent) : parent;
    };
    const sourceBin = path.join(namespace(packageDirectory), '.bin');
    const targetBin = path.join(namespace(destination), '.bin');
    for (const name of Object.keys(bins)) {
        if (!/^[a-z0-9][a-z0-9._-]*$/i.test(name)) throw new Error('Invalid executable name');
        for (const suffix of process.platform === 'win32' ? ['', '.cmd', '.ps1'] : ['']) {
            const file = path.join(sourceBin, name + suffix);
            if (!fs.existsSync(file)) continue;
            if (fs.lstatSync(file).isSymbolicLink()) {
                inside(source, file);
                const expected = path.resolve(packageDirectory, bins[name]);
                if (fs.realpathSync(file) !== fs.realpathSync(expected)) continue;
                if (path.isAbsolute(fs.readlinkSync(file)))
                    throw new Error('Absolute executable symlink is not relocatable');
            }
            fs.mkdirSync(targetBin, {recursive: true});
            fs.cpSync(file, path.join(targetBin, name + suffix), {verbatimSymlinks: true});
        }
    }
}

/**
 * Overlay the already-installed standalone tree in an isolated workspace.
 * npm may deduplicate an explicit nested lock entry to a newer hoisted version,
 * so lock seeding alone is insufficient. Never install inside a consumer or
 * delete its previous node_modules; retain the old directory under root's cache.
 * @param {string} workspaceRoot Isolated metapackage root.
 * @param {string} standaloneRoot Producer's own locked standalone installation.
 * @param {object} plan Validated package-local dependency plan.
 * @returns {void}
 */
function overlayLockedPackages(workspaceRoot, standaloneRoot, plan) {
    const root = fs.realpathSync(workspaceRoot);
    const source = fs.realpathSync(standaloneRoot);
    const selected = inside(root, path.join(root, plan.packagePath));
    const modules = inside(root, path.join(root, 'node_modules'));
    const staging = fs.mkdtempSync(path.join(modules, '.verification-next-'));
    const target = path.join(selected, 'node_modules');
    if (
        fs.existsSync(target) &&
        (!fs.lstatSync(target).isDirectory() || fs.lstatSync(target).isSymbolicLink())
    )
        throw new Error('Refusing to replace a non-directory workspace node_modules');
    for (const entry of plan.entries) {
        if (entry.mode !== 'locked') continue;
        const packageDirectory = inside(source, path.join(source, entry.path));
        const destination = path.join(staging, entry.path.slice('node_modules/'.length));
        fs.cpSync(packageDirectory, destination, {
            recursive: true,
            filter: (file) => {
                if (file === path.join(packageDirectory, 'node_modules')) return false;
                if (fs.lstatSync(file).isSymbolicLink())
                    throw new Error(`Unsupported package symlink: ${entry.path}`);
                return true;
            },
        });
        const installed = JSON.parse(
            fs.readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'),
        );
        copyBins(source, destination, packageDirectory, installed);
    }
    // Copying/validation completes before touching the current workspace install.
    if (fs.existsSync(target)) {
        const backup = fs.mkdtempSync(path.join(modules, '.verification-previous-'));
        fs.renameSync(target, path.join(backup, 'node_modules'));
    }
    fs.renameSync(staging, target);
}

module.exports = {overlayLockedPackages};
