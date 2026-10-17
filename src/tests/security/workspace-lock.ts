import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {execFileSync} from 'child_process';
import {expect, test} from '@playwright/test';

/* eslint-disable @typescript-eslint/no-require-imports */
const {seedLock, verifyInstall, compareResolution} = require('../../../scripts/workspace-lock');
const {overlayLockedPackages} = require('../../../scripts/workspace-install');
/* eslint-enable @typescript-eslint/no-require-imports */

type PackageRecord = {
    name?: string;
    version?: string;
    resolved?: string;
    integrity?: string;
    dependencies?: Record<string, string>;
    bin?: Record<string, string>;
    link?: boolean;
};

const writeJson = (file: string, value: unknown) => {
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
};

const locked = (name: string, version: string): PackageRecord => ({
    version,
    resolved: `https://registry.npmjs.org/${name}/-/${name}-${version}.tgz`,
    integrity: 'sha512-Zml4dHVyZQ==',
});

function fixture() {
    const manifest = {
        name: 'lock-candidate',
        version: '1.0.0',
        dependencies: {'lock-leaf': '^1.0.0', 'lock-parent': '1.0.0', 'lock-workspace': '*'},
    };
    const meta = {
        name: 'lock-metapackage',
        version: '1.0.0',
        private: true,
        workspaces: ['packages/*'],
        dependencies: {'lock-leaf': '1.0.0', 'lock-parent': '1.0.0'},
    };
    const shared = {name: 'lock-workspace', version: '1.0.0'};
    const parent = {...locked('lock-parent', '1.0.0'), dependencies: {'lock-leaf': '^2.0.0'}};
    const workspace = {
        name: meta.name,
        version: meta.version,
        lockfileVersion: 3,
        requires: true,
        packages: {
            '': meta,
            'packages/candidate': manifest,
            'packages/shared': shared,
            'node_modules/lock-candidate': {link: true, resolved: 'packages/candidate'},
            'node_modules/lock-workspace': {link: true, resolved: 'packages/shared'},
            'node_modules/lock-leaf': locked('lock-leaf', '1.0.0'),
            'node_modules/lock-parent': parent,
            'node_modules/lock-parent/node_modules/lock-leaf': locked('lock-leaf', '2.0.0'),
        },
    };
    const standalone = {
        name: manifest.name,
        version: manifest.version,
        lockfileVersion: 3,
        requires: true,
        packages: {
            '': manifest,
            'node_modules/lock-leaf': locked('lock-leaf', '1.0.1'),
            'node_modules/lock-parent': parent,
            'node_modules/lock-parent/node_modules/lock-leaf': locked('lock-leaf', '2.0.1'),
            'node_modules/lock-workspace': locked('lock-workspace', '1.0.0'),
        },
    };
    return {manifest, meta, shared, workspace, standalone};
}

test.describe('Workspace locked dependency verification', () => {
    test('scopes exact direct and nested versions without replacing other workspaces', () => {
        const {workspace, standalone} = fixture();
        Object.assign(workspace.packages, {
            'packages/candidate/node_modules/lock-leaf': locked('lock-leaf', '1.0.0'),
        });
        const before = structuredClone(workspace);
        const result = seedLock(workspace, standalone, 'packages/candidate');
        expect(result.lock.packages['packages/candidate/node_modules/lock-leaf']).toEqual(
            locked('lock-leaf', '1.0.1'),
        );
        expect(
            result.lock.packages[
                'packages/candidate/node_modules/lock-parent/node_modules/lock-leaf'
            ],
        ).toEqual(locked('lock-leaf', '2.0.1'));
        expect(result.lock.packages['node_modules/lock-leaf']).toEqual(
            workspace.packages['node_modules/lock-leaf'],
        );
        expect(result.lock.packages['node_modules/lock-workspace']).toEqual({
            link: true,
            resolved: 'packages/shared',
        });
        expect(result.lock.packages['packages/candidate/node_modules/lock-workspace']).toBe(
            undefined,
        );
        expect(workspace).toEqual(before);
    });

    test('rejects lock path traversal, local links and unsupported lock formats', () => {
        for (const key of [
            'node_modules/../../outside',
            'node_modules/a/../outside',
            '../escape',
        ]) {
            const {workspace, standalone} = fixture();
            Object.assign(standalone.packages, {[key]: locked('escape', '1.0.0')});
            expect(() => seedLock(workspace, standalone, 'packages/candidate')).toThrow(
                'Invalid lock path',
            );
        }
        const {workspace, standalone} = fixture();
        expect(() => seedLock(workspace, standalone, '../../outside')).toThrow(
            'Invalid workspace package path',
        );
        expect(() =>
            seedLock(workspace, {...standalone, lockfileVersion: 1}, 'packages/candidate'),
        ).toThrow('Expected an npm v3 lockfile');
        standalone.packages['node_modules/lock-leaf'].resolved = 'file:/tmp/untrusted';
        expect(() => seedLock(workspace, standalone, 'packages/candidate')).toThrow(
            'Unsupported locked package',
        );
    });

    test('rejects unverified versions and changes hidden behind workspace replacement', () => {
        const {workspace, standalone} = fixture();
        const {plan} = seedLock(workspace, standalone, 'packages/candidate');
        const verified = {
            ...plan,
            entries: plan.entries.map((entry: {path: string; version: string}) => ({
                ...entry,
                installedVersion: entry.version,
                installedPaths: [`packages/candidate/${entry.path}`],
            })),
        };
        expect(() => compareResolution(plan, verified)).toThrow('Unverified installed dependency');
        const changed = structuredClone(verified);
        const entry = changed.entries.find(
            (item: {name: string}) => item.name === 'lock-workspace',
        );
        entry.version = '1.0.1';
        expect(() => compareResolution(verified, changed)).toThrow(
            'Changed lock dependency is not covered by workspace',
        );
        expect(compareResolution(verified, verified)).toEqual({
            baseline: 4,
            candidate: 4,
            changed: 0,
            changes: [],
        });
    });

    test('does not claim coverage for hoisted packages reached only through a replaced workspace', () => {
        const {workspace, standalone} = fixture();
        Object.assign(standalone.packages, {
            'node_modules/lock-workspace': {
                ...locked('lock-workspace', '1.0.0'),
                dependencies: {'lock-hidden': '^1.0.0'},
            },
            'node_modules/lock-hidden': locked('lock-hidden', '1.0.0'),
        });
        const {lock, plan} = seedLock(workspace, standalone, 'packages/candidate');
        expect(lock.packages['packages/candidate/node_modules/lock-hidden']).toBeUndefined();
        const report = {
            ...plan,
            entries: plan.entries.map((entry: {path: string; version: string}) => ({
                ...entry,
                installedVersion: entry.version,
                installedPaths: [`packages/candidate/${entry.path}`],
            })),
        };
        const changed = structuredClone(report);
        const hidden = changed.entries.find(
            (entry: {name: string}) => entry.name === 'lock-hidden',
        );
        expect(hidden.mode).toBe('uncovered');
        hidden.version = '1.0.1';
        expect(() => compareResolution(report, changed)).toThrow('not covered by workspace');
    });

    test('both producers overlay their own locked versions before builds and require final evidence', () => {
        const workflow = fs.readFileSync(
            path.join(__dirname, '../../../.github/workflows/downstream-check.yml'),
            'utf8',
        );
        for (const [role, producer] of [
            ['base', 'baseline'],
            ['candidate', 'candidate'],
        ]) {
            expect(workflow).toContain(`--standalone "$GITHUB_WORKSPACE/${producer}-package"`);
            expect(workflow).toContain(
                `--output "$GITHUB_WORKSPACE/artifacts/${role}-lock-plan.json"`,
            );
            expect(workflow).toContain(`--output artifacts/${role}-dependency-resolution.json`);
        }
        expect(workflow).toMatch(
            /npm ci[\s\S]+?--command overlay[\s\S]+?--command verify[\s\S]+?- name: Build base testpack/,
        );
        expect(workflow).toMatch(
            /- name: Recheck candidate resolutions[\s\S]+?- name: Upload isolated candidate evidence/,
        );
    });

    test('a failed overlay preserves the previous local install and lockfile', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'testpack-lock-overlay-failure-'));
        const source = path.join(root, 'source');
        const {workspace, standalone} = fixture();
        const {plan} = seedLock(workspace, standalone, 'packages/candidate');
        const sentinel = path.join(root, 'packages/candidate/node_modules/keep.txt');
        try {
            fs.mkdirSync(path.dirname(sentinel), {recursive: true});
            fs.writeFileSync(sentinel, 'preserve');
            fs.mkdirSync(path.join(root, 'node_modules'));
            writeJson(path.join(root, 'package-lock.json'), workspace);
            for (const entry of plan.entries) {
                if (entry.mode !== 'locked') continue;
                writeJson(path.join(source, entry.path, 'package.json'), {
                    name: entry.name,
                    version: entry.version,
                });
            }
            fs.symlinkSync(
                path.dirname(sentinel),
                path.join(source, 'node_modules/lock-leaf/escape'),
                'junction',
            );
            expect(() => overlayLockedPackages(root, source, plan)).toThrow(
                'Unsupported package symlink',
            );
            expect(fs.readFileSync(sentinel, 'utf8')).toBe('preserve');
            expect(
                JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8')),
            ).toEqual(workspace);
        } finally {
            fs.rmSync(root, {recursive: true, force: true});
        }
    });

    test('a real offline locked overlay preserves direct, nested and aliased versions after hoisting', () => {
        test.setTimeout(120_000);
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'testpack-lock-install-'));
        const {workspace, standalone, meta, manifest, shared} = fixture();
        Object.assign(meta.dependencies, {'lock-stable': '1.0.0', 'lock-leaf': '1.0.2'});
        Object.assign(manifest.dependencies, {
            'lock-stable': '^1.0.0',
            'lock-alias': 'npm:lock-leaf@^1.0.0',
            '@fixture/tool': '1.0.0',
        });
        Object.assign(workspace.packages, {
            'node_modules/lock-stable': locked('lock-stable', '1.0.0'),
            'node_modules/lock-leaf': locked('lock-leaf', '1.0.2'),
            'node_modules/lock-alias': {...locked('lock-leaf', '1.0.0'), name: 'lock-leaf'},
            'node_modules/@fixture/tool': locked('@fixture/tool', '1.0.0'),
        });
        Object.assign(standalone.packages, {
            'node_modules/lock-stable': locked('lock-stable', '1.0.0'),
            'node_modules/lock-alias': {...locked('lock-leaf', '1.0.1'), name: 'lock-leaf'},
            'node_modules/@fixture/tool': locked('@fixture/tool', '1.0.0'),
        });
        const npm = (args: string[], cwd = root) =>
            execFileSync('npm', args, {
                cwd,
                encoding: 'utf8',
                shell: process.platform === 'win32',
                env: {
                    ...process.env,
                    npm_config_cache: path.join(root, 'npm-cache'),
                    npm_config_offline: 'true',
                    npm_config_ignore_scripts: 'true',
                    npm_config_audit: 'false',
                    npm_config_fund: 'false',
                },
            });
        try {
            const records = new Map<string, PackageRecord>();
            for (const [name, version, dependencies] of [
                ['lock-leaf', '1.0.0', {}],
                ['lock-leaf', '1.0.1', {}],
                ['lock-leaf', '1.0.2', {}],
                ['lock-leaf', '2.0.0', {}],
                ['lock-leaf', '2.0.1', {}],
                ['lock-stable', '1.0.0', {}],
                ['lock-workspace', '1.0.0', {}],
                ['@fixture/tool', '1.0.0', {}],
                ['lock-parent', '1.0.0', {'lock-leaf': '^2.0.0'}],
            ] as [string, string, Record<string, string>][]) {
                const directory = path.join(root, 'sources', `${name}-${version}`);
                const bin = name === '@fixture/tool' ? {'locked-tool': 'index.js'} : undefined;
                writeJson(path.join(directory, 'package.json'), {
                    name,
                    version,
                    main: 'index.js',
                    dependencies,
                    bin,
                });
                fs.writeFileSync(
                    path.join(directory, 'index.js'),
                    'throw new Error("Dependency code must not run during lock verification");\n',
                );
                const [pack] = JSON.parse(npm(['pack', '--json'], directory));
                npm(['cache', 'add', path.join(directory, pack.filename)]);
                records.set(`${name}@${version}`, {
                    ...locked(name, version),
                    integrity: pack.integrity,
                    ...(Object.keys(dependencies).length ? {dependencies} : {}),
                    ...(bin ? {bin} : {}),
                });
            }
            for (const lock of [workspace, standalone]) {
                for (const [key, entry] of Object.entries(lock.packages)) {
                    if (!key.startsWith('node_modules/') || !('version' in entry)) continue;
                    const name = 'name' in entry ? entry.name : key.split('node_modules/').pop();
                    const record = records.get(`${name}@${entry.version}`);
                    if (record) Object.assign(entry, record);
                }
            }
            writeJson(path.join(root, 'package.json'), meta);
            writeJson(path.join(root, 'packages/candidate/package.json'), manifest);
            writeJson(path.join(root, 'packages/shared/package.json'), shared);
            writeJson(path.join(root, 'package-lock.json'), workspace);
            npm(['ci', '--offline', '--ignore-scripts']);
            const {lock, plan} = seedLock(workspace, standalone, 'packages/candidate');
            // The previous green-but-uncovered scenario must now fail closed.
            expect(() => verifyInstall(plan, root)).toThrow();

            const source = path.join(root, 'standalone');
            writeJson(path.join(source, 'package.json'), manifest);
            writeJson(path.join(source, 'package-lock.json'), standalone);
            npm(['ci', '--offline', '--ignore-scripts', '--no-workspaces'], source);
            const sentinel = path.join(root, 'packages/candidate/node_modules/keep.txt');
            fs.mkdirSync(path.dirname(sentinel), {recursive: true});
            fs.writeFileSync(sentinel, 'original install');
            overlayLockedPackages(root, source, plan);
            const backups = fs
                .readdirSync(path.join(root, 'node_modules'))
                .filter((name) => name.startsWith('.verification-previous-'));
            expect(backups).toHaveLength(1);
            expect(
                fs.readFileSync(
                    path.join(root, 'node_modules', backups[0], 'node_modules/keep.txt'),
                    'utf8',
                ),
            ).toBe('original install');
            writeJson(path.join(root, 'package-lock.json'), lock);
            const report = verifyInstall(plan, root);
            expect(
                report.entries.map(
                    (entry: {path: string; mode: string; installedVersion?: string}) => ({
                        path: entry.path,
                        mode: entry.mode,
                        installedVersion: entry.installedVersion,
                    }),
                ),
            ).toEqual([
                {path: 'node_modules/lock-leaf', mode: 'locked', installedVersion: '1.0.1'},
                {path: 'node_modules/lock-parent', mode: 'locked', installedVersion: '1.0.0'},
                {
                    path: 'node_modules/lock-parent/node_modules/lock-leaf',
                    mode: 'locked',
                    installedVersion: '2.0.1',
                },
                {
                    path: 'node_modules/lock-workspace',
                    mode: 'workspace',
                    installedVersion: undefined,
                },
                {path: 'node_modules/lock-stable', mode: 'locked', installedVersion: '1.0.0'},
                {path: 'node_modules/lock-alias', mode: 'locked', installedVersion: '1.0.1'},
                {path: 'node_modules/@fixture/tool', mode: 'locked', installedVersion: '1.0.0'},
            ]);
            expect(
                fs.existsSync(
                    path.join(
                        root,
                        'packages/candidate/node_modules/.bin',
                        process.platform === 'win32' ? 'locked-tool.cmd' : 'locked-tool',
                    ),
                ),
            ).toBe(true);
            expect(fs.realpathSync(path.join(root, 'node_modules/lock-workspace'))).toBe(
                fs.realpathSync(path.join(root, 'packages/shared')),
            );
            const localStable = path.join(root, 'packages/candidate/node_modules/lock-stable');
            if (fs.existsSync(localStable))
                fs.renameSync(localStable, path.join(root, 'saved-stable'));
            expect(
                verifyInstall(plan, root).entries.find(
                    (entry: {name: string}) => entry.name === 'lock-stable',
                ).installedPaths,
            ).toEqual(['node_modules/lock-stable']);
            writeJson(path.join(root, 'packages/candidate/node_modules/lock-leaf/package.json'), {
                name: 'lock-leaf',
                version: '1.0.0',
            });
            expect(() => verifyInstall(plan, root)).toThrow('differs from standalone lock');
        } finally {
            fs.rmSync(root, {recursive: true, force: true});
        }
    });
});
