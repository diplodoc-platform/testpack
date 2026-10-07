# AGENTS.md

This file contains instructions for AI agents working with the `@diplodoc/testpack` project.

## Common Rules and Standards

**Important**: This package follows common rules and standards defined in the Diplodoc metapackage. When working in metapackage mode, refer to:

- **`.agents/style-and-testing.md`** in the metapackage root for:
  - Code style guidelines
  - **Language requirements** (commit messages, comments, docs MUST be in English)
  - Commit message format (Conventional Commits)
  - Pre-commit hooks rules (**CRITICAL**: Never commit with `--no-verify`)
  - Testing standards
  - Documentation requirements
- **`.agents/core.md`** for core concepts
- **`.agents/monorepo.md`** for workspace and dependency management
- **`.agents/dev-infrastructure.md`** for build and CI/CD

**Note**: In standalone mode (when this package is used independently), these rules still apply. If you need to reference the full documentation, check the [Diplodoc metapackage repository](https://github.com/diplodoc-platform/diplodoc).

## Project Description

`@diplodoc/testpack` is a collection of end-to-end tests for the Diplodoc platform. It provides Playwright test suites and configuration for testing various Diplodoc documentation features.

**Key Features**:

- End-to-end test suites using Playwright
- Test configuration with sensible defaults
- Built-in Express server for serving test documentation
- Multiple test categories: terms, tabs, cut blocks, search, Mermaid diagrams
- Screenshot testing for visual regression
- Used by Diplodoc platform for validating documentation features

**Primary Use Case**: Provides comprehensive end-to-end testing infrastructure for Diplodoc platform features, ensuring documentation components work correctly across different scenarios.

## Project Structure

### Main Directories

- `src/` — source code
  - `config/` — Playwright configuration
    - `index.ts` — main configuration function
  - `server/` — test server implementation
    - `index.ts` — Express server for serving test documentation
  - `tests/` — test suites
    - `index.ts` — main test entry point, imports all test suites
    - `terms/` — term definition and usage tests
    - `tabs/` — tab list functionality tests
    - `cut/` — collapsible cut block tests
    - `search/` — search functionality tests
    - `mermaid/` — Mermaid diagram rendering tests
- `tests/` — test files
  - `docs.spec.ts` — main test file that imports test suites
  - `__screenshots__/` — Playwright screenshot snapshots
- `docs/` — test documentation
  - `input/` — source YFM files for testing
  - `output/` — generated HTML output (built by `@diplodoc/cli`)
- `build/` — compiled output (generated)
- `esbuild/` — build configuration

### Configuration Files

- `package.json` — package metadata and dependencies
- `tsconfig.json` — TypeScript configuration
- `playwright.config.ts` — Playwright configuration (uses config from `src/config`)
- `TESTS.md` — detailed testing guidelines and best practices
- `VERIFICATION.md` — dependency golden-file and exact-SHA downstream verification

## Testpack maintenance contract

Testpack owns cross-package behavior that is observable through the real CLI
build and browser runtime. A package repository owns its local API, parser,
validation, error handling and combinatorial unit/integration coverage. Do not
copy a package's test suite into testpack: add one minimal document fixture and
one assertion only when they protect an end-to-end contract or a confirmed
cross-package regression.

When platform behavior intentionally changes:

1. update the source package tests first;
2. add or adjust the smallest corresponding testpack fixture when the behavior
   crosses a package boundary;
3. run both HTML and Markdown corpus comparisons plus the relevant browser
   suite;
4. inspect and explain every semantic golden or screenshot difference;
5. require human CODEOWNER approval for changed baselines instead of updating
   them automatically.

Keep fixture names and test descriptions tied to behavior, not package versions,
task numbers or release prose. Remove obsolete fixtures with the behavior they
cover. A green corpus check is evidence only for packages that the testpack CLI
build actually resolves; do not claim coverage for an extension until its real
package is wired into the fixture configuration.

Security invariants for repository tooling:

- Never execute the candidate before the baseline/comparator in a shared job.
  Keep reference and candidate on separate hosted runners, comparison data-only,
  artifact IDs bound to their producer jobs, and reusable tooling immutable
  within a run. The owner requested Action version tags and reusable callers
  at `@master` on 2026-10-03; do not reinstate Action SHA pins without approval.
  Keep exact candidate/base/tooling checkout SHAs and large workflow JavaScript
  in tested repository helpers.
- Keep runtime JS/CSS files, numeric chunks and script attributes comparable.
  Normalize only demonstrated build nondeterminism, with both positive and
  negative fixtures. Never accept a coverage gap as "identical artifacts".
- Corpus outputs must be fresh directories. Do not add recursive deletion of
  caller-supplied paths. Preserve the caller's checkout and user files on failure.
- Rendering verification must serve the already-built candidate HTML corpus
  via `scripts/candidate-browser.js`, not rebuild `docs/output` with an npm CLI.
  Preserve candidate SHA/file digests in browser evidence, disable screenshot
  updates and never reuse an existing browser server in this verification path.
- Repository comparator/downstream tests must resolve `CANDIDATE_CORPUS` using
  `scripts/repository-corpus.js`; local `docs/output` is only the default when no
  explicit corpus is supplied. Missing or invalid corpora are failures, not skips.
  Preserve hidden corpus files such as `.yfm` in both isolated producer artifacts
  so the complete browser inventory/digest can be replayed after download. Keep
  uploads scoped to the dedicated `artifacts/` directory, never the checkout.
- Search keyboard tests must wait for visible results and completed loading
  before sending one navigation key. Keep the delayed-index regression test;
  do not replace readiness assertions with sleeps or repeated key presses.
- Mini TOC navigation tests must wait for fonts and the initial active section
  before clicking SSR links. Separate offscreen scrolling from already-visible
  anchor navigation: the client deliberately does not scroll a visible heading.
  Keep the offscreen active-section assertion together with URL and viewport
  checks; never activate/scroll the target by hand or weaken the assertion.
  Failure diagnostics must retain the viewport, heading bounds and active hash.
  The opt-in Windows probe also retains native observer events and first-attempt
  traces; see MINI_TOC_DIAGNOSTICS.md. Keep the recorder behavior-neutral and
  always upload failed-attempt evidence even when a retry passes.
- Maintain focused adversarial tests under `src/tests/security`, imported only by
  `tests/repository.spec.ts`, not the published cross-package suites. See
  `VERIFICATION.md` for trust boundaries and remaining limitations.

## Tech Stack

This package follows the standard Diplodoc platform tech stack. See `.agents/dev-infrastructure.md` and `.agents/style-and-testing.md` in the metapackage root for detailed information.

**Package-specific details**:

- **Language**: TypeScript
- **Runtime**: Node.js >=11.5.1 (npm requirement)
- **Testing**: Playwright for end-to-end tests
- **Build**: esbuild
- **Dependencies**:
  - `@playwright/test` — Playwright testing framework
  - `express` — HTTP server for serving test documentation
  - `@diplodoc/cli` — peer dependency for building test documentation

## Usage Modes

This package can be used in two different contexts:

### 1. As Part of Metapackage (Workspace Mode)

When `@diplodoc/testpack` is part of the Diplodoc metapackage:

- Located at `devops/testpack/` in the metapackage
- Linked via npm workspaces
- Dependencies are shared from metapackage root `node_modules`
- Can be developed alongside other packages
- Changes are immediately available to other packages via workspace linking

**Development in Metapackage**:

```bash
# From metapackage root
cd devops/testpack
npm install  # Uses workspace dependencies

# Build
npm run build

# Run tests
npm test
```

**Using from Other Packages in Metapackage**:

- Other packages can import test suites: `import '@diplodoc/testpack/tests'`
- Can use configuration: `import config from '@diplodoc/testpack/config'`
- Workspace linking ensures local version is used
- No need to publish to npm for local development

### 2. As Standalone Package (Independent Mode)

When `@diplodoc/testpack` is used as a standalone npm package:

- Installed via `npm install @diplodoc/testpack`
- Has its own `node_modules` with all dependencies
- Can be cloned and developed independently
- Must be published to npm for others to use

**Development Standalone**:

```bash
# Clone the repository
git clone git@github.com:diplodoc-platform/testpack.git
cd testpack
npm install  # Installs all dependencies locally

# Build
npm run build

# Run tests
npm test
```

**Using in External Projects**:

```typescript
// Import test suites
import '@diplodoc/testpack/tests';

// Use configuration
import config from '@diplodoc/testpack/config';

export default config({
  testDir: './tests',
});
```

### Important Considerations

**Dependency Management**:

- In metapackage: May use dependencies from root `node_modules`
- Standalone: Must have all dependencies in local `node_modules`
- Both modes should work identically from user perspective

**Package Lock Management**:

- When adding/updating dependencies, use `npm i --no-workspaces --package-lock-only` to regenerate `package-lock.json` for standalone mode
- This ensures `package-lock.json` is valid when package is used outside workspace
- Always regenerate after dependency changes to maintain standalone compatibility

**Testing**:

- Test setup works in both modes
- Uses Playwright for end-to-end testing
- When testing, ensure dependencies are properly resolved
- Consider testing both modes if making significant changes

## Architecture

### Test Configuration

The main configuration is exported from `src/config/index.ts`:

```typescript
export default (additionals: Partial<Config>) =>
  defineConfig({
    testDir: './tests',
    baseURL: process.env.BASE_URL ?? 'https://hostmachine',
    // ... default configuration
    ...additionals,
  });
```

**Key Features**:

- Configurable base URL (defaults to `https://hostmachine` or from `BASE_URL` env var)
- Sensible defaults for test directory, output directory, snapshots
- Retry logic (2 retries in CI, 0 locally)
- Worker configuration (1 worker in CI, 4 locally)
- Screenshot configuration with strict diff checking
- HTML and JSON reporters

### Test Server

The test server (`src/server/index.ts`) is an Express application that:

- Serves static files from the built documentation directory
- Handles URL rewriting (adds `.html` extension, handles index files)
- Configurable via environment variables:
  - `PROJECT` — directory to serve (default: `docs/output`)
  - `PORT` — server port (default: 3000)

**Usage**:

```bash
# Start server manually
npm run start

# Or via Playwright webServer (automatic)
npm test  # Server starts automatically
```

### Test Suites

Test suites are organized by feature category:

- **Terms** (`src/tests/terms/`) — Tests for term definitions and usage
- **Tabs** (`src/tests/tabs/`) — Tests for tab list functionality
- **Cut** (`src/tests/cut/`) — Tests for collapsible cut blocks
- **Search** (`src/tests/search/`) — Tests for search functionality
- **Mermaid** (`src/tests/mermaid/`) — Tests for Mermaid diagram rendering

Each test suite is imported in `src/tests/index.ts`, which is then imported by the main test file `tests/docs.spec.ts`.

### Playwright Configuration

The `playwright.config.ts` file:

- Imports base configuration from `src/config`
- Configures local development settings (baseURL: `http://localhost:3000`)
- Sets up webServer to build docs and start server automatically
- Configures browser projects (chromium by default)

**Web Server Integration**:

```typescript
webServer: {
  command: 'npm run docs && npm run start',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
}
```

This automatically:

1. Builds documentation (`npm run docs`)
2. Starts the test server (`npm run start`)
3. Waits for server to be ready before running tests
4. Reuses existing server in local development (not in CI)

## Testing

### Test Structure

Tests follow the structure defined in `TESTS.md`:

- Use AAA pattern (Arrange-Act-Assert)
- Prefer full structure assertions over partial checks
- Use explicit IDs/selectors; avoid positional selectors
- Wait for states, not timeouts
- Search keyboard tests must wait for visible results, a hidden loader and input
  focus before sending one ArrowDown. Assert the selected result is active before
  Enter, then assert navigation to that result's exact document URL. Keep a slow
  search-index scenario; do not replace these assertions with a general search URL,
  repeated key presses or longer fixed waits.
- Use helper functions for element groups
- Follow Playwright best practices

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm test -- --ui

# Run tests in headed mode
npm test -- --headed

# Run specific test file
npm test -- tests/docs.spec.ts

# Update snapshots
npm test -- --update-snapshots
```

### Screenshot Testing

Playwright automatically takes screenshots for visual regression testing:

- Screenshots are stored in `tests/__screenshots__/`
- Path template: `{testDir}/__screenshots__/{testFilePath}/{projectName}/{arg}{ext}`
- Strict diff checking (maxDiffPixels: 0)
- Update snapshots when UI changes intentionally

### Test Documentation

The `TESTS.md` file contains comprehensive testing guidelines:

- Rules at a glance
- Templates and cheat sheets
- Do/Don't guidelines
- Common pitfalls
- Playwright-specific best practices
- Helper function patterns

**Important**: When updating tests, refer to `TESTS.md` for best practices. When using LLM for test improvements, follow the workflow described in the README.

## Development Workflow

### Adding a New Test Suite

1. Create test suite directory in `src/tests/` (e.g., `src/tests/newfeature/`)
2. Create `index.ts` in the new directory with test cases
3. Import the new suite in `src/tests/index.ts`
4. Add test documentation files in `docs/input/` if needed
5. Update `TESTS.md` if new patterns are introduced

### Modifying Existing Tests

1. Update test implementation in appropriate test suite
2. Run tests to verify changes: `npm test`
3. Update snapshots if UI changed: `npm test -- --update-snapshots`
4. Review test output and screenshots
5. Update `TESTS.md` if test patterns changed significantly

### Updating Dependencies

1. Update dependency versions in `package.json`
2. Test that tests still work with new versions
3. Run `npm test` to verify
4. Regenerate `package-lock.json` for standalone mode: `npm i --no-workspaces --package-lock-only`
5. Update version in `package.json` if needed

### Test Development with LLM

When using LLM for test improvements:

1. Make changes or add new tests
2. Run tests: `npm test -- --ui`
3. Ask LLM: "Can we improve something in new tests regarding rules in TESTS.md manual?"
4. Add final improvements with additional questions
5. Notify LLM if manual changes were made and describe reasons
6. Ask: "Should we add something to TESTS.md manual? If we do, then follow 'LLM editing guide' described in top comment in TESTS.md"

## Configuration

### Environment Variables

- `BASE_URL` — Base URL for tests (default: `https://hostmachine`)
- `PROJECT` — Directory to serve in test server (default: `docs/output`)
- `PORT` — Test server port (default: 3000)
- `CI` — Set automatically in CI environments, affects retries and workers

### Playwright Configuration

The configuration can be customized when importing:

```typescript
import config from '@diplodoc/testpack/config';

export default config({
  testDir: './custom-tests',
  use: {
    baseURL: 'http://custom-url',
  },
  projects: [
    {
      name: 'firefox',
      use: {...devices['Desktop Firefox']},
    },
  ],
});
```

## Integration

### Used By

- **Diplodoc platform** — uses testpack for validating documentation features
- **Other packages** — can import test suites and configuration

### Dependencies

- **`@playwright/test`** — Playwright testing framework
- **`express`** — HTTP server for serving test documentation
- **`@diplodoc/cli`** — peer dependency for building test documentation
- **`@diplodoc/lint`** — linting and code quality tools

## Important Notes

1. **Test Documentation**: The `TESTS.md` file is critical for maintaining test quality. Follow its guidelines when writing or modifying tests.

2. **Screenshot Testing**: Screenshots are stored in `tests/__screenshots__/`. Update snapshots when UI changes intentionally.

3. **Test Server**: The test server automatically starts via Playwright's `webServer` configuration. Ensure `@diplodoc/cli` is available for building docs.

4. **Standalone Compatibility**: This package must work both in metapackage and standalone modes. Always test both scenarios.

5. **LLM Workflow**: When using LLM for test improvements, follow the workflow described in the README and `TESTS.md`.

6. **Test Categories**: Tests are organized by feature category. Keep related tests together in the same suite.

7. **Configuration Reusability**: The configuration function is designed to be reusable. Keep defaults sensible and allow customization.

8. **Type Safety**: The package uses strict TypeScript typing. Ensure all test code is properly typed.

9. **Playwright Best Practices**: Follow Playwright best practices: use stable selectors, wait for states, avoid timeouts, use helper functions.

10. **Documentation Updates**: When adding new test patterns or significant changes, consider updating `TESTS.md` following the LLM editing guide.

## Additional Resources

- `README.md` — main documentation
- `TESTS.md` — detailed testing guidelines and best practices
- Metapackage `.agents/` — platform-wide agent documentation
- `@diplodoc/lint` documentation — linting and formatting setup
- `@diplodoc/tsconfig` — TypeScript configuration reference
- [Playwright documentation](https://playwright.dev/) — Playwright testing framework docs
