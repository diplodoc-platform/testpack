#!/usr/bin/env node

'use strict';

// Lockfiles and installed package manifests are data; never import package code.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

const NAME = /^(?:@[a-z0-9._-]+\/)?[a-z0-9][a-z0-9._-]*$/i;
const VERSION = /^\d+\.\d+\.\d+(?:[-+][a-z0-9.+-]+)?$/i;

function validName(value) {
    return typeof value === 'string' && NAME.test(value);
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}

function lockNames(key) {
    if (!key.startsWith('node_modules/')) throw new Error(`Invalid lock path: ${key}`);
    const names = key.slice('node_modules/'.length).split('/node_modules/');
    if (names.some((name) => !validName(name))) throw new Error(`Invalid lock path: ${key}`);
    return names;
}

function checkLock(lock) {
    if (lock.lockfileVersion !== 3 || !lock.packages?.[''])
        throw new Error('Expected an npm v3 lockfile with root metadata');
}

function checkPackagePath(packagePath) {
    if (!/^(?:packages|extensions|devops)\/[a-z0-9][a-z0-9-]*$/.test(packagePath))
        throw new Error('Invalid workspace package path');
}

function checkedEntry(key, entry) {
    const names = lockNames(key);
    if (
        entry.link ||
        !VERSION.test(entry.version || '') ||
        (entry.name !== undefined && !validName(entry.name)) ||
        typeof entry.integrity !== 'string' ||
        !/^sha(?:512|256|1)-[a-z0-9+/=]+$/i.test(entry.integrity) ||
        typeof entry.resolved !== 'string' ||
        !entry.resolved.startsWith('https://')
    )
        throw new Error(`Unsupported locked package: ${key}`);
    return names;
}

// Resolve edges like Node's node_modules lookup, rather than matching by name:
// two instances of js-yaml can legitimately have different major versions.
function resolveLocked(packages, context, name) {
    if (!validName(name)) throw new Error(`Invalid dependency name: ${name}`);
    for (;;) {
        const key = `${context ? context + '/' : ''}node_modules/${name}`;
        if (Object.hasOwn(packages, key)) return key;
        const parent = context.lastIndexOf('/node_modules/');
        if (!context) return null;
        context = parent < 0 ? '' : context.slice(0, parent);
    }
}

function coveredPaths(packages, workspaces) {
    const covered = new Set();
    const edges = [];
    function visit(key) {
        const entry = packages[key];
        const dependencies = {
            ...entry.peerDependencies,
            ...entry.dependencies,
            ...(key === '' ? entry.devDependencies : {}),
            ...entry.optionalDependencies,
        };
        for (const name of Object.keys(dependencies)) {
            const resolved = resolveLocked(packages, key, name);
            if (!resolved) {
                if (Object.hasOwn(entry.optionalDependencies || {}, name)) continue;
                if (entry.peerDependenciesMeta?.[name]?.optional) continue;
                throw new Error(`Missing dependency in standalone lock: ${name} from ${key}`);
            }
            if (workspaces.has(name)) continue;
            edges.push({from: key, name, to: resolved});
            if (covered.has(resolved)) continue;
            covered.add(resolved);
            visit(resolved);
        }
    }
    visit('');
    return {covered, edges};
}

function lockMode(key, names, covered, workspaces) {
    if (covered.has(key)) return 'locked';
    if (names.some((item) => workspaces.has(item))) return 'workspace';
    return 'uncovered';
}

/**
 * Seed a package-local dependency tree without replacing other workspace links.
 * Both isolated producers use their own standalone lock, not each other's data.
 * @param {object} workspaceLock Current metapackage lockfile.
 * @param {object} standaloneLock Selected package's own lockfile.
 * @param {string} packagePath Registered workspace path.
 * @returns {object} Updated lockfile and expected resolution plan.
 */
function seedLock(workspaceLock, standaloneLock, packagePath) {
    checkLock(workspaceLock);
    checkLock(standaloneLock);
    checkPackagePath(packagePath);
    const local = workspaceLock.packages[packagePath];
    const root = standaloneLock.packages[''];
    if (!local || !validName(root.name || standaloneLock.name || ''))
        throw new Error('Missing workspace or standalone package identity');
    const name = root.name || standaloneLock.name;
    const link = workspaceLock.packages[`node_modules/${name}`];
    if (!link?.link || link.resolved !== packagePath)
        throw new Error('Selected package is not the registered workspace link');

    const workspaces = new Set();
    for (const [key, entry] of Object.entries(workspaceLock.packages)) {
        if (entry.link && key.startsWith('node_modules/')) {
            const names = lockNames(key);
            if (names.length === 1) workspaces.add(names[0]);
        }
    }
    const {covered, edges} = coveredPaths(standaloneLock.packages, workspaces);
    const entries = [];
    for (const [key, entry] of Object.entries(standaloneLock.packages)) {
        if (key === '') continue;
        const names = checkedEntry(key, entry);
        entries.push({
            path: key,
            name: entry.name || names[names.length - 1],
            version: entry.version,
            integrity: entry.integrity,
            resolved: entry.resolved,
            mode: lockMode(key, names, covered, workspaces),
            optional: Boolean(entry.optional || entry.devOptional),
        });
    }

    const lock = structuredClone(workspaceLock);
    const prefix = `${packagePath}/node_modules/`;
    // Only edit lockfile records beneath the selected workspace, never the filesystem.
    for (const key of Object.keys(lock.packages)) {
        if (key.startsWith(prefix)) delete lock.packages[key];
    }
    for (const entry of entries) {
        if (entry.mode === 'locked')
            lock.packages[`${packagePath}/${entry.path}`] = structuredClone(
                standaloneLock.packages[entry.path],
            );
    }
    const sourceDigest = createHash('sha256').update(JSON.stringify(standaloneLock)).digest('hex');
    return {
        lock,
        plan: {formatVersion: 1, packageName: name, packagePath, sourceDigest, entries, edges},
    };
}

function validatePlan(plan) {
    if (
        plan.formatVersion !== 1 ||
        !validName(plan.packageName) ||
        !/^[a-f0-9]{64}$/.test(plan.sourceDigest || '') ||
        !Array.isArray(plan.entries) ||
        !Array.isArray(plan.edges)
    )
        throw new Error('Invalid dependency resolution evidence');
    checkPackagePath(plan.packagePath);
    const seen = new Set();
    for (const entry of plan.entries) {
        checkedEntry(entry.path, entry);
        if (
            seen.has(entry.path) ||
            !validName(entry.name) ||
            !VERSION.test(entry.version || '') ||
            !['locked', 'workspace', 'uncovered', 'optional-unavailable'].includes(entry.mode) ||
            typeof entry.optional !== 'boolean' ||
            (entry.mode === 'optional-unavailable' && !entry.optional) ||
            typeof entry.resolved !== 'string' ||
            typeof entry.integrity !== 'string'
        )
            throw new Error('Invalid dependency resolution entry');
        seen.add(entry.path);
    }
    validateEdges(plan);
}

function validateEdges(plan) {
    const entries = new Map(plan.entries.map((entry) => [entry.path, entry]));
    const children = new Map();
    for (const edge of plan.edges) {
        if (
            (edge.from !== '' && !entries.has(edge.from)) ||
            !entries.has(edge.to) ||
            edge.name !== lockNames(edge.to).at(-1)
        )
            throw new Error('Invalid dependency resolution edge');
        if (!children.has(edge.from)) children.set(edge.from, []);
        children.get(edge.from).push(edge.to);
    }
    const reachable = new Set(['']);
    for (const key of reachable) {
        for (const child of children.get(key) || []) reachable.add(child);
    }
    for (const entry of plan.entries) {
        if (entry.mode === 'locked' && !reachable.has(entry.path))
            throw new Error(`Unreachable locked dependency: ${entry.path}`);
    }
}

function installedPackage(root, context, name) {
    if (context !== root && !context.startsWith(root + path.sep))
        throw new Error('Package context escapes the isolated workspace');
    for (;;) {
        if (path.basename(context) !== 'node_modules') {
            const candidate = path.join(context, 'node_modules', name);
            if (fs.existsSync(path.join(candidate, 'package.json'))) {
                const real = fs.realpathSync(candidate);
                if (!real.startsWith(root + path.sep))
                    throw new Error(`Dependency escapes the isolated workspace: ${name}`);
                return real;
            }
        }
        if (context === root) throw new Error(`Missing installed dependency: ${name}`);
        context = path.dirname(context);
    }
}

function checkInstalledEntry(root, directory, entry, lock) {
    const relative = path.relative(root, directory).split(path.sep).join('/');
    const installed = readJson(path.join(directory, 'package.json'));
    const record = lock.packages[relative];
    if (
        installed.name !== entry.name ||
        installed.version !== entry.version ||
        record?.version !== entry.version ||
        record?.integrity !== entry.integrity ||
        record?.resolved !== entry.resolved
    )
        throw new Error(
            `Installed dependency differs from standalone lock: ${entry.path} via ${relative}`,
        );
    return relative;
}

/**
 * Assert npm installed the seeded versions before accepting corpus evidence.
 * Reads package.json files directly, without require() or package entry points.
 * @param {object} plan Expected dependency tree from the standalone checkout.
 * @param {string} workspaceRoot Isolated metapackage directory.
 * @returns {object} Verified installed resolution evidence.
 */
function verifyInstall(plan, workspaceRoot) {
    validatePlan(plan);
    const root = fs.realpathSync(workspaceRoot);
    const lock = readJson(path.join(root, 'package-lock.json'));
    const expected = new Map(plan.entries.map((entry) => [entry.path, entry]));
    const children = new Map();
    for (const edge of plan.edges) {
        if (!children.has(edge.from)) children.set(edge.from, []);
        children.get(edge.from).push(edge);
    }
    const locations = new Map();
    const directory = fs.realpathSync(path.join(root, plan.packagePath));
    if (!directory.startsWith(root + path.sep))
        throw new Error('Selected package escapes the isolated workspace');
    const queue = [{key: '', directory}];
    // npm can retain a hoisted optional child while omitting its platform-specific
    // parent (for example a WASM fallback on macOS). Verify the retained package
    // and its own edges too; never silently omit it from installed evidence.
    for (const entry of plan.entries) {
        if (entry.mode !== 'locked' || !entry.optional) continue;
        const installed = fs.realpathSync(path.join(directory, entry.path));
        if (!installed.startsWith(root + path.sep))
            throw new Error('Optional dependency escapes the isolated workspace');
        const relative = checkInstalledEntry(root, installed, entry, lock);
        locations.set(entry.path, new Set([relative]));
        queue.push({key: entry.path, directory: installed});
    }
    const seen = new Set();
    for (const current of queue) {
        const identity = `${current.key}\0${current.directory}`;
        if (seen.has(identity)) continue;
        seen.add(identity);
        for (const edge of children.get(current.key) || []) {
            const entry = expected.get(edge.to);
            if (entry.mode === 'optional-unavailable') continue;
            if (entry.mode !== 'locked') throw new Error('Uncovered dependency edge');
            const directory = installedPackage(root, current.directory, edge.name);
            const relative = checkInstalledEntry(root, directory, entry, lock);
            if (!locations.has(entry.path)) locations.set(entry.path, new Set());
            locations.get(entry.path).add(relative);
            queue.push({key: entry.path, directory});
        }
    }
    const entries = plan.entries.map((entry) => {
        if (entry.mode !== 'locked') return {...entry};
        if (!locations.has(entry.path)) throw new Error(`Unverified dependency: ${entry.path}`);
        return {
            ...entry,
            installedVersion: entry.version,
            installedPaths: [...locations.get(entry.path)].sort(),
        };
    });
    return {...plan, entries};
}

/**
 * Reject a changed lock resolution hidden by a workspace or unavailable package.
 * @param {object} baseline Verified baseline resolution report.
 * @param {object} candidate Verified candidate resolution report.
 * @returns {object} Counts of compared and changed locked resolutions.
 */
function compareResolution(baseline, candidate) {
    for (const report of [baseline, candidate]) {
        validatePlan(report);
        for (const entry of report.entries) {
            if (
                entry.mode === 'locked' &&
                (entry.installedVersion !== entry.version ||
                    !Array.isArray(entry.installedPaths) ||
                    entry.installedPaths.length === 0 ||
                    entry.installedPaths.some(
                        (item) =>
                            typeof item !== 'string' ||
                            item.includes('\\') ||
                            item.split('/').some((part) => !part || part === '.' || part === '..'),
                    ))
            )
                throw new Error(`Unverified installed dependency: ${entry.path}`);
        }
    }
    if (
        baseline.packageName !== candidate.packageName ||
        baseline.packagePath !== candidate.packagePath
    )
        throw new Error('Dependency resolution package identity mismatch');
    const before = new Map(baseline.entries.map((entry) => [entry.path, entry]));
    const after = new Map(candidate.entries.map((entry) => [entry.path, entry]));
    const changes = [];
    for (const key of new Set([...before.keys(), ...after.keys()])) {
        const old = before.get(key);
        const current = after.get(key);
        const identity = (item) => item && `${item.version}|${item.integrity}|${item.resolved}`;
        if (identity(old) === identity(current)) continue;
        if ([old, current].some((item) => item && item.mode !== 'locked'))
            throw new Error(`Changed lock dependency is not covered by workspace: ${key}`);
        changes.push({path: key, from: old?.version || null, to: current?.version || null});
    }
    return {baseline: before.size, candidate: after.size, changed: changes.length, changes};
}

function main() {
    const {parseArgs, PACKAGE_PATHS, PACKAGE_NAMES} = require('./downstream-check');
    const args = parseArgs();
    const root = path.resolve(args.workspace || 'metapackage');
    if (!args.output) throw new Error('Missing resolution evidence output');
    if (args.command === 'verify') {
        writeJson(args.output, verifyInstall(readJson(args.plan), root));
        return;
    }
    if (
        args.command !== 'overlay' ||
        !args.standalone ||
        !Object.hasOwn(PACKAGE_PATHS, args.package)
    )
        throw new Error('Expected overlay or verify with registered package inputs');
    const standalone = path.resolve(args.standalone);
    const lock = readJson(path.join(standalone, 'package-lock.json'));
    if (lock.name !== PACKAGE_NAMES[args.package]) throw new Error('Unexpected lockfile identity');
    const result = seedLock(
        readJson(path.join(root, 'package-lock.json')),
        lock,
        PACKAGE_PATHS[args.package],
    );
    for (const entry of result.plan.entries) {
        if (
            entry.mode === 'locked' &&
            !fs.existsSync(path.join(standalone, entry.path, 'package.json'))
        ) {
            if (!entry.optional) throw new Error(`Missing standalone dependency: ${entry.path}`);
            entry.mode = 'optional-unavailable';
        }
    }
    const {overlayLockedPackages} = require('./workspace-install');
    overlayLockedPackages(root, standalone, result.plan);
    writeJson(path.join(root, 'package-lock.json'), result.lock);
    writeJson(args.output, result.plan);
}

if (require.main === module) main();
module.exports = {seedLock, verifyInstall, compareResolution};
