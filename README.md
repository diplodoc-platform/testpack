# Testpack

Collection of main end to end tests for Diplodoc platform

## Usage

```ts
// tests/index.spec.ts
import '@diplodoc/testpack/tests';
```

```ts
// playwright.config.ts
import config from '@diplodoc/testpack/config';

export default config({
  testDir: './tests',
});
```

## Development

```
npm ci
npm test -- --ui
# Change or add new tests
# If you use LLM:
# - Ask LLM next question: 'Can we improve something in new tests regarding on rules in "TESTS.md" manual?'
# - Add final improvments to tests with additional questions for LLM
# - Notify LLM if you are maked some changes manually. Describe changes reason.
# - Ask LLM next question: 'Should we add something to "TESTS.md" manual. If we do, then follow 'LLM editing guide' described in top comment in "TESTS.md"'
```
