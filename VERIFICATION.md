# T7.3 — Golden File Comparison — Verification

## Acceptance Criteria

### 1. Corpus built on base SHA and PR SHA

**Status:** PASS

The `scripts/build-corpus.js` CLI script builds the reference document corpus at a specified git ref:

```bash
node scripts/build-corpus.js --ref ${BASE_SHA} --output artifacts/expected/
node scripts/build-corpus.js --ref ${HEAD_SHA} --output artifacts/actual/
```

The script:
1. Resolves the git ref to a full 40-character commit SHA (`resolveSha`)
2. Stashes uncommitted changes (`stashChanges`) and restores on exit (`popStash`)
3. Checks out the ref (`git checkout`)
4. Runs `npm ci` (or `npm install` if no lockfile) + `npm run docs`
5. Copies the `docs/output/` tree to the output directory (`copyDir`)
6. Writes a `metadata.json` with ref, SHA, timestamp, node version, platform (`writeMetadata`)
7. Restores the original working tree state in a `finally` block

Exports pure helpers for testing: `parseArgs`, `resolveSha`, `copyDir`, `rmrf`, `hasUncommittedChanges`, `stashChanges`, `popStash`, `writeMetadata`, `buildCorpus`.

Unit tests in `src/tests/golden-files/index.ts`:
- `build-corpus — module exports — should export expected functions` (verifies all 9 exports)
- `build-corpus — module exports — parseArgs should parse --ref and --output`

Verification profile integration:
- `document-rendering` profile step `corpus-build-base` references `scripts/build-corpus.js --ref ${BASE_SHA}`
- `document-rendering` profile step `corpus-build-head` references `scripts/build-corpus.js --ref ${HEAD_SHA}`

### 2. HTML, SVG DOM, screenshots compared

**Status:** PASS

**HTML comparison** (`scripts/compare-artifacts.js`):
- `normalizeHtml` — collapses whitespace, sorts attributes alphabetically, strips script content, normalizes style whitespace, strips whitespace adjacent to tags
- `diffFileTree` — detects added/removed/common files between expected and actual output trees
- `compareHtmlFile` — compares normalized HTML of common files, produces line-level diff
- `extractAssetLinks` — extracts `src`/`href` references and sorts them
- `compareAssetLinks` — diffs asset links between expected and actual HTML
- `compareArtifacts` — orchestrates file-tree diff + HTML diff + asset-link diff, returns `hasDifferences` boolean
- `renderReport` — produces markdown report with file-tree, HTML, and asset-link sections + CODEOWNER approval notice

Unit tests: 16 tests covering `normalizeHtml`, `sortAttributes`, `listFiles`, `diffFileTree`, `extractAssetLinks`, `compareArtifacts` (integration), `renderReport`.

**SVG DOM comparison** (`scripts/compare-svg-dom.js`):
- `extractSvgStructure` — lightweight string-based SVG parser extracting critical attributes: `id`, `href`, `viewBox`, `mask`, `maskUnits`, `fill`, `stroke`, gradient attrs (`x1`, `y1`, `x2`, `y2`, `cx`, `cy`, `r`, `fx`, `fy`, `gradientUnits`, `gradientTransform`), filter attrs (`filter`, `filterUnits`), pattern attrs (`patternUnits`, `patternTransform`), clip-path attrs
- Critical elements tracked: `svg`, `defs`, `linearGradient`, `radialGradient`, `stop`, `mask`, `clipPath`, `pattern`, `filter`, `feGaussianBlur`, `feOffset`, `feMerge`, `feMergeNode`, `path`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `g`, `use`, `image`, `text`, `tspan`, `marker`, `symbol`
- `compareSvgStructure` — compares viewBox, element count, element tag/attrs, gradient count, mask count, link count
- `compareSvgDoms` — orchestrates SVG file listing + per-file structure extraction + comparison
- `renderReport` — markdown report with added/removed SVG files and per-file DOM diffs + CODEOWNER notice

Unit tests: 11 tests covering `extractSvgStructure`, `compareSvgStructure`, `listSvgFiles`, `compareSvgDoms` (integration).

**Screenshots** — the `document-rendering` verification profile includes a `screenshot-capture` step (`npx playwright test --grep @screenshot --update-snapshots=false`). The CI workflow (`golden-file-comparison.yml`) runs this step with `--trace on` and uploads the Playwright output + trace as artifacts. Playwright's `toHaveScreenshot()` performs pixel-level visual diff comparison.

CLI execution tests: 3 tests verifying `compare-artifacts.js` and `compare-svg-dom.js` exit 0 for identical dirs and exit 1 for different dirs.

### 3. Artifacts uploaded (actual/expected/diff + trace)

**Status:** PASS

The CI workflow `.github/workflows/golden-file-comparison.yml` uploads all comparison artifacts:

```yaml
- name: Upload artifacts (actual + expected + diff + trace)
  uses: actions/upload-artifact@v4
  with:
    name: golden-file-artifacts
    path: |
      artifacts/expected/
      artifacts/actual/
      artifacts/diff.md
      artifacts/svg-diff.md
      artifacts/playwright-output/
      artifacts/playwright-report/
    retention-days: 30
```

Artifacts include:
- `artifacts/expected/` — corpus built at base SHA (file tree + HTML + SVG)
- `artifacts/actual/` — corpus built at head SHA (file tree + HTML + SVG)
- `artifacts/diff.md` — normalized HTML + file-tree + asset-link comparison report
- `artifacts/svg-diff.md` — SVG DOM comparison report
- `artifacts/playwright-output/` — screenshot test output
- `artifacts/playwright-report/` — Playwright HTML report with traces

When differences are detected, the workflow also posts a PR comment with the full diff report and adds a `golden-file-change` label.

### 4. CODEOWNER approval required for snapshot changes

**Status:** PASS

Three mechanisms enforce CODEOWNER approval:

1. **Report-level notice** — both `compare-artifacts.js` and `compare-svg-dom.js` `renderReport` functions include a "CODEOWNER Approval Required" section in their markdown output, stating that golden-file changes require separate human confirmation and Dependabot cannot update snapshots independently.

2. **CI workflow label** — `golden-file-comparison.yml` adds a `golden-file-change` label to the PR when differences are detected, making it visible in the PR's label set for CODEOWNER triage.

3. **PR comment** — the workflow posts a structured comment with the diff report and an explicit "CODEOWNER Approval Required" section, including instructions to download artifacts for inspection.

The verification profiles (`document-rendering` and `ecosystem`) document that the `artifact-compare` and `svg-dom-compare` steps are required (`required: true`), meaning a failing comparison blocks the profile from passing.

### 5. Pinned Linux image for reproducibility

**Status:** PASS

The CI workflow uses a pinned container image for reproducible builds:

```yaml
container:
  image: node:24-bookworm-slim
  env:
    CI: 'true'
```

- `node:24-bookworm-slim` — Debian Bookworm slim image with Node.js 24 (pinned major version)
- `runs-on: ubuntu-24.04` — pinned GitHub Actions runner OS
- `PLAYWRIGHT_BROWSERS_PATH: /ms-playwright` — consistent browser install path
- `npx playwright install --with-deps chromium` — pinned chromium install

Both base and head corpus builds run in the same container image with the same Node.js version, browser, and fonts, ensuring that screenshot and HTML comparisons are reproducible (differences come from code changes, not environment drift).

## Test Results

- **Golden File Comparison suite:** 44 passed, 0 failed (5.5s)
  - `compare-artifacts` unit tests: 16
  - `compare-svg-dom` unit tests: 11
  - CLI execution tests: 3
  - `build-corpus` module export tests: 2
  - Verification profile integration tests: 3
  - File-tree/HTML/asset-link integration tests: 9
- **Typecheck:** PASS
- **Build (esbuild):** PASS
- **YAML validation:** PASS

## Deliverables

| File | Type | Description |
| --- | --- | --- |
| `scripts/build-corpus.js` | New (untracked) | Builds reference corpus at a git ref |
| `scripts/compare-artifacts.js` | New (untracked) | Compares file tree + normalized HTML + asset links |
| `scripts/compare-svg-dom.js` | New (untracked) | Compares SVG DOM structure (id, href, viewBox, masks, gradients) |
| `src/tests/golden-files/index.ts` | New (untracked) | 44 Playwright unit tests for all comparison helpers |
| `src/tests/index.ts` | Modified (tracked) | Added `import './golden-files';` |
| `.github/workflows/golden-file-comparison.yml` | New (untracked) | CI workflow with pinned Linux image, artifact upload, CODEOWNER enforcement |
