---
title: Testpack
description: '@diplodoc/testpack — E2E test infrastructure for the Diplodoc documentation platform'
stage: new
tags: [testpack, testing, playwright, e2e, devops]
---

# {{ testpack_info.package }}

{{ testpack_info.description }}

The `@diplodoc/testpack` package (v{{ testpack_info.version }}) is a collection of end-to-end tests for the Diplodoc documentation platform. It provides reusable Playwright test suites, a configuration factory, and a built-in Express test server.

## Architecture {#architecture}

The test flow is:

1. `npm run docs` builds YFM fixtures via `@diplodoc/cli` into `docs/output/`
2. `npm run start` builds the server bundle and starts the Express server
3. Playwright `webServer` waits on `http://localhost:3000`
4. Playwright runs portable suites from `src/tests/index.ts` and repository-only checks from `tests/repository.spec.ts`

```text
docs/input/*.md (YFM fixtures)
    │  npm run docs
    ▼
docs/output/*.html (generated static site)
    │  npm run start
    ▼
Express server (src/server)  ──►  http://localhost:3000
    │  Playwright webServer
    ▼
Playwright test runner  ──►  src/tests/*
```

## Configuration Factory {#config-factory}

The config factory (`src/config/index.ts`) exports a function that returns a full Playwright `defineConfig` with defaults:

```typescript
import config from '@diplodoc/testpack/config';

export default config({
    testDir: './tests',
    use: {
        baseURL: 'http://localhost:3000',
    },
});
```

| Setting | Default | Description |
| --- | --- | --- |
| `testDir` | `./tests` | Test discovery directory |
| `retries` | `CI ? 2 : 0` | Retry count on CI vs local |
| `workers` | `CI ? 1 : 4` | Parallel worker count |
| `maxDiffPixels` | `0` | Strict screenshot comparison |
| `updateSnapshots` | `missing` | Only create missing baselines |

## Test Server {#test-server}

The Express server (`src/server/index.ts`) serves static files from `docs/output` with URL rewriting:

| Environment Variable | Default | Purpose |
| --- | --- | --- |
| `PROJECT` | `docs/output` | Directory to serve |
| `PORT` | `3000` | Server port |
| `BASE_URL` | `https://hostmachine` | Playwright base URL |
| `CI` | unset | Controls retries, workers, server reuse |

The server rewrites URLs: trailing slash appends `index.html`; no file extension appends `.html`.

## Test Suites {#test-suites}

The package includes test suites for Diplodoc features:

| Suite | Focus |
| --- | --- |
| Terms | Term definitions, tooltips, keyboard interaction |
| Tabs | Tab switching, grouped sync, radio, dropdown, accordion |
| Cut | Collapsible blocks, URL hash, grouped cuts, accessibility |
| Search | Search suggest, keyboard navigation, debouncing |
| Mermaid | Diagram rendering, controls, screenshots |

## Package Information {#package-info}

Package name: {{ testpack_info.package }}
Version: {{ testpack_info.version }}

Available scripts:

{% for script in testpack_info.scripts %}
- `{{ script.name }}` — {{ script.description }}
{% endfor %}

Available exports:

{% for export_name in testpack_info.exports %}
- `{{ export_name }}`
{% endfor %}

{% note info "Self-Bootstrapping" %}

The `scripts/init.js` script auto-installs Chromium and `@diplodoc/cli` if missing, making the package self-bootstrapping for CI environments.

{% endnote %}

## Build Pipeline {#build-pipeline}

The esbuild build pipeline (`esbuild/build.mjs`) emits three outputs:

| Output | Mode | Entry |
| --- | --- | --- |
| `build/config` | Non-bundled | `src/config/index.ts` |
| `build/server` | Bundled | `src/server/index.ts` |
| `build/tests` | CommonJS multi-entry | `src/tests/**/*.ts` |

{% cut "Screenshot Testing" %}

Playwright screenshot baselines are stored in `tests/__screenshots__/`. Strict diff checking (`maxDiffPixels: 0`) means intentional UI changes require `--update-snapshots`.

{% endcut %}

## Dependency Deep Verification {#dependency-deep-verification}

The reusable `.github/workflows/downstream-check.yml` workflow validates dependency-update
PRs from every repository listed in `@diplodoc/infra` `distribution.yml`, including extension
repositories such as `tabs-extension`, `cut-extension`, and `mermaid-extension`.

The caller supplies the repository name, the full candidate commit SHA, and the verification
profile selected by the dependency risk assessment. The workflow fails closed unless both the
standalone checkout and the metapackage submodule resolve to that exact SHA. It then:

1. installs and checks the candidate using its own lockfile;
2. replaces the corresponding metapackage submodule;
3. regenerates and records both base and candidate integration lockfiles, then builds the workspaces;
4. compares normalized base and candidate corpus output;
5. runs browser and screenshot checks for `document-rendering` and `ecosystem` profiles;
6. runs explicitly mapped downstream consumers for core packages.

Repositories without a dedicated consumer map still receive standalone, metapackage, and corpus
verification. The generated integration lockfile, corpus, reports, screenshots, and traces are
uploaded as exact-SHA evidence.

The verification scripts are checked out from the same commit as the reusable workflow itself, so a
moving `master` branch cannot mix workflow logic and tooling from different revisions during a run.

## TOC Navigation {#toc-navigation}

This page is registered under the Syntax section of the table of contents.
