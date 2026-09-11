#!/usr/bin/env node

'use strict';

/* eslint-disable no-console -- CLI diagnostics are part of this script's interface. */

const fs = require('node:fs');
const path = require('node:path');

function collectExportTargets(value, targets = []) {
    if (typeof value === 'string') {
        if (value.startsWith('./')) targets.push(value);
        return targets;
    }
    if (!value || typeof value !== 'object') return targets;
    Object.values(value).forEach((entry) => collectExportTargets(entry, targets));
    return targets;
}

function verifyPackageTargets(packageDir) {
    const manifestPath = path.join(packageDir, 'package.json');
    if (!fs.existsSync(manifestPath)) {
        return {ok: false, checked: [], missing: ['package.json']};
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const targets = collectExportTargets(manifest.exports);
    for (const field of ['main', 'module', 'types', 'typings']) {
        if (typeof manifest[field] === 'string') {
            targets.push(manifest[field]);
        }
    }
    const checked = [...new Set(targets)].sort();
    const missing = checked.filter((target) => {
        if (!target.includes('*')) return !fs.existsSync(path.resolve(packageDir, target));
        const prefix = target.slice(0, target.indexOf('*')).replace(/\/$/, '');
        return !fs.existsSync(path.resolve(packageDir, prefix));
    });
    return {ok: missing.length === 0, checked, missing, skipped: checked.length === 0};
}

function main() {
    const args = process.argv.slice(2);
    const flagValue = (name) => {
        const index = args.indexOf(name);
        return index === -1 ? undefined : args[index + 1];
    };
    const packageFlagIndex = args.indexOf('--package-dir');
    const packageDir =
        packageFlagIndex === -1 ? process.cwd() : path.resolve(args[packageFlagIndex + 1]);
    const result = verifyPackageTargets(packageDir);
    const baselinePath = flagValue('--baseline');
    if (baselinePath) {
        const baseline = JSON.parse(fs.readFileSync(path.resolve(baselinePath), 'utf8'));
        const baselineMissing = new Set(baseline.missing || []);
        result.newMissing = result.missing.filter((target) => !baselineMissing.has(target));
        result.ok = result.newMissing.length === 0;
    }
    console.log(JSON.stringify(result, null, 2));
    const outputPath = flagValue('--output');
    if (outputPath) {
        const absoluteOutput = path.resolve(outputPath);
        fs.mkdirSync(path.dirname(absoluteOutput), {recursive: true});
        fs.writeFileSync(absoluteOutput, JSON.stringify(result, null, 2) + '\n');
    }
    if (!result.ok && !args.includes('--allow-invalid')) process.exit(1);
}

if (require.main === module) main();

module.exports = {collectExportTargets, verifyPackageTargets};
