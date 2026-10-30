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

For a dependency-only pull request, differences block the workflow until a
human CODEOWNER explicitly accepts that exact comparison. Feature pull requests
that also change fixtures, tests, documentation, source, or workflows skip this
dependency gate and remain subject to normal CI, CODEOWNER and branch/ruleset
policy. The comparison workflow has only read permissions and never labels,
comments on, approves or merges a pull request.

### Accepting an expected difference

1. Inspect `html-diff.md`, `markdown-diff.md`, `svg-diff.md` and the build evidence
   uploaded by the failed Golden File Comparison job.
2. Copy the `/golden-approve sha256:...` line from `golden-review.md` in that
   report or job summary. Submit an **Approve** PR review containing that line.
   The review must target the current PR head and come from a human CODEOWNER,
   directly or on behalf of a CODEOWNER team. An ordinary comment, label, generic
   approval or machine-user approval does not accept the difference.
3. For a private CODEOWNER team, open **Actions → Confirm Golden Review → Run
   workflow**. Select `master` (the default branch), enter the PR number and the
   64-character digest from the report, without the `sha256:` prefix. The handler
   verifies the review and active membership in the trusted CODEOWNER team. An
   existing `diplodoc-app` installation writes a `Golden difference approval`
   check; this confirms ownership but does not replace the failed Golden gate.
4. Use **Re-run failed jobs** on that golden run. With successful baseline,
   candidate and screenshot jobs, GitHub repeats only the data-only comparator
   against the retained producer artifacts. No additional dependency-update PR
   or changed baseline files are needed.

The digest binds the repository, PR number, base SHA, head SHA and complete
comparison result. A different head, base or diff needs a matching new approval;
old reviews, dismissals, change requests and incomplete API evidence cannot pass
the gate. Native PR review requirements must also be satisfied. Team ownership
is checked using GitHub's native review evidence or an authenticated App
confirmation of active team membership, never a claim in review text. The
currently supported owner policy is the single global rule in
the trusted base checkout's `.github/CODEOWNERS`; a more complex policy fails
closed until support is deliberately added. Known machine users are excluded.

A read-only Actions token hides private team attribution. The separate manual
`golden-review-approval.yml` handler runs only from the default branch, checks out
that trusted workflow SHA, and reads PR/review metadata and CODEOWNERS at the
exact PR base. It never downloads artifacts, installs dependencies or executes
PR code. Existing `INFRA_APP_ID` / `INFRA_APP_PRIVATE_KEY` organization secrets
are used only in this job; its installation token is restricted to this
repository with contents/PR/members read and checks write. It cannot push, merge,
edit reviews or rerun Actions. Individual CODEOWNERS entries are not required.

The comparator remains read-only and accepts a confirmation only from the pinned
`diplodoc-app` App identity (ID `2126995`), bound to repository, PR, base, head,
digest, reviewer and review ID. It rechecks the current review and native review
decision, so later dismissal, editing away the command, or a changed comparison
invalidates confirmation. Team membership is verified when confirmation is
issued. Missing permissions, missing proof and API failures remain blocking;
checks from GitHub Actions or another App cannot impersonate this confirmation.

Accepted differences remain in `corpus-result.json` with `passed: false`.
`golden-review.json` separately records the exact request and approving review;
the job reports accepted differences instead of claiming identical output. Build,
screenshot, incomplete-corpus and other CI failures cannot be accepted through
this mechanism. The standalone comparison CLI and reusable downstream comparator
retain their strict exit behavior.

The gate helper comes from the immutable PR base. After first merging this
feature, update an existing dependency PR branch onto that master revision and
run golden again before reviewing its new report. Older workflow runs keep the
old tools and cannot acquire this mechanism merely by being rerun.

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

For rendering profiles, `scripts/candidate-browser.js` overrides the development
web server: it serves `artifacts/actual/html/output` using the already-built
testpack server, never runs `npm run docs` or resolves an npm CLI via `npx`, and
never reuses an existing server. Browsers therefore exercise the same candidate
HTML/assets that the comparator receives. Snapshot updates are disabled. The
uploaded `candidate-browser.json` records the candidate SHA, absolute served
directory, sorted file digests and corpus digest; JSON/HTML browser reports are
uploaded alongside it. This binds diagnostics to the build, not an authenticity
claim about untrusted candidate code running inside its isolated runner.

Repository comparator/downstream tests use `CANDIDATE_CORPUS` too, through
`scripts/repository-corpus.js`. Local development defaults to `docs/output` only
when that variable is absent. An invalid explicit path, missing directory or
corpus without HTML fails with an actionable error instead of silently skipping
coverage or comparing unrelated local docs.

Both Golden File Comparison and Dependency Deep Verification producer uploads
enable `include-hidden-files` within the dedicated `artifacts/` directory. This
retains `.yfm` and allows downloaded file inventories to match the complete
`candidate-browser.json` digest. Never broaden the upload path to a checkout or
put credentials in that evidence directory. The comparison runner still treats
all uploaded candidate content as untrusted data; hidden-file inclusion grants
no execution rights or authenticity guarantee.

The workflow does not install dependencies independently inside consumer
directories, so it tests the actual metapackage dependency graph.

### Lock-only dependency updates

Replacing a source submodule does not update the metapackage's npm resolutions.
After each isolated workspace install, `scripts/workspace-lock.js` overlays a
package-local dependency tree from that producer's locked standalone installation.
The baseline uses its standalone baseline lock; the candidate uses its candidate
lock. Direct and nested resolutions are scoped to the selected package, including
different versions of the same dependency. Other workspace links and shared
resolutions are preserved; source manifests are not rewritten. A lockfile edit
alone is insufficient: npm can deduplicate to a newer compatible hoisted version.
`scripts/workspace-install.js` copies reachable non-workspace packages and
their executable shims into a staging directory, then swaps the selected local
node_modules. The previous directory is retained under the metapackage's own
node_modules (outside source inputs and artifact uploads); it is never deleted.

After the overlay, and again after builds/tests, the helper follows dependency
edges using Node's node_modules lookup and reads installed package.json files
without importing package code. It checks versions against
the standalone plan and verifies the installed lock's version, URL and integrity.
The producer artifacts include the seeded metapackage lock, resolution plan and
`base-dependency-resolution.json` / `candidate-dependency-resolution.json`.
The trusted comparator requires these reports and lists changed lock paths and
versions. Missing, inconsistent or wrong-package evidence fails closed before
corpus differences can be accepted as meaningful.

Only dependency edges reachable without crossing a replaced workspace count as
covered. A transitive library hoisted from a standalone workspace dependency is
not necessarily used by that workspace's source checkout. Changed resolutions
hidden behind workspace links, unreachable records or unavailable optional
packages fail with an explicit coverage error, not a green identical-corpus
result. Unsupported lock formats, local/git dependencies and aliases without a
matching installed identity likewise require a separate supported verification
path. This is runtime-version evidence, not a malware or package-byte authenticity
claim; npm integrity and source review remain separate gates. Platform-specific
optional dependencies absent in the standalone installation remain explicitly
unavailable; a changed unavailable resolution is not covered on the current runner.

The workflow has four separate hosted jobs: metadata-only `prepare`, isolated
`baseline` and `candidate` builds, and trusted `comparison`. The last job never
installs or executes package code; it reads artifacts by IDs emitted by the
corresponding upload steps. Missing builds, artifacts, consumer evidence or corpus
files fail closed. Each ID-selected download sets `merge-multiple: true` to unpack
directly into its own `baseline/` or `candidate/` root. Without that option,
download-artifact v4 adds an artifact-name subdirectory even for one selected ID,
which violates the comparator path contract. Baseline and candidate remain
separate directories; selection still uses only their producer artifact IDs.
The repository regression tests cover both the flattened passing layout and
the nested failing layout, and retain Markdown regression detection.
Build jobs do not share an npm cache. The older
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

Review follow-up (2026-10-03): Action version tags restored and workflow helpers
extracted. Lint, typecheck, build and normal pre-commit hooks passed. Focused
repository tests passed 160 cases with 2 existing skips; the full local Chromium
suite passed 1548 cases with 4 skips, no unexpected failures or flaky tests, and
no tracked screenshot baseline changes. Actionlint 1.7.12 passed without
shellcheck after excluding only its unsupported workflow-identity property
diagnostics. Hosted multi-platform CI and reusable-job pilots remain separate.

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
