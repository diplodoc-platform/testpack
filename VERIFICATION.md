# Golden-file and downstream verification

This file describes the current implementation. It is evidence for review, not
a substitute for checking the required GitHub status checks on the target PR.

## Corpus isolation

`scripts/build-corpus.js` resolves the requested ref to a full commit SHA and
creates a detached temporary Git worktree. It installs locked dependencies,
builds `docs/output` in the requested CLI format, copies the result to the
requested artifact directory and always removes the temporary worktree. It
never stashes, switches or restores the caller's checkout.

```bash
node scripts/build-corpus.js --ref "${BASE_SHA}" --output artifacts/expected/html --format html
node scripts/build-corpus.js --ref "${HEAD_SHA}" --output artifacts/actual/html --format html
node scripts/build-corpus.js --ref "${BASE_SHA}" --output artifacts/expected/md --format md
node scripts/build-corpus.js --ref "${HEAD_SHA}" --output artifacts/actual/md --format md
```

Missing `docs/output` is an error. The produced `metadata.json` records the ref,
resolved SHA, Node version and platform.
The destination must not exist (even as an empty directory), and symlink
ancestors are rejected. Use a fresh directory per run; the helper never removes
or overwrites caller-owned output.

## Artifact comparison

`scripts/compare-artifacts.js` compares the complete file tree, normalized HTML,
generated Markdown and referenced assets. JavaScript contents are preserved
during normalization, and every common non-HTML asset is compared by SHA-256,
so a same-path binary change is not silently accepted. JS, CSS, Markdown and JSON
changes receive a readable contextual diff. Runtime chunks are retained, including
numeric chunk identities and script/link attributes; only build hashes are
normalized. Unknown chunk identities are changes requiring review, not an excuse
to drop coverage. Search registry keys and Lunr 2.3.9 term/vector identities are
canonicalized as data; search content, term weights, pipeline and executable tails
remain comparable. No generated JavaScript is evaluated by the comparator.
Build timestamps, host paths, timings,
generated hashes and version banners are normalized; document structure,
counters and generated file contents remain comparable. Missing expected or
actual directories fail closed.

`scripts/compare-svg-dom.js` compares standalone and inline SVG structures. It
tracks nesting depth, element order, critical attributes, gradients, masks and
links. Missing input directories fail closed.

```bash
node scripts/compare-artifacts.js \
  --expected artifacts/expected/html/output/ \
  --actual artifacts/actual/html/output/ \
  --report artifacts/html-diff.md

node scripts/compare-artifacts.js \
  --expected artifacts/expected/md/output/ \
  --actual artifacts/actual/md/output/ \
  --report artifacts/markdown-diff.md

node scripts/compare-svg-dom.js \
  --expected artifacts/expected/html/output/ \
  --actual artifacts/actual/html/output/ \
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

## Exact-SHA downstream verification

`.github/workflows/downstream-check.yml` checks out the Diplodoc metapackage at
one resolved immutable `master` SHA, records the base package export state and base corpus, replaces only
the selected repository's registered submodule with the exact 40-character PR
SHA, and then:

1. builds all metapackage workspaces;
2. rejects newly missing `exports`, `main`, `module` or `types` targets;
3. runs the changed package's own tests;
4. builds the candidate HTML and Markdown corpus;
5. runs the complete testpack E2E suite for rendering profiles;
6. runs known downstream consumer checks plus normalized HTML, Markdown and SVG
   comparison.

The workflow does not install dependencies independently inside consumer
directories, so it tests the actual metapackage dependency graph.

The workflow has four separate hosted jobs: metadata-only `prepare`, isolated
`baseline` and `candidate` builds, and trusted `comparison`. The last job never
installs or executes package code; it reads artifacts by IDs emitted by the
corresponding upload steps. Missing builds, artifacts, consumer evidence or corpus
files fail closed. Build jobs do not share an npm cache. The older
`golden-file-comparison.yml` follows the same runner separation and reads its tools
from the immutable PR base SHA.

Reusable tools are checked out at `job.workflow_sha` from
`job.workflow_repository`, with an explicit identity guard. These are
[GitHub.com job context properties](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#job-context),
not caller-controlled `github.sha`. Validators that predate those properties
(including actionlint 1.7.12) report false positives for these two properties;
ignore only that exact diagnostic, not all expression errors. By the owner's
decision, distributed callers use `@master` and Actions use version tags instead
of commit hashes. Those references can change between runs; each run still loads
its tools from its resolved workflow SHA. Mutable tags accept an upstream
replacement risk and do not guarantee compatibility. Do not pass repository
secrets to candidate builds.

Workflow JavaScript lives in repository helpers: `scripts/verification-setup.js`
validates inputs and resolves the candidate/baseline metadata, while
`scripts/golden-scope.js` classifies a dependency-only diff without executing PR
code. Both have focused repository tests. Scope/comparison helpers come from the
trusted PR base, not from candidate artifacts. Merge these helpers into `master`
before running dependency PRs based on that revision.

The npm cache parameters remain intentionally absent: candidate build scripts
must not populate a cache later reused by the trusted baseline. Each isolated
build performs a clean locked install instead.

Runner separation protects the reference and comparator, but does not make this
a malware scanner: a package controls its own build and test process. Keep
dependency/source review and npm integrity/lockfile review as separate gates.

Before workspace verification, the candidate is checked with its own lockfile.
The package revision registered in the base metapackage is also installed and
built in a separate standalone checkout. Both export reports are retained as
artifacts: `base-standalone-package-targets.json` and
`candidate-standalone-package-targets.json`. Existing missing targets remain
visible, but only newly missing targets fail this standalone export gate. A
baseline installation or build failure is not ignored. The baseline SHA is
recorded in the job summary, and no package-specific export allowlist is used.

The `profile` workflow input only selects the cost of this GitHub verification.
It is not a package API and it does not represent or launch the internal Arcadia
document check. That check remains owned by the CLI repository and its existing
internal bridge.

## Local validation snapshot

Security hardening validation on 2026-09-30: focused repository tooling tests
passed (156 passed, 2 existing skips), together with typecheck, lint and build.
Workflow YAML passed actionlint with only the documented `job.workflow_*`
compatibility diagnostic excluded. Replaying saved master corpus artifacts kept
components and search passing. Client now reports seven runtime JS/CSS changes
that the older comparator skipped (including actual OpenAPI request layout
changes); HTML document, Markdown and SVG comparisons remain unchanged. These
asset differences require review, not automatic baseline replacement.

The new isolated jobs still require a GitHub pilot before broad distribution.
Local source/fixture validation does not substitute for that hosted run.

On 2026-09-15 the changed tree passed:

- `npm test`: 1523 passed, 4 skipped, 0 failed;
- `npm run typecheck`;
- `npm run build`;
- `npm run lint`: 0 errors and 0 warnings.

The GitHub workflows were syntax-parsed locally. Their behavior with real
GitHub rulesets and App permissions still requires a staged rollout.
