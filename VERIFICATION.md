# Golden-file and downstream verification

This file describes the current implementation. It is evidence for review, not
a substitute for checking the required GitHub status checks on the target PR.

## Corpus isolation

`scripts/build-corpus.js` resolves the requested ref to a full commit SHA and
creates a detached temporary Git worktree. It installs locked dependencies,
builds `docs/output`, copies the result to the requested artifact directory and
always removes the temporary worktree. It never stashes, switches or restores
the caller's checkout.

```bash
node scripts/build-corpus.js --ref "${BASE_SHA}" --output artifacts/expected/
node scripts/build-corpus.js --ref "${HEAD_SHA}" --output artifacts/actual/
```

Missing `docs/output` is an error. The produced `metadata.json` records the ref,
resolved SHA, Node version and platform.

## Artifact comparison

`scripts/compare-artifacts.js` compares the complete file tree, normalized HTML
and referenced assets. JavaScript contents are preserved during normalization,
and every common non-HTML asset is compared by SHA-256, so a same-path binary
change is not silently accepted. Missing expected or actual directories fail
closed.

`scripts/compare-svg-dom.js` compares standalone and inline SVG structures. It
tracks nesting depth, element order, critical attributes, gradients, masks and
links. Missing input directories fail closed.

```bash
node scripts/compare-artifacts.js \
  --expected artifacts/expected/output/ \
  --actual artifacts/actual/output/ \
  --report artifacts/diff.md

node scripts/compare-svg-dom.js \
  --expected artifacts/expected/output/ \
  --actual artifacts/actual/output/ \
  --report artifacts/svg-diff.md
```

For a dependency-only pull request, any difference exits non-zero and therefore
blocks the workflow. Feature pull requests that also change fixtures, tests,
documentation, source, or workflows skip this dependency gate and remain subject
to the normal CI, CODEOWNER, and branch/ruleset policy. The comparison workflow
itself has read-only GitHub permissions and does not label or comment on pull
requests.

## Browser screenshots

`tests/docs.spec.ts` contains real Chromium screenshot assertions for the large
SVG reproducer and complex gradients. Their baselines live under
`tests/__screenshots__/docs.spec.ts/chromium/`. The golden workflow runs them
without updating snapshots:

```bash
npx playwright test --grep @screenshot --update-snapshots=none \
  --output artifacts/playwright-output --trace on
```

The workflow uploads expected and actual corpus trees, comparison reports,
Playwright output and the HTML report for inspection.

## Core-package downstream verification

`.github/workflows/downstream-check.yml` checks out the Diplodoc metapackage at
`master`, records the base package export state and base corpus, replaces only
the selected `cli`, `components` or `transform` submodule with the exact
40-character PR SHA, and then:

1. builds all metapackage workspaces;
2. rejects newly missing `exports`, `main`, `module` or `types` targets;
3. runs the changed package's own tests;
4. builds the candidate corpus and runs the complete testpack E2E suite;
5. runs downstream consumer checks plus normalized artifact and SVG comparison.

The workflow does not install dependencies independently inside consumer
directories, so it tests the actual metapackage dependency graph.

## Arcadia evidence

Public GitHub Actions cannot execute internal Arcadia builds.
`scripts/arcadia-check.js` therefore validates an external JSON result produced
by the internal bridge. Evidence must match the exact package and PR SHA, use an
HTTPS provider URL and contain at least one real consumer result. Missing,
malformed or failing evidence exits non-zero and is reported as `UNVERIFIED`.

## Local validation snapshot

On 2026-09-05 the changed tree passed:

- `npm test`: 1581 passed, 2 skipped, 0 failed;
- `npm run typecheck`;
- `npm run build`;
- `npm run lint`: 0 errors and 0 warnings.

The GitHub workflows were syntax-parsed locally. Their behavior with real
GitHub rulesets, App permissions and the internal Arcadia bridge still requires
the staged rollout described in the review handoff.
