#!/usr/bin/env node

/**
 * Validate a result produced by the real internal Arcadia CI bridge.
 *
 * This public repository cannot run Arcadia builds. Absence of external
 * evidence is therefore UNVERIFIED and fails closed; it is never represented
 * as a successful dry-run.
 */

'use strict';

/* eslint-disable no-console -- CLI diagnostics are part of this script's interface. */

const fs = require('fs');
const path = require('path');

const ARCADIA_PACKAGES = ['transform', 'components', 'cli'];
const TERMINAL_STATUSES = new Set(['success', 'failure']);

function parseArgs(argv = process.argv.slice(2)) {
    const args = {};
    for (let index = 0; index < argv.length; index++) {
        if (!argv[index].startsWith('--')) continue;
        const key = argv[index].slice(2);
        const next = argv[index + 1];
        args[key] = next && !next.startsWith('--') ? argv[++index] : 'true';
    }
    return args;
}

function isArcadiaPackage(packageName) {
    return ARCADIA_PACKAGES.includes(packageName);
}

function unverifiedResult(packageName, prSha, reason) {
    return {
        package: packageName || '',
        prSha: prSha || '',
        status: 'unverified',
        verified: false,
        passed: false,
        evidenceUrl: '',
        consumers: [],
        errors: [reason],
    };
}

// The explicit checks are intentionally kept together as the external trust boundary.
// eslint-disable-next-line complexity
function validateExternalResult(payload, expected = {}) {
    const errors = [];
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return unverifiedResult(
            expected.package,
            expected.prSha,
            'External result is not an object',
        );
    }
    if (!isArcadiaPackage(payload.package)) errors.push('Unknown package in external result');
    if (expected.package && payload.package !== expected.package)
        errors.push('Package does not match request');
    if (!/^[0-9a-f]{40}$/i.test(payload.prSha || ''))
        errors.push('prSha must be a full commit SHA');
    if (expected.prSha && payload.prSha !== expected.prSha)
        errors.push('prSha does not match request');
    if (!TERMINAL_STATUSES.has(payload.status)) errors.push('Status must be success or failure');
    if (payload.provider !== 'arcadia-ci') errors.push('Provider must be arcadia-ci');
    if (!/^https:\/\//.test(payload.evidenceUrl || ''))
        errors.push('HTTPS evidenceUrl is required');
    if (!Array.isArray(payload.consumers) || payload.consumers.length === 0) {
        errors.push('At least one real Arcadia consumer result is required');
    }

    const consumers = Array.isArray(payload.consumers) ? payload.consumers : [];
    for (const consumer of consumers) {
        if (!consumer || typeof consumer.name !== 'string' || consumer.name.length === 0) {
            errors.push('Every consumer must have a name');
            continue;
        }
        if (!['success', 'failure'].includes(consumer.build)) {
            errors.push(`${consumer.name}: build must be success or failure`);
        }
        if (!['success', 'failure'].includes(consumer.tests)) {
            errors.push(`${consumer.name}: tests must be success or failure`);
        }
    }

    const consumersPassed =
        consumers.length > 0 &&
        consumers.every((consumer) => {
            return consumer.build === 'success' && consumer.tests === 'success';
        });
    const verified = errors.length === 0;
    return {
        package: payload.package || expected.package || '',
        prSha: payload.prSha || expected.prSha || '',
        status: verified ? payload.status : 'unverified',
        verified,
        passed: verified && payload.status === 'success' && consumersPassed,
        evidenceUrl: payload.evidenceUrl || '',
        consumers,
        errors,
    };
}

function renderReport(result) {
    const lines = [
        '# Arcadia External Check Report',
        '',
        `- Package: \`${result.package || 'unknown'}\``,
        `- PR SHA: \`${result.prSha || 'unknown'}\``,
        `- Verification: **${result.verified ? 'VERIFIED' : 'UNVERIFIED'}**`,
        `- Result: **${result.passed ? 'PASSED' : 'FAILED'}**`,
    ];
    if (result.evidenceUrl) lines.push(`- Evidence: ${result.evidenceUrl}`);
    lines.push('');
    if (result.errors.length > 0) {
        lines.push('## Validation errors', '');
        result.errors.forEach((error) => lines.push(`- ${error}`));
        lines.push('');
    }
    if (result.consumers.length > 0) {
        lines.push('## Consumers', '', '| Consumer | Build | Tests |', '| --- | --- | --- |');
        result.consumers.forEach((consumer) => {
            lines.push(`| \`${consumer.name}\` | ${consumer.build} | ${consumer.tests} |`);
        });
        lines.push('');
    }
    if (!result.passed) {
        lines.push(
            'The dependency update must not be merged until verified Arcadia evidence passes.',
        );
    }
    return lines.join('\n');
}

function main() {
    const args = parseArgs();
    const packageName = args.package;
    const prSha = args['pr-sha'];
    let result;
    if (!isArcadiaPackage(packageName)) {
        result = unverifiedResult(
            packageName,
            prSha,
            `Unknown package. Expected one of: ${ARCADIA_PACKAGES.join(', ')}`,
        );
    } else if (!args.result || !fs.existsSync(args.result)) {
        result = unverifiedResult(
            packageName,
            prSha,
            'No result from the internal Arcadia CI bridge',
        );
    } else {
        try {
            const payload = JSON.parse(fs.readFileSync(args.result, 'utf8'));
            result = validateExternalResult(payload, {package: packageName, prSha});
        } catch (error) {
            result = unverifiedResult(
                packageName,
                prSha,
                `Cannot read external result: ${error.message}`,
            );
        }
    }

    const report = renderReport(result);
    if (args.report) {
        fs.mkdirSync(path.dirname(args.report), {recursive: true});
        fs.writeFileSync(args.report, report + '\n', 'utf8');
    }
    if (args.output) {
        fs.mkdirSync(args.output, {recursive: true});
        fs.writeFileSync(
            path.join(args.output, 'arcadia-result.json'),
            JSON.stringify(result, null, 2) + '\n',
            'utf8',
        );
    }
    console.log(report);
    if (!result.passed) process.exit(1);
}

if (require.main === module) main();

module.exports = {
    ARCADIA_PACKAGES,
    parseArgs,
    isArcadiaPackage,
    unverifiedResult,
    validateExternalResult,
    renderReport,
};
