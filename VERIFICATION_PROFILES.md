# Verification Profiles

Verification profiles define the depth of automated verification applied to
a Dependabot PR before it is considered safe to merge.  The profile is
selected based on the [risk classification](../devops/infra/scripts/risk-classification.js)
(T6.2) of the changed dependency, with optional overrides for
rendering-impacting and security-critical updates.

This document is generated from the canonical definitions in
[`src/verification-profiles/index.ts`](src/verification-profiles/index.ts).

## Profiles

| Profile | Steps | Default risk | Extends |
| ------- | ----- | ------------ | ------- |
| `standard` | 6 | low | — |
| `toolchain` | 8 | medium | standard |
| `document-transform` | 11 | high | toolchain, standard |
| `document-rendering` | 14 | — | document-transform, toolchain, standard |
| `ecosystem` | 17 | critical | document-rendering, document-transform, toolchain, standard |

> Profiles are **supersets**: a deeper profile contains every step from all
> shallower profiles plus additional steps.  A deeper profile never skips a
> step that a shallower profile requires.

## Profile selection

Selection order (first match wins):

1. **Explicit override** — when the registry entry's `verification-profile`
   field is set, that profile is used directly.
2. **Critical + security** — `critical` risk with `securityCritical` flag →
   `ecosystem`.
3. **Critical + core package** — `critical` risk with `isCorePackage` flag →
   `ecosystem`.
4. **High + rendering impact** — `high` risk with `affectsRendering` or
   `isCorePackage` flag → `document-rendering`.
5. **Default by risk** — see the mapping table below.

| Risk | Default profile | When to use |
| ---- | --------------- | ----------- |
| `low` | `standard` | Types, lint plugins, dev-only deps (patch) |
| `medium` | `toolchain` | Test runners, bundlers, dev-only minor bumps |
| `high` | `document-transform` | Parsers, renderers, CLI, `svgo` |
| `critical` | `ecosystem` | Security-sensitive runtime, major core bumps |

### Flags

| Flag | Effect |
| ---- | ------ |
| `affectsRendering` | At `high` risk, selects `document-rendering` instead of `document-transform`.  Set for `svgo`, `@diplodoc/transform`, `@diplodoc/cli`. |
| `isCorePackage` | Implies `affectsRendering`.  At `critical` risk, selects `ecosystem`.  Set for `@diplodoc/cli`, `@diplodoc/transform`, `@diplodoc/components`. |
| `securityCritical` | At `critical` risk, selects `ecosystem`.  Set for vulnerability fixes on security-sensitive packages. |
| `override` | Bypasses risk-based selection entirely.  Set from the registry entry's `verification-profile` field. |

---

## Standard (`standard`)

install, typecheck, lint, unit, build, audit — the baseline verification every
package must pass.

**Steps:**

1. **Install dependencies** (`install`) — Run `npm ci` to install dependencies
   from the lockfile.
   ```bash
   npm ci
   ```
2. **Type check** (`typecheck`) — Run the TypeScript compiler in no-emit mode.
   ```bash
   npm run typecheck
   ```
3. **Lint** (`lint`) — Run ESLint, Prettier, and Stylelint in check mode.
   ```bash
   npm run lint
   ```
4. **Unit tests** (`unit`) — Run the unit test suite.
   ```bash
   npm test
   ```
5. **Build** (`build`) — Produce the build output (esbuild / tsc).
   ```bash
   npm run build
   ```
6. **Security audit** (`audit`) _(best-effort)_ — Run `npm audit` to surface
   known vulnerabilities.
   ```bash
   npm audit --audit-level=moderate
   ```

---

## Toolchain (`toolchain`)

standard + all package types + standalone install — verifies the package
works as a published artifact, not just in the workspace.

**Steps:**

1–6. **Standard steps** (see above).

7. **All package types** (`package-types`) — Verify the package works as a
   subpath-export consumer for every export type (CJS, ESM, types).
   ```bash
   node scripts/check-package-types.js
   ```
8. **Standalone install** (`standalone-install`) — Install the published
   tarball in an empty directory to verify no workspace-only dependencies
   leak into the public package.
   ```bash
   npm pack && npm install --no-save *.tgz
   ```

---

## Document Transform (`document-transform`)

reference document corpus + normalized artifact comparison — catches silent
output regressions by diffing the build output.

**Steps:**

1–8. **Toolchain steps** (see above).

9. **Build reference corpus (base SHA)** (`corpus-build-base`) — Build the
   reference document corpus at the PR base SHA to produce the expected
   artifacts for comparison.
   ```bash
   node scripts/build-corpus.js --ref ${BASE_SHA} --output artifacts/expected/
   ```
10. **Build reference corpus (PR head SHA)** (`corpus-build-head`) — Build the
    reference document corpus at the PR head SHA to produce the actual
    artifacts for comparison.
    ```bash
    node scripts/build-corpus.js --ref ${HEAD_SHA} --output artifacts/actual/
    ```
11. **Normalized artifact comparison** (`artifact-compare`) — Compare the
    output file tree and normalized HTML between base and head builds.  Any
    diff in the golden files requires human CODEOWNER approval.
    ```bash
    node scripts/compare-artifacts.js --expected artifacts/expected/ --actual artifacts/actual/ --report artifacts/diff.md
    ```

---

## Document Rendering (`document-rendering`)

transform + browser visual regression — catches rendering regressions
invisible to the artifact diff (e.g. SVG structure, layout shifts).

**Steps:**

1–11. **Document transform steps** (see above).

12. **Browser visual regression** (`browser-visual-regression`) — Run the
    Playwright browser test suite (testpack) against the head build to detect
    visual regressions in rendered pages, including large SVG diagrams.
    ```bash
    npx playwright test --project=chromium
    ```
13. **SVG DOM comparison** (`svg-dom-compare`) — Compare the SVG DOM
    structure of rendered diagrams between base and head builds.  Specifically
    targets `svgo` regressions on large SVG diagrams (upstream issue
    svg/svgo#2218).
    ```bash
    node scripts/compare-svg-dom.js --expected artifacts/expected/ --actual artifacts/actual/ --report artifacts/svg-diff.md
    ```
14. **Screenshot capture and diff** (`screenshot-capture`) — Capture
    full-page screenshots of key pages and diff them against the base
    screenshots.  Upload actual/expected/diff plus the Playwright trace as CI
    artifacts.
    ```bash
    npx playwright test --grep @screenshot --update-snapshots=false
    ```

---

## Ecosystem (`ecosystem`)

metapackage build with PR submodule + testpack — the most thorough profile,
reserved for critical core/security updates.

**Steps:**

1–14. **Document rendering steps** (see above).

15. **Metapackage build** (`metapackage-build`) — Build the full Diplodoc
    metapackage with the PR branch checked out as a submodule, ensuring all
    28 packages compile together.
    ```bash
    git submodule update --init --recursive --force && npm install && npm run build --workspaces
    ```
16. **Testpack E2E suite** (`testpack-e2e`) — Run the full testpack Playwright
    E2E suite (all 33 suites) against the metapackage build to verify
    end-to-end rendering and interaction across every package.
    ```bash
    cd devops/testpack && npm ci && npm test
    ```
17. **Downstream package check** (`downstream-check`) — For core packages,
    run the downstream consumer test suites that depend on the changed
    package to catch breakages in consumers not covered by the metapackage
    build.
    ```bash
    node scripts/downstream-check.js --package ${PACKAGE_NAME}
    ```

---

## Integration

### Risk assessment (T6.1–T6.3)

The risk assessment comment posted on each Dependabot PR includes a
`Verification Profile` field.  The profile is selected by
`selectVerificationProfile` in
[`devops/infra/scripts/dependency-policy-review.js`](../devops/infra/scripts/dependency-policy-review.js),
which:

1. Checks each registry entry's `verification-profile` field (explicit
   override).
2. Falls back to `DEFAULT_PROFILE_BY_RISK` (low→standard,
   medium→standard-integration, high→deep, critical→full-security).

> Note: the infra risk-assessment profile names (`standard`,
> `standard-integration`, `deep`, `full-security`) are abstract labels used
> in the PR comment.  The five profiles defined here (`standard`,
> `toolchain`, `document-transform`, `document-rendering`, `ecosystem`) are
> the **concrete verification definitions** with documented steps.  A future
> task will align the infra labels with these concrete profile ids.

### Policy registry (T4.1)

Registry entries in
[`devops/infra/dependency-policy.yml`](../devops/infra/dependency-policy.yml)
can set `verification-profile` to pin a specific profile.  For example,
`DEP-0001` (svgo) uses `document-rendering` because `svgo` regressions only
manifest on large SVG diagrams not present in the default testpack fixtures.

### Golden-file approval (E7)

Golden-file changes produced by the `document-transform` and
`document-rendering` profiles require **human CODEOWNER approval** before
merge.  This is enforced by the `artifact-compare` and `svg-dom-compare`
steps, which fail the build when a diff is detected.

## Module API

The profiles and selection logic are exported from
`@diplodoc/testpack/verification-profiles`:

```typescript
import {
    VERIFICATION_PROFILES,
    selectProfile,
    getProfile,
    listStepIds,
    hasStep,
    isSupersetOf,
    renderProfilesMarkdown,
    renderStepsMarkdown,
} from '@diplodoc/testpack/verification-profiles';

// Select a profile by risk level
const profile = selectProfile('high', {affectsRendering: true});
// → { id: 'document-rendering', name: 'Document Rendering', ... }

// List the step ids for a profile
const steps = listStepIds('standard');
// → ['install', 'typecheck', 'lint', 'unit', 'build', 'audit']

// Check whether a profile includes a step
hasStep('ecosystem', 'testpack-e2e'); // → true

// Check the superset relationship
isSupersetOf('ecosystem', 'standard'); // → true
```
