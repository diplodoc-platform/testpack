// Repository-owned configuration: extend infra and lint CommonJS tooling outside tsconfig.
// .infrarc.yml preserves the scripts override during infrastructure distribution.

module.exports = {
    root: true,
    extends: require.resolve('@diplodoc/infra/eslint-config'),
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: true,
    },
    overrides: [
        {
            files: ['*.mjs', '*.cjs'],
            parserOptions: {
                project: null,
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            env: {
                node: true,
                es2022: true,
            },
        },
        {
            files: ['test/**/*.{js,jsx,ts,tsx}'],
            env: {
                jest: true,
                node: true,
            },
        },
        {
            files: ['scripts/**/*.{js,jsx,ts,tsx}'],
            parserOptions: {
                project: null,
                ecmaVersion: 'latest',
                sourceType: 'script',
            },
            env: {
                node: true,
            },
        },
        {
            files: ['bin/**/*.{js,jsx,ts,tsx}', 'bin/*.{js,jsx,ts,tsx}'],
            env: {
                node: true,
            },
        },
    ],
};
