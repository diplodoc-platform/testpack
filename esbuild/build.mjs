#!/usr/bin/env node

import {build} from 'esbuild';
import {glob} from 'glob';

const outDir = 'build';

/** @type {import('esbuild').BuildOptions}*/
const common = {
    bundle: false,
    sourcemap: false,
    tsconfig: './tsconfig.json',
};

/** @type {import('esbuild').BuildOptions}*/
const config = {
    ...common,
    entryPoints: ['src/config/index.ts'],
    outfile: outDir + '/config/index.js',
    platform: 'node',
    packages: 'external',
};

/** @type {import('esbuild').BuildOptions}*/
const server = {
    ...common,
    entryPoints: ['src/server/index.ts'],
    outfile: outDir + '/server/index.js',
    platform: 'node',
    bundle: true,
};

/** @type {import('esbuild').BuildOptions}*/
const tests = {
    ...common,
    entryPoints: await glob('**/*.ts', {cwd: 'src/tests', absolute: true}),
    outdir: outDir + '/tests',
    platform: 'node',
};

build(config);
build(server);
build(tests);
