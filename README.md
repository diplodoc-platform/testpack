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
# Change or add any tests
```