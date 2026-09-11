# Reproducer Fixtures

Minimized reproducer fixtures collected from real regression incidents for the Diplodoc
platform. These fixtures are used by the `document-rendering` verification profile (T7.1)
to detect visual and structural regressions when core dependencies are updated.

## Fixtures

### 1. svgo Large SVG Diagram (Issue #2218)

| Property | Value |
|----------|-------|
| File | `docs/input/assets/large-diagram.svg` |
| Size | ~45 KB |
| Entity count | 759+ |
| Issue | [svg/svgo#2218](https://github.com/svg/svgo/issues/2218) |
| Pinned version | svgo 3.3.2 |
| Failing versions | svgo 3.3.3+ with sax 1.6.0 |

**Reproduces**: `SvgoParserError: Parsed entity count exceeds max entity count` when
processing SVG files with more than 512 XML entity references. SVGO 3.3.3+ replaced
`@trysound/sax` with `sax ^1.5.0`, which introduced XXE protection with a default
`maxEntityCount = 512` limit. The fixture is a large architecture diagram with 65 nodes
(5×13 grid), 113 connectors, 2 gradients, and 759+ XML entity references (`&amp;`, `&#42;`).

**Minimization**: All text labels are anonymized to generic `N&R`, `C&S`, `Q&A` patterns.
No real system names, URLs, or data. The SVG structure represents a typical complex
diagram that a documentation system would process.

### 2. Complex Gradients & Filters

| Property | Value |
|----------|-------|
| File | `docs/input/assets/complex-gradients.svg` |
| Size | ~1.3 KB |
| Gradients | 3 (2 linear + 1 radial) |
| Filters | 1 (feGaussianBlur) |

**Reproduces**: Silent visual regressions when svgo's gradient and filter optimization
plugins change behavior across versions. Complex SVGs with multiple gradient definitions
and filter references can produce visually different output after optimization.

**Minimization**: Generic geometric shapes with no real data.

### 3. Nested Groups & Transforms

| Property | Value |
|----------|-------|
| File | `docs/input/assets/nested-groups.svg` |
| Size | ~1.3 KB |
| Nesting depth | 6 levels |
| Transforms | 6 (translate, scale, rotate) |

**Reproduces**: Structural regressions when svgo's `collapseGroups` plugin changes behavior.
Deeply nested `<g>` elements with cumulative transforms can produce different optimized
output, potentially losing transform context.

**Minimization**: Generic node labels (Node A-F) with no real data.

### 4. Transform Paths & Patterns

| Property | Value |
|----------|-------|
| File | `docs/input/assets/transform-paths.svg` |
| Size | ~0.9 KB |
| Patterns | 1 (grid) |
| Transforms | 3 (rotate + scale) |

**Reproduces**: Path optimization regressions when svgo's path plugins change behavior.
SVGs with complex path transforms and pattern fills can produce different output.

**Minimization**: Generic geometric paths with no real data.

## Integration

### Testpack Suite

The fixtures are integrated into the testpack Playwright suite at
`src/tests/reproducers/index.ts`. The suite verifies:

- SVG elements render correctly in the browser
- SVG structural elements (rect, text, line, gradient, marker, pattern, filter) are present
- SVG attributes (viewBox, xmlns, transform) are preserved
- Fixture characteristics tables are documented
- Verification integration documentation is present
- TOC navigation works

### Verification Profiles

The fixtures are used by the following verification profiles from T7.1:

| Profile | Step | Fixtures Used |
|---------|------|---------------|
| `document-transform` | artifact-compare | All SVGs (normalized HTML diff) |
| `document-rendering` | browser-visual-regression | All SVGs (Playwright visual check) |
| `document-rendering` | svg-dom-compare | large-diagram.svg (SVG DOM structure) |
| `document-rendering` | screenshot-capture | All SVGs (screenshot diff) |
| `ecosystem` | testpack-e2e | All fixtures via testpack suite |

### Regression Detection Workflow

When a core dependency (svgo, transform, cli) is updated, the `document-rendering`
profile:

1. Builds the reference corpus at the base SHA (expected output)
2. Builds the corpus at the PR head SHA (actual output)
3. Compares the output file tree and normalized HTML
4. Runs the Playwright visual regression suite
5. Compares SVG DOM structure for the large diagram
6. Captures and diffs screenshots

Any diff in the golden files requires human CODEOWNER approval before the PR can merge.

## Adding New Fixtures

To add a new reproducer fixture:

1. Create a minimized SVG file in `docs/input/assets/`
2. Add a section to `docs/input/ru/reproducers/index.md` referencing the SVG
3. Add test cases to `src/tests/reproducers/index.ts`
4. Update this documentation file
5. Update the components suite TOC count if needed (see T3.8 learnings)

### Minimization Guidelines

- Remove all real data (names, URLs, credentials, project identifiers)
- Replace text labels with generic patterns (Node A, Item 1, etc.)
- Keep the minimal structure that reproduces the issue
- Document the entity count, element count, and file size
- Reference the upstream issue or incident
