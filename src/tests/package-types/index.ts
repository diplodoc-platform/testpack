import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
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
});
