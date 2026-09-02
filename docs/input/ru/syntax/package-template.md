---
title: Package Template
description: Template package for creating new packages on the Diplodoc platform
stage: preview
tags:
  - package-template
  - template
  - scaffolding
  - esbuild
  - vitest
---

# {{ package_template_info.package }}

{{ package_template_info.description }}

## Overview

The `@diplodoc/package-template` is the starting point for creating new packages on the Diplodoc platform. It ships with:

- TypeScript configuration extending `@diplodoc/infra/tsconfig.json`
- Build setup using `@diplodoc/infra/esbuild` (esbuild re-exported from infra)
- Vitest testing setup with an example test
- A full set of canonical `@diplodoc/infra` scaffolding files committed in-tree
- A minimal `init.sh` script for bootstrapping new packages
- Migration docs for users coming from the pre-`@diplodoc/infra` version

## API

The template package exports two example functions:

### example()

Returns the string `'example'`.

```typescript
import {example} from '@diplodoc/package-template';

const result = example();
console.log(result); // 'example'
```

### greet(name)

Greets a person by name.

```typescript
import {greet} from '@diplodoc/package-template';

const message = greet('Alice');
console.log(message); // 'Hello, Alice!'
```

| Function | Parameter | Return Type | Description |
|----------|-----------|-------------|-------------|
| `example` | — | `string` | Returns `'example'` |
| `greet` | `name: string` | `string` | Returns `'Hello, ${name}!'` |

## Build System {#build-system}

The package uses **esbuild** (re-exported from `@diplodoc/infra/esbuild`) for fast builds.

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

| Build Step | Script | Description |
|------------|--------|-------------|
| Clean | `npm run build:clean` | Removes the `build/` directory |
| JavaScript | `npm run build:js` | Bundles via esbuild from `@diplodoc/infra/esbuild` |
| Declarations | `npm run build:declarations` | Generates TypeScript declarations via `tsc` |

## TypeScript Configuration {#ts-config}

The package extends `@diplodoc/infra/tsconfig.json`:

| Setting | Value | Description |
|---------|-------|-------------|
| `target` | `es2022` | ECMAScript 2022 target |
| `module` | `es2022` | ES module format |
| `declaration` | `true` | Generate `.d.ts` files |
| `moduleResolution` | `bundler` | Bundler-style module resolution |

## Testing {#testing}

The package uses **Vitest** for unit testing.

```typescript
import {describe, expect, it} from 'vitest';
import {example, greet} from './index';

describe('example', () => {
    it('should return example string', () => {
        expect(example()).toBe('example');
    });
});

describe('greet', () => {
    it('should greet with name', () => {
        expect(greet('World')).toBe('Hello, World!');
    });
});
```

| Test Command | Description |
|--------------|-------------|
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## init.sh {#init-sh}

The `init.sh` script bootstraps a new package from the template:

1. Replaces `package-template` with the new package name in `package.json`, `README.md`, and `AGENTS.md`
2. Strips the template section from `AGENTS.md`
3. Runs `npx @diplodoc/infra init` to refresh scaffolding
4. Installs dependencies
5. Removes template-only files (`init.sh`, `README-template.md`, `MIGRATION*.md`)
6. Updates the git remote URL

```bash
git clone git@github.com:diplodoc-platform/package-template.git new-package
cd new-package
./init.sh new-package
```

## Scaffolding Files {#scaffolding}

The following files are managed by `@diplodoc/infra` and must not be edited manually:

| File | Managed By | Purpose |
|------|------------|---------|
| `.eslintrc.js` | `@diplodoc/infra` | ESLint configuration |
| `.prettierrc.js` | `@diplodoc/infra` | Prettier configuration |
| `.stylelintrc.js` | `@diplodoc/infra` | Stylelint configuration |
| `.lintstagedrc.js` | `@diplodoc/infra` | lint-staged configuration |
| `.editorconfig` | `@diplodoc/infra` | Editor configuration |
| `.husky/pre-commit` | `@diplodoc/infra` | Git pre-commit hook |
| `sonar-project.properties` | `@diplodoc/infra` | SonarCloud configuration |

## CI/CD {#ci-cd}

The package ships with standard GitHub Actions workflows from `@diplodoc/infra`:

| Workflow | File | Description |
|----------|------|-------------|
| Tests | `tests.yml` | Type check, lint, tests, build |
| Security | `security.yml` | Weekly `npm audit` |
| Coverage | `coverage.yml` | Optional coverage upload |
| Release | `release.yml` | Publish to npm on release |
| Release Please | `release-please.yml` | Automated versioning |
| Package Lock | `package-lock.yml` | Keep lockfile in sync |
| Update Deps | `update-deps.yml` | Bump `@diplodoc/*` dependencies |

## Package Information {#package-info}

- **Package:** `{{ package_template_info.package }}`
- **Version:** `{{ package_template_info.version }}`
- **Description:** `{{ package_template_info.description }}`

### Exports

{% for export in package_template_info.exports %}
- `{{ export }}`
{% endfor %}

### Scripts

{% for script in package_template_info.scripts %}
- `{{ script.name }}` — {{ script.description }}
{% endfor %}

{% note info "Do not edit scaffolding files" %}
Files managed by `@diplodoc/infra` (`.eslintrc.js`, `.prettierrc.js`, workflows, husky hooks) are overwritten by the distribution pipeline. Use `.infrarc.yml` for local exclusions.
{% endnote %}

## TOC Navigation {#toc-navigation}

This page is registered under **Syntax** in the sidebar table of contents.
