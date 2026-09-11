import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {expect, test} from '@playwright/test';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const arcadiaCheck = require('../../../scripts/arcadia-check.js');

const SHA = '0123456789abcdef0123456789abcdef01234567';

function validResult() {
    return {
        provider: 'arcadia-ci',
        package: 'transform',
        prSha: SHA,
        status: 'success',
        evidenceUrl: 'https://ci.example.test/run/42',
        consumers: [{name: 'real/consumer', build: 'success', tests: 'success'}],
    };
}

test.describe('Arcadia external result contract', () => {
    test('accepts matching successful evidence', () => {
        const result = arcadiaCheck.validateExternalResult(validResult(), {
            package: 'transform',
            prSha: SHA,
        });
        expect(result.verified).toBe(true);
        expect(result.passed).toBe(true);
    });

    test('fails closed when evidence is absent', () => {
        const result = arcadiaCheck.unverifiedResult('transform', SHA, 'missing');
        expect(result.verified).toBe(false);
        expect(result.passed).toBe(false);
        expect(arcadiaCheck.renderReport(result)).toContain('UNVERIFIED');
    });

    test('rejects evidence for another SHA', () => {
        const result = arcadiaCheck.validateExternalResult(validResult(), {
            package: 'transform',
            prSha: 'ffffffffffffffffffffffffffffffffffffffff',
        });
        expect(result.verified).toBe(false);
        expect(result.passed).toBe(false);
    });

    test('rejects a failed consumer even when top-level status says success', () => {
        const payload = validResult();
        payload.consumers[0].tests = 'failure';
        const result = arcadiaCheck.validateExternalResult(payload, {
            package: 'transform',
            prSha: SHA,
        });
        expect(result.verified).toBe(true);
        expect(result.passed).toBe(false);
    });

    test('CLI rejects a missing bridge result', () => {
        const output = fs.mkdtempSync(path.join(os.tmpdir(), 'arcadia-check-'));
        const script = path.join(__dirname, '..', '..', '..', 'scripts', 'arcadia-check.js');
        const {spawnSync} = require('node:child_process');
        const run = spawnSync(process.execPath, [
            script,
            '--package',
            'transform',
            '--pr-sha',
            SHA,
            '--output',
            output,
        ]);
        expect(run.status).toBe(1);
        const result = JSON.parse(
            fs.readFileSync(path.join(output, 'arcadia-result.json'), 'utf8'),
        );
        expect(result.status).toBe('unverified');
        fs.rmSync(output, {recursive: true, force: true});
    });
});
