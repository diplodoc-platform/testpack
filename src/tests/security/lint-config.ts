import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {execFileSync} from 'node:child_process';
import {expect, test} from '@playwright/test';

/* eslint-disable @typescript-eslint/no-require-imports */
const infraRoot = path.dirname(require.resolve('@diplodoc/infra/prettier-config'));
const {ESLint} = require(require.resolve('eslint', {paths: [infraRoot]}));
const configuration = require('../../../.eslintrc');
/* eslint-enable @typescript-eslint/no-require-imports */

const repository = path.resolve(__dirname, '../../..');

test.describe('Repository lint configuration', () => {
    test('lints CommonJS scripts without a TypeScript project and keeps source type checks', async () => {
        const eslint = new ESLint({cwd: repository});
        const script = path.join(repository, 'scripts/lint-regression.js');
        const [result] = await eslint.lintText('unknownIdentifier();\n', {filePath: script});
        const source = await eslint.calculateConfigForFile(
            path.join(repository, 'src/config/index.ts'),
        );

        expect(
            configuration.overrides.find((override: {files: string[]}) =>
                override.files.includes('scripts/**/*.{js,jsx,ts,tsx}'),
            ),
        ).toEqual({
            files: ['scripts/**/*.{js,jsx,ts,tsx}'],
            parserOptions: {project: null, ecmaVersion: 'latest', sourceType: 'script'},
            env: {node: true},
        });
        expect({
            fatalErrors: result.fatalErrorCount,
            rules: result.messages.map((message: {ruleId: string}) => message.ruleId),
            sourceProject: source.parserOptions.project,
        }).toEqual({fatalErrors: 0, rules: ['no-undef'], sourceProject: true});
    });

    test('infra sync preserves the repository-owned ESLint configuration', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'testpack-lint-config-'));
        const config = fs.readFileSync(path.join(repository, '.eslintrc.js'), 'utf8');
        const exclusions = fs.readFileSync(path.join(repository, '.infrarc.yml'), 'utf8');

        try {
            fs.writeFileSync(
                path.join(root, 'package.json'),
                JSON.stringify({name: '@diplodoc/testpack'}),
            );
            fs.writeFileSync(path.join(root, '.eslintrc.js'), config);
            fs.writeFileSync(path.join(root, '.infrarc.yml'), exclusions);

            execFileSync(
                process.execPath,
                [
                    path.join(infraRoot, 'bin/infra.js'),
                    'sync',
                    '--repo',
                    'testpack',
                    '--target',
                    root,
                ],
                {
                    cwd: root,
                    env: {...process.env, INFRA_TARGET_DIR: root, INFRA_BLACKLIST: '[]'},
                    stdio: 'pipe',
                },
            );

            expect(fs.readFileSync(path.join(root, '.eslintrc.js'), 'utf8')).toBe(config);
            expect(fs.readFileSync(path.join(root, '.infrarc.yml'), 'utf8')).toBe(exclusions);
            expect(config).toContain('Repository-owned configuration');
            expect(fs.existsSync(path.join(root, '.github/workflows/tests.yml'))).toBe(true);
        } finally {
            fs.rmSync(root, {recursive: true, force: true});
        }
    });
});
