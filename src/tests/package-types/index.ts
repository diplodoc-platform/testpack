import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {spawnSync} from 'node:child_process';
import {expect, test} from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
    collectExportTargets,
    verifyPackageTargets,
} = require('../../../scripts/check-package-types');

test.describe('Package target verification', () => {
    test('collects nested conditional export targets', () => {
        expect(
            collectExportTargets({
                '.': {import: './build/index.mjs', require: './build/index.cjs'},
                './styles': './build/index.css',
            }),
        ).toEqual(['./build/index.mjs', './build/index.cjs', './build/index.css']);
    });

    test('reports missing declared entry points', () => {
        const packageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'diplodoc-package-targets-'));
        try {
            fs.writeFileSync(
                path.join(packageDir, 'package.json'),
                JSON.stringify({main: 'build/index.js', types: 'build/index.d.ts'}),
            );
            fs.mkdirSync(path.join(packageDir, 'build'));
            fs.writeFileSync(path.join(packageDir, 'build/index.js'), 'module.exports = {};');

            expect(verifyPackageTargets(packageDir)).toMatchObject({
                ok: false,
                missing: ['build/index.d.ts'],
            });
        } finally {
            fs.rmSync(packageDir, {recursive: true, force: true});
        }
    });

    test('accepts packages without public entry points', () => {
        const packageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'diplodoc-package-targets-'));
        try {
            fs.writeFileSync(
                path.join(packageDir, 'package.json'),
                JSON.stringify({private: true}),
            );
            expect(verifyPackageTargets(packageDir)).toMatchObject({ok: true, skipped: true});
        } finally {
            fs.rmSync(packageDir, {recursive: true, force: true});
        }
    });

    test('accepts unchanged missing targets but rejects new standalone export regressions', () => {
        const packageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'diplodoc-export-baseline-'));
        const script = path.resolve(__dirname, '../../../scripts/check-package-types.js');
        const baseline = path.join(packageDir, 'baseline.json');
        const output = path.join(packageDir, 'candidate.json');
        try {
            fs.writeFileSync(
                path.join(packageDir, 'package.json'),
                JSON.stringify({main: 'build/index.js', types: 'build/index.d.ts'}),
            );
            fs.mkdirSync(path.join(packageDir, 'build'));
            fs.writeFileSync(path.join(packageDir, 'build/index.js'), 'module.exports = {};');
            const reference = spawnSync(process.execPath, [
                script,
                '--package-dir',
                packageDir,
                '--output',
                baseline,
                '--allow-invalid',
            ]);
            expect(reference.status).toBe(0);
            const unchanged = spawnSync(process.execPath, [
                script,
                '--package-dir',
                packageDir,
                '--baseline',
                baseline,
                '--output',
                output,
            ]);
            expect(unchanged.status).toBe(0);
            expect(JSON.parse(fs.readFileSync(output, 'utf8'))).toEqual({
                ok: true,
                checked: ['build/index.d.ts', 'build/index.js'],
                missing: ['build/index.d.ts'],
                skipped: false,
                newMissing: [],
            });

            fs.unlinkSync(path.join(packageDir, 'build/index.js'));
            const regression = spawnSync(process.execPath, [
                script,
                '--package-dir',
                packageDir,
                '--baseline',
                baseline,
                '--output',
                output,
            ]);
            expect(regression.status).toBe(1);
            expect(JSON.parse(fs.readFileSync(output, 'utf8'))).toEqual({
                ok: false,
                checked: ['build/index.d.ts', 'build/index.js'],
                missing: ['build/index.d.ts', 'build/index.js'],
                skipped: false,
                newMissing: ['build/index.js'],
            });
        } finally {
            fs.rmSync(packageDir, {recursive: true, force: true});
        }
    });
});
