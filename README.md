[![NPM version](https://img.shields.io/npm/v/@diplodoc/testpack.svg?style=flat)](https://www.npmjs.org/package/@diplodoc/testpack)

# @diplodoc/testpack

Collection of end-to-end tests for Diplodoc platform. Provides Playwright test suites and configuration for testing Diplodoc documentation features including terms, tabs, cut blocks, search, and Mermaid diagrams.

## Features

- **End-to-end test suites** — Comprehensive Playwright tests for Diplodoc features
- **Test configuration** — Reusable Playwright configuration with sensible defaults
- **Test server** — Built-in Express server for serving test documentation
- **Multiple test categories** — Tests for terms, tabs, cut blocks, search, and Mermaid diagrams
- **Screenshot testing** — Visual regression testing with Playwright screenshots

## Installation

```bash
npm install @diplodoc/testpack
```

## Usage

### Importing Tests

```typescript
// tests/index.spec.ts
import '@diplodoc/testpack/tests';
```

### Using Configuration

```typescript
// playwright.config.ts
import config from '@diplodoc/testpack/config';

export default config({
  testDir: './tests',
  // Additional Playwright configuration
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm test -- --ui

# Run tests in headed mode
npm test -- --headed
```

## Development

### Setup

```bash
# Install dependencies
npm ci

# Build the package
npm run build

# Start test server
npm run start
```

### Test Development Workflow

1. Make changes or add new tests
2. Run tests: `npm test -- --ui`
3. Review test results and screenshots
4. If using LLM for test improvements:
   - Ask: "Can we improve something in new tests regarding rules in TESTS.md manual?"
   - Add final improvements with additional questions
   - Notify LLM if manual changes were made and describe reasons
   - Ask: "Should we add something to TESTS.md manual? If we do, then follow 'LLM editing guide' described in top comment in TESTS.md"

### Test Categories

The package includes test suites for:

- **Terms** — Testing term definitions and usage
- **Tabs** — Testing tab list functionality
- **Cut blocks** — Testing collapsible cut blocks
- **Search** — Testing search functionality
- **Mermaid** — Testing Mermaid diagram rendering

### Test Documentation

See [TESTS.md](./TESTS.md) for detailed testing guidelines and best practices.

## Documentation

For detailed information about architecture, development, and contributing, see [AGENTS.md](./AGENTS.md).

## License

ISC
