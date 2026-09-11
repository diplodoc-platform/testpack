---
title: Package Template
description: Documentation for @diplodoc/package-template — scaffolding template for new Diplodoc packages
stage: new
tags: [package-template, scaffolding, template, devops, starter]
---

# {{ package_template_info.package }}

{{ package_template_info.description }}

The `@diplodoc/package-template` package (v{{ package_template_info.version }}) is the starting point for creating new packages on the Diplodoc platform. It ships with TypeScript configuration, build setup, Vitest testing, and a full set of canonical `@diplodoc/infra` scaffolding files committed in-tree.

## Example API {#example-api}

The template includes two example functions demonstrating the package's entry point pattern:

### example() {#example-function}

```typescript
import {example} from '@diplodoc/package-template';

const result = example();
console.log(result); // 'example'
```

### greet(name) {#greet-function}

```typescript
import {greet} from '@diplodoc/package-template';

const message = greet('Alice');
console.log(message); // 'Hello, Alice!'
```

## Initialization Script {#init-script}

The `init.sh` script bootstraps a new package from the template. Usage:

```bash
# Clone this repo to a new folder
git clone git@github.com:diplodoc-platform/package-template.git new-package
cd new-package

# Init repo with the new package name
./init.sh new-package
```

The script performs the following steps:

1. Replace `package-template` with your package name in `package.json`, `README.md`, and `AGENTS.md`
2. Strip the template section from `AGENTS.md`
3. Refresh `@diplodoc/infra` scaffolding to the latest version via `npx @diplodoc/infra init`
4. Install dependencies
5. Update the git remote URL
6. Remove template-only files (`init.sh`, `README-template.md`, `MIGRATION*.md`)

## Package Structure {#package-structure}

The package structure after initialization:

```text
package-name/
├── src/
│   ├── index.ts                  # Main source file
│   └── index.test.ts             # Example test file
├── build/                        # Build output (generated)
├── esbuild/
│   └── build.mjs                 # Build configuration
├── .github/
│   ├── workflows/                # CI/CD workflows
│   ├── CODEOWNERS                # Code owners
│   └── dependabot.yml            # Dependabot configuration
├── .husky/                       # Git hooks
├── tsconfig.json                 # TypeScript configuration
├── vitest.config.mjs             # Vitest configuration
├── package.json
└── README.md
```

## Build Configuration {#build-config}

The build uses `@diplodoc/infra/esbuild` (esbuild is re-exported from `@diplodoc/infra`):

```javascript
import {build} from '@diplodoc/infra/esbuild';
import tsConfig from '../tsconfig.json' with {type: 'json'};

build({
    bundle: true,
    sourcemap: true,
    target: tsConfig.compilerOptions.target,
    tsconfig: './tsconfig.publish.json',
    platform: 'node',
    packages: 'external',
    entryPoints: ['src/index.ts'],
    outfile: 'build/index.js',
});
```

Type declarations are generated via `tsc`:

```bash
tsc --project tsconfig.publish.json --emitDeclarationOnly --outDir ./build
```

## Vitest Configuration {#vitest-config}

Tests use Vitest with v8 coverage:

```javascript
import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
        coverage: {
            enabled: true,
            provider: 'v8',
            include: ['src'],
        },
    },
});
```

## Scaffolding Files {#scaffolding-files}

Files distributed during `@diplodoc/infra init` and `infra update`:

- `.eslintrc.js` — ESLint entry point
- `.prettierrc.js` — Prettier entry point
- `.stylelintrc.js` — Stylelint entry point
- `.lintstagedrc.js` — lint-staged configuration
- `.editorconfig` — editor settings
- `.husky/pre-commit` — pre-commit hook
- `sonar-project.properties` — SonarCloud configuration

## CI/CD Workflows {#ci-cd}

The package ships with a standard set of GitHub Actions workflows:

| Workflow | Purpose |
| --- | --- |
| `tests.yml` | Type check, lint, tests, build on Linux/macOS/Windows |
| `security.yml` | Weekly `npm audit` |
| `coverage.yml` | Optional coverage upload to SonarCloud |
| `release.yml` | Publishes the package to npm on release |
| `release-please.yml` | Generates release PRs with CHANGELOG and version bumps |
| `package-lock.yml` | Keeps `package-lock.json` in sync after PR merges |
| `update-deps.yml` | Manual workflow to bump `@diplodoc/*` dependencies |

## Release Process {#release-process}

The package uses [release-please](https://github.com/googleapis/release-please) for automated releases:

1. Make conventional commits (e.g., `feat: add feature`, `fix: bug fix`)
2. `release-please` automatically creates/updates a release PR
3. Review and merge the release PR
4. `release-please` creates a GitHub release
5. The `release.yml` workflow publishes the package to npm

## Package Information {#package-info}

Package name: {{ package_template_info.package }}
Version: {{ package_template_info.version }}

Example API exports:

{% for export_name in package_template_info.exports %}
- `{{ export_name }}`
{% endfor %}

Scaffolding-managed config files:

{% for config_file in package_template_info.config_files %}
- `{{ config_file }}`
{% endfor %}

{% note info "Template Substitution" %}

The `sonar-project.properties` file contains a not_var{{PACKAGE_NAME}} placeholder that is substituted from `package.json` during scaffolding copy via `@diplodoc/infra init`.

{% endnote %}

## TOC Navigation {#toc-navigation}

This page is registered under the Syntax section of the table of contents.
