<!-- LLM editing guide: When updating this file, follow these mandatory steps.
1) First, add a new section or improve/update an existing one (do not start with summaries).
2) Then, scan the whole document for logical conflicts or contradictions introduced by your change. If conflicts exist, resolve them (prefer the most recent, clearer guideline; remove duplicates; align terminology).
3) Finally, update the top summary sections (Rules at a glance, Quick links, Templates, Cheat sheets, Do/Don’t, Common pitfalls, Decision tree, Playwright TL;DR) to reflect the new or changed content.
Keep edits minimal, consistent in style, and aligned with the existing anchors.
-->

# Unit Test Guidelines

<!-- Rules at a glance -->

<a id="rules-at-a-glance"></a>

## Rules at a glance

1. Prefer full structure assertions over partial checks
2. Follow AAA (Arrange-Act-Assert) consistently
3. Test behavior, not implementation details
4. Use explicit IDs/selectors; avoid positional selectors
5. Wait for states, not timeouts (no fixed delays)
6. Use modern matchers (toBeTypeOf, objectContaining, arrayContaining)
7. Extract repeated setup into helpers/factories
8. Avoid redundant toBeTruthy() before toEqual()
9. Keep tests independent and deterministic
10. Name tests clearly; prefer user-centered language

<a id="quick-links"></a>

## Quick links

- [1. Rules at a glance](#rules-at-a-glance)
- [2. Templates](#templates)
- [3. Cheat sheets](#cheat-sheets)
- [4. Do/Don’t](#dodont)
- [5. Common pitfalls](#common-pitfalls)
- [6. Decision tree](#decision-tree)
- [7. Playwright TL;DR](#playwright-tldr)
- [8. General Principles](#general-principles)

<a id="templates"></a>

## Templates

### AAA unit test

```typescript
it('should <behavior>', async () => {
  // Arrange
  const input = createInput();

  // Act
  const result = await subject(input);

  // Assert
  expect(result).toEqual(expectedResult);
});
```

### Module mock

```typescript
vi.mock('execa', () => ({execa: vi.fn()}));
vi.mocked(execa).mockResolvedValue({stdout: 'data'} as any);
```

### Playwright test (canonical)

```typescript
test('navigates by hash and scrolls target into viewport', async ({page}) => {
  // Arrange
  await page.goto(`./ru/syntax/cut#${CUT_IDS.BASIC}`);

  // Act
  const target = page.locator(`#${CUT_IDS.BASIC}`);

  // Assert
  await expect(target).toHaveAttribute('open');
  await expect(target).toBeInViewport();
});
```

<a id="cheat-sheets"></a>

## Cheat sheets

### Matchers

- toEqual: full structure equality
- objectContaining / arrayContaining: partial structure
- toBeTypeOf: primitive type checks
- toMatch / stringMatching: pattern checks
- toThrow / rejects.toThrow: error checks

### Playwright quick rules

- Select by stable IDs; avoid .first() / .nth()
- Assert states (toBeVisible, toHaveAttribute), avoid waitForTimeout
- Use toBeInViewport() for scroll expectations
- Group related tests with test.describe()

<a id="dodont"></a>

## Do/Don’t

| Do                              | Don’t                                         |
| ------------------------------- | --------------------------------------------- |
| Assert full object with toEqual | Check only presence with toBeTruthy + toEqual |
| Use IDs for selectors           | Use positional selectors (.first, .nth)       |
| Wait for states                 | Use fixed delays                              |
| Test behavior                   | Test internal calls/impl                      |
| Extract setup helpers           | Copy-paste setup                              |

<a id="common-pitfalls"></a>

## Common pitfalls

- Redundant presence checks before structural assertions
- Fixed delays instead of state-based waits
- Positional selectors causing flaky e2e tests
- Over-mocking leading to testing implementation
- Vague test names that hide intent

<a id="decision-tree"></a>

## Decision tree

1. Need to assert object? → toEqual; large? → keys + selective toEqual; partial? → objectContaining
2. Array? → toEqual; partial/membership? → arrayContaining / toContain
3. Type? → toBeTypeOf (not typeof)
4. DOM visibility/state? → toBeVisible / toHaveAttribute
5. Scrolling/viewport? → toBeInViewport (avoid timeouts)

<a id="playwright-tldr"></a>

## Playwright TL;DR

1. Navigate to stable URL; prefer per-test navigation
2. Locate by ID or data-testid
3. Assert state, not time
4. Use toBeInViewport for scroll
5. Avoid .first()/.nth(); target explicit nodes
6. Use test.beforeEach only for neutral setup
7. Keep tests independent; one scenario per test

<a id="general-principles"></a>

## General Principles

### 1. Readability and Clarity

- Tests should be self-documenting
- Test names must clearly describe the behavior under test
- Use descriptive variables and comments

### 2. Test Isolation

- Each test must be independent
- Use `beforeEach`/`afterEach` for setup and cleanup
- Mock external dependencies

### 3. Test Structure (AAA Pattern)

```typescript
it('should do something', async () => {
  // Arrange - prepare data
  const input = 'test data';

  // Act - perform action
  const result = await functionUnderTest(input);

  // Assert - verify result
  expect(result).toBe('expected');
});
```

<a id="code-style"></a>

## Code Style

### 1. Multiline Strings

**Use `ts-dedent` for multiline strings:**

```typescript
// ✅ Good
import {dedent} from 'ts-dedent';

const sample = dedent`
    commit abcdef1234567890
    author: login1
    date: 2025-01-01T00:00:00Z
    revision: 1

        Message line

    A   file1.md
    D   file2.yaml

`;

// ❌ Bad
const sample = [
  'commit abcdef1234567890',
  'author: login1',
  'date: 2025-01-01T00:00:00Z',
  'revision: 1',
  '',
  '    Message line',
  '',
  'A   file1.md',
  'D   file2.yaml',
  '',
].join('\n');
```

### 2. Object Assertions

**Group property checks into a single object assertion:**

```typescript
// ✅ Good
expect(result).toEqual({
  login: 'author1',
  commit: 'commit1',
});

// ❌ Bad
expect(result.login).toBe('author1');
expect(result.commit).toBe('commit1');
```

### 3. Array Assertions

**Avoid redundant length checks:**

```typescript
// ✅ Good
const logins = list.map((c) => c.login).sort();
expect(logins).toEqual(['author1', 'author2', 'author3']);

// ❌ Bad
expect(list.length).toBe(3);
const logins = list.map((c) => c.login).sort();
expect(logins).toEqual(['author1', 'author2', 'author3']);
```

### 4. Type Assertions

**Use modern matchers:**

```typescript
// ✅ Good
expect(value).toBeTypeOf('number');
expect(value).toBeTypeOf('string');
expect(value).toBeTypeOf('object');

// ❌ Bad
expect(typeof value).toBe('number');
expect(typeof value).toBe('string');
expect(typeof value).toBe('object');
```

<a id="test-evolution"></a>

## Test Evolution and Improvement

### 1. Review Existing Tests

**Regularly review and improve existing tests:**

```typescript
// 🔍 Review: what can be improved?
it('should parse authors', async () => {
  const client = createClientWithSampleData(BASIC_COMMIT_SAMPLE);
  const authors = await client.getAuthors();

  // ❌ Bad - only keys are checked
  expect(Object.keys(authors)).toEqual(expect.arrayContaining(['file1.md']));

  // ✅ Good - full structure is verified
  expect(authors).toEqual({
    'file1.md': {
      login: 'login1',
      commit: 'abcdef1234567890',
    },
  });
});
```

### 2. Test Refactoring Principles

**Follow these principles when improving tests:**

1. **Replace partial checks with full assertions:**

   ```typescript
   // ❌ Bad - partial check
   expect(authors['file1.md']).toBeTruthy();
   expect(authors['file0.md']).toBeTruthy();

   // ✅ Good - full assertion
   expect(authors).toEqual({
     'file1.md': {login: 'author2', commit: 'commit2'},
     'file0.md': {login: 'author1', commit: 'commit1'},
   });
   ```

2. **Combine multiple assertions where appropriate:**

   ```typescript
   // ❌ Bad - multiple assertions
   expect(authors['old_file.md']).toBeUndefined();
   expect(authors['new_file.md']).toEqual({
     login: 'renamer',
     commit: 'rename_commit',
   });

   // ✅ Good - single assertion
   expect(authors).toEqual({
     'new_file.md': {
       login: 'renamer',
       commit: 'rename_commit',
     },
   });
   ```

3. **Remove redundant assertions:**

   ```typescript
   // ❌ Bad - redundant assertions
   expect(contributors['file1.md']).toBeTruthy();
   const list = contributors['file1.md'];
   expect(Array.isArray(list)).toBe(true);
   expect(list.length).toBeGreaterThan(0);

   // ✅ Good - structure assertion
   expect(contributors).toEqual({
     'file1.md': [{login: 'login1', commit: 'abcdef1234567890'}],
   });
   ```

### 3. Test Quality Metrics

**Evaluate test quality by these criteria:**

- **Conciseness** - fewer lines of code
- **Readability** - clear structure and expectations
- **Reliability** - verify full structure, not just parts
- **Maintainability** - easy to understand failures
- **Consistency** - unified approach to assertions

### 4. Step-by-step Improvement Process

**A systematic approach to improving tests:**

1. **Analyze** - find partial assertions
2. **Plan** - define the full expected structure
3. **Refactor** - replace partial checks with full assertions
4. **Test** - ensure tests pass
5. **Document** - update comments and docs

```typescript
// Example step-by-step improvement
// Step 1: Analyze
it('should handle complex scenario', async () => {
  const result = await service.process();
  expect(result.property1).toBeTruthy(); // ❌ Partial check
  expect(result.property2).toBeTruthy(); // ❌ Partial check
});

// Step 2: Plan
// Define the full expected structure

// Step 3: Refactor
it('should handle complex scenario', async () => {
  const result = await service.process();
  expect(result).toEqual({
    // ✅ Full assertion
    property1: {value: 'expected1'},
    property2: {value: 'expected2'},
  });
});
```

<a id="mocks-and-stubs"></a>

## Mocks and Stubs

### 1. Module-level Mocks

```typescript
// ✅ Good
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

// In the test
vi.mocked(execa).mockResolvedValue({stdout: 'data'} as any);
```

### 2. Clearing Mocks

```typescript
afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});
```

### 3. Mock Typing

```typescript
// ✅ Good
vi.mocked(execa).mockResolvedValue({stdout: sample} as any);

// ❌ Bad
(execa as any).mockResolvedValue({stdout: sample});
```

<a id="test-organization"></a>

## Test Organization

### 1. Grouping Tests

```typescript
describe('ArcadiaLogClient', () => {
  describe('basic functionality', () => {
    it('should parse authors', async () => {
      // ...
    });

    it('should parse contributors', async () => {
      // ...
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', async () => {
      // ...
    });
  });
});
```

### 2. Test Names

```typescript
// ✅ Good
it('should respect initialCommit for authors', async () => {
it('should handle file rename correctly for contributors', async () => {
it('should handle empty log with initialCommit', async () => {

// ❌ Bad
it('should work', async () => {
it('test 1', async () => {
it('does something', async () => {
```

### 3. Comments in Tests

```typescript
// ✅ Good
// The author should be the one who created the file within the limited history
expect(authors['file1.md'].login).toBe('author2');

// The old file should not exist, as it was renamed
expect(authors['old_file.md']).toBeUndefined();

// ❌ Bad
expect(authors['file1.md'].login).toBe('author2'); // unnecessary inline explanation
```

<a id="error-handling"></a>

## Error Handling

### 1. Exception Assertions

```typescript
// ✅ Good
await expect(asyncFunction()).rejects.toThrow('Expected error message');

// ❌ Bad
try {
  await asyncFunction();
  expect(true).toBe(false); // should not run
} catch (error) {
  expect((error as Error).message).toBe('Expected error message');
}
```

### 2. Asserting Missing Values

```typescript
// ✅ Good
expect(result).toBeUndefined();
expect(result).toBeNull();
expect(result).toBeFalsy();

// ❌ Bad
expect(result === undefined).toBe(true);
expect(result === null).toBe(true);
```

<a id="performance"></a>

## Performance

### 1. Avoid Redundant Assertions

```typescript
// ✅ Good - assert only what matters
expect(result).toEqual(expectedObject);

// ❌ Bad - redundant checks
expect(result).toBeTruthy();
expect(result.property1).toBe(expectedObject.property1);
expect(result.property2).toBe(expectedObject.property2);
```

**Do not use `toBeTruthy()` before structural assertions:**

```typescript
// ❌ Bad - redundant check
expect(authors['file1.md']).toBeTruthy();
expect(authors['file1.md']).toEqual({
  login: 'author2',
  commit: 'commit2',
});

// ✅ Good - assert only the structure
expect(authors['file1.md']).toEqual({
  login: 'author2',
  commit: 'commit2',
});
```

**Use `toBeTruthy()` only when you must check existence before accessing properties:**

```typescript
// ✅ Good - verify existence before accessing properties
expect(contributors['file1.md']).toBeTruthy();
const list = contributors['file1.md'];
expect(Array.isArray(list)).toBe(true);
expect(list.length).toBeGreaterThan(0);
```

**Prefer type checks over existence checks:**

```typescript
// ❌ Bad
expect(mtimes['file1.md']).toBeTruthy();
expect(mtimes['file1.md']).toBeTypeOf('number');

// ✅ Good
expect(mtimes['file1.md']).toBeTypeOf('number');
```

### 2. Assert Full Object Structure

**Prefer full object assertions over individual properties:**

```typescript
// ❌ Bad - only existence is checked
expect(authors['file1.md']).toBeTruthy();
expect(authors['file0.md']).toBeTruthy();

// ✅ Good - assert the full structure
expect(authors).toEqual({
  'file1.md': {
    login: 'author2',
    commit: 'commit2',
  },
  'file0.md': {
    login: 'author1',
    commit: 'commit1',
  },
});
```

**For large objects, combine key checks with structure checks:**

```typescript
// ✅ Good - for large objects
expect(Object.keys(authors)).toEqual(['file1.md', 'file0.md', 'file3.md']);
expect(authors['file1.md']).toEqual({
  login: 'author2',
  commit: 'commit2',
});
expect(authors['file0.md']).toEqual({
  login: 'author1',
  commit: 'commit1',
});
```

**Use `expect.objectContaining()` for partial assertions:**

```typescript
// ✅ Good - assert only important properties
expect(authors).toEqual(
  expect.objectContaining({
    'file1.md': {
      login: 'author2',
      commit: expect.stringMatching(/^commit/),
    },
  }),
);
```

### 2. Use Appropriate Matchers

```typescript
// ✅ Good
expect(array).toContain(item);
expect(array).toEqual(expect.arrayContaining([item1, item2]));

// ❌ Bad
expect(array.includes(item)).toBe(true);
```

<a id="best-practices"></a>

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ✅ Good - test the result
expect(await client.getAuthors()).toEqual(expectedAuthors);

// ❌ Bad - test internal details
expect(client.internalMethod).toHaveBeenCalledWith('param');
```

### 2. Use Constants for Repeated Data

```typescript
// ✅ Good
const COMMIT_SAMPLE = dedent`
    commit abcdef1234567890
    author: login1
    date: 2025-01-01T00:00:00Z
    revision: 1

        Message line

    A   file1.md
`;

// In tests
const sample = COMMIT_SAMPLE;
```

### 3. Group Related Assertions

```typescript
// ✅ Good
describe('when file is renamed', () => {
  it('should remove old file from authors', async () => {
    // ...
  });

  it('should add new file to authors', async () => {
    // ...
  });
});
```

### 4. Grouping Arrange Logic

**Extract repeated setup into helper functions:**

```typescript
// ✅ Good
describe('ArcadiaLogClient', () => {
  // Common helper to create client with base data
  function createClientWithSampleData(sample: string, config: any = {vcs: {}}) {
    vi.mocked(execa).mockResolvedValue({stdout: sample} as any);
    return new ArcadiaLogClient(config, baseDir as string);
  }

  // Shared test data
  const BASIC_COMMIT_SAMPLE = dedent`
        commit abcdef1234567890
        author: login1
        date: 2025-01-01T00:00:00Z
        revision: 1

            Message line

        A   file1.md
        D   file2.yaml

    `;

  const MULTIPLE_COMMITS_SAMPLE = dedent`
        commit commit3
        author: author3
        date: 2025-01-03T00:00:00Z
        revision: 3

            Third commit

        M   file1.md

        commit commit2
        author: author2
        date: 2025-01-02T00:00:00Z
        revision: 2

            Second commit

        M   file1.md

        commit commit1
        author: author1
        date: 2025-01-01T00:00:00Z
        revision: 1

            First commit

        A   file1.md

    `;

  it('should parse authors', async () => {
    // Arrange
    const client = createClientWithSampleData(BASIC_COMMIT_SAMPLE);

    // Act
    const authors = await client.getAuthors();

    // Assert
    expect(Object.keys(authors)).toEqual(expect.arrayContaining(['file1.md']));
  });

  it('should handle multiple commits for authors', async () => {
    // Arrange
    const client = createClientWithSampleData(MULTIPLE_COMMITS_SAMPLE);

    // Act
    const authors = await client.getAuthors();

    // Assert
    expect(authors['file1.md']).toEqual({
      login: 'author1',
      commit: 'commit1',
    });
  });
});
```

**Use factories for more complex setups:**

```typescript
// ✅ Good
describe('UserService', () => {
  // Factory for creating users
  function createUser(overrides: Partial<User> = {}): User {
    return {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      ...overrides,
    };
  }

  // Factory for test data
  function createTestData() {
    return {
      users: [
        createUser({id: 'user-1', role: 'admin'}),
        createUser({id: 'user-2', role: 'user'}),
        createUser({id: 'user-3', role: 'moderator'}),
      ],
      permissions: ['read', 'write', 'delete'],
    };
  }

  it('should filter users by role', async () => {
    // Arrange
    const testData = createTestData();
    const service = new UserService(testData.users);

    // Act
    const admins = await service.getUsersByRole('admin');

    // Assert
    expect(admins).toHaveLength(1);
    expect(admins[0].id).toBe('user-1');
  });
});
```

**Use builder pattern for complex objects:**

```typescript
// ✅ Good
class TestDataBuilder {
  private data: any = {};

  withUsers(count: number): TestDataBuilder {
    this.data.users = Array.from({length: count}, (_, i) => ({
      id: `user-${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
    }));
    return this;
  }

  withPermissions(permissions: string[]): TestDataBuilder {
    this.data.permissions = permissions;
    return this;
  }

  withConfig(config: any): TestDataBuilder {
    this.data.config = config;
    return this;
  }

  build() {
    return this.data;
  }
}

describe('ComplexService', () => {
  it('should process complex data', async () => {
    // Arrange
    const testData = new TestDataBuilder()
      .withUsers(3)
      .withPermissions(['read', 'write'])
      .withConfig({feature: true})
      .build();

    const service = new ComplexService(testData);

    // Act
    const result = await service.process();

    // Assert
    expect(result).toBeDefined();
  });
});
```

**❌ Bad - code duplication:**

```typescript
// ❌ Bad
it('should parse authors', async () => {
  const sample = dedent`
        commit abcdef1234567890
        author: login1
        date: 2025-01-01T00:00:00Z
        revision: 1

            Message line

        A   file1.md
        D   file2.yaml

    `;
  vi.mocked(execa).mockResolvedValue({stdout: sample} as any);
  const client = new ArcadiaLogClient({vcs: {}}, baseDir as string);
  // ...
});

it('should parse contributors', async () => {
  const sample = dedent`
        commit abcdef1234567890
        author: login1
        date: 2025-01-01T00:00:00Z
        revision: 1

            Message line

        A   file1.md
        D   file2.yaml

    `;
  vi.mocked(execa).mockResolvedValue({stdout: sample} as any);
  const client = new ArcadiaLogClient({vcs: {}}, baseDir as string);
  // ...
});
```

### 5. Contrastive Assertions

**Add contrastive checks to clarify behavior:**

```typescript
// ✅ Good
it('should handle file deletion with initialCommit', async () => {
  const client = createClientWithSampleData(DELETE_SAMPLE, {vcs: {initialCommit: 'modify_commit'}});

  const authors = await client.getAuthors();

  // File must not exist (deleted)
  expect(authors['file_to_delete.md']).toBeUndefined();

  // File must exist (not deleted)
  expect(authors['file0.md']).toEqual({
    login: 'modifier',
    commit: 'modify_commit',
  });
});
```

**❌ Bad - only one assertion:**

```typescript
// ❌ Bad
it('should handle file deletion', async () => {
  const client = createClientWithSampleData(DELETE_SAMPLE);
  const authors = await client.getAuthors();

  // Only absence is checked
  expect(authors['file_to_delete.md']).toBeUndefined();
});
```

### 6. Correct Understanding of Logic

**Ensure you correctly understand the logic under test:**

```typescript
// ✅ Good - correct understanding of initialCommit
it('should handle initialCommit correctly', async () => {
  // Logic: traverse commits from latest to earliest, stop at initialCommit
  const client = createClientWithSampleData(SAMPLE, {vcs: {initialCommit: 'commit2'}});

  const authors = await client.getAuthors();
  // commit3 (latest) - deletes file
  // commit2 (initialCommit) - creates file ← stop here
  // commit1 (earliest) - not processed

  expect(authors['file.md']).toBeUndefined(); // File is created, then deleted
});
```

**❌ Bad - incorrect understanding:**

```typescript
// ❌ Bad - incorrect understanding
it('should handle initialCommit incorrectly', async () => {
  const client = createClientWithSampleData(SAMPLE, {vcs: {initialCommit: 'commit2'}});

  const authors = await client.getAuthors();
  // Incorrect expectation - file should exist
  expect(authors['file.md']).toBeTruthy(); // This is wrong!
});
```

### 7. Debugging Tests

**Use temporary debug output to understand issues:**

```typescript
// ✅ Good - temporary debugging
it('should handle complex scenario', async () => {
  const client = createClientWithSampleData(COMPLEX_SAMPLE);

  const result = await client.process();
  console.log('Debug result:', result); // Temporary during debugging

  expect(result).toEqual(expectedValue);
});
```

**Remove console.log after debugging:**

```typescript
// ✅ Good - after debugging
it('should handle complex scenario', async () => {
  const client = createClientWithSampleData(COMPLEX_SAMPLE);

  const result = await client.process();

  expect(result).toEqual(expectedValue);
});
```

### 8. Fixing Test Failures

**When fixing test failures:**

1. **Verify data** - ensure test data matches expectations
2. **Verify logic** - ensure you understand the behavior
3. **Use debugging** - add temporary console.log to understand the issue
4. **Update comments** - keep comments accurate
5. **Check consistency** - ensure related tests are correct

```typescript
// ✅ Good - fix with comment
it('should handle edge case', async () => {
  // FIXED: initially expected file.md, but it's created in commit2, not commit1
  const client = createClientWithSampleData(SAMPLE, {vcs: {initialCommit: 'commit2'}});

  const authors = await client.getAuthors();
  expect(authors['file.md']).toEqual({
    login: 'author2', // FIXED: was 'author1'
    commit: 'commit2', // FIXED: was 'commit1'
  });
});
```

### 5. Practical Examples of Improvements

**Real examples from test refactoring experience:**

#### Example 1: Simplifying existence checks

```typescript
// ❌ Before - 4 assertions
it('should parse contributors', async () => {
  const contributors = await client.getContributors();
  expect(contributors['file1.md']).toBeTruthy();
  const list = contributors['file1.md'];
  expect(Array.isArray(list)).toBe(true);
  expect(list.length).toBeGreaterThan(0);
});

// ✅ After - 1 assertion
it('should parse contributors', async () => {
  const contributors = await client.getContributors();
  expect(contributors).toEqual({
    'file1.md': [{login: 'login1', commit: 'abcdef1234567890'}],
  });
});
```

#### Example 2: Combining multiple assertions

```typescript
// ❌ Before - 2 assertions
it('should handle file rename', async () => {
  const authors = await client.getAuthors();
  expect(authors['old_file.md']).toBeUndefined();
  expect(authors['new_file.md']).toEqual({
    login: 'renamer',
    commit: 'rename_commit',
  });
});

// ✅ After - 1 assertion
it('should handle file rename', async () => {
  const authors = await client.getAuthors();
  expect(authors).toEqual({
    'new_file.md': {
      login: 'renamer',
      commit: 'rename_commit',
    },
  });
});
```

#### Example 3: Replacing partial checks with full assertions

```typescript
// ❌ Before - only keys are checked
it('should parse authors', async () => {
  const authors = await client.getAuthors();
  expect(Object.keys(authors)).toEqual(expect.arrayContaining(['file1.md']));
});

// ✅ After - full structure asserted
it('should parse authors', async () => {
  const authors = await client.getAuthors();
  expect(authors).toEqual({
    'file1.md': {
      login: 'login1',
      commit: 'abcdef1234567890',
    },
  });
});
```

### 6. Test Review Checklist

**Questions to assess test quality:**

- [ ] Does the test assert the full structure?
- [ ] Can multiple assertions be combined?
- [ ] Any redundant assertions (`toBeTruthy()` before `toEqual()`)?
- [ ] Does the test use modern matchers (`toBeTypeOf()`)?
- [ ] Is the test readable without extra comments?
- [ ] Does it follow the project's test style?
- [ ] Can setup be reused?
- [ ] Are there contrastive checks for edge cases?

### 7. Improvement Stats

**Typical outcomes of test refactoring:**

| Metric          | Before  | After | Gain  |
| --------------- | ------- | ----- | ----- |
| Lines of code   | 15-20   | 5-8   | -60%  |
| Assertions      | 4-6     | 1-2   | -70%  |
| Readability     | Medium  | High  | +40%  |
| Reliability     | Partial | Full  | +100% |
| Maintainability | Hard    | Easy  | +50%  |

<a id="tooling"></a>

## Tooling

### 1. Vitest

- Use `vi.mock()` for mocks
- Use `vi.spyOn()` for spies
- Use `vi.fn()` to create mock functions

### 2. TypeScript

- Type your mocks
- Avoid `any` where possible
- Use `as` assertions only when necessary

### 3. Debugging

```typescript
// For debugging tests
console.log('Debug info:', data);
// Remove debug code before committing
```

<a id="playwright-tests"></a>

## Playwright Tests

### 1. Reliable Selectors

**Avoid positional selectors; prefer unique identifiers:**

```typescript
// ✅ Good - use ID selectors
const basicCut = page.locator(`#${CUT_IDS.BASIC}`);
const htmlCut = page.locator(`#${CUT_IDS.HTML}`);
const outerCut = page.locator(`#${CUT_IDS.OUTER}`);

// ❌ Bad - positional selectors
const firstCut = page.locator(selectors.cut).first();
const secondCut = page.locator(selectors.cut).nth(1);
const cuts = page.locator(selectors.cut);
const firstCut = cuts.nth(0);
```

**Use constants for element IDs:**

```typescript
// ✅ Good - constants for IDs
const CUT_IDS = {
  BASIC: 'basic-cut',
  HTML: 'html-cut',
  CODE: 'code-cut',
  NESTED: 'nested-cut',
  OUTER: 'outer-cut',
  INNER: 'inner-cut',
  BOLD: 'bold-cut',
  ITALIC: 'italic-cut',
  CODE_TITLE: 'code-title-cut',
  EMPTY: 'empty-cut',
  LIST_1: 'list-cut-1',
  LIST_2: 'list-cut-2',
  HEIGHT_SHORT: 'height-short',
  HEIGHT_TALL: 'height-tall',
} as const;
```

### 2. Viewport Visibility

**Add assertions that elements are within the viewport:**

```typescript
// ✅ Good - verify viewport
test('should scroll to cut when opened via hash', async ({page}) => {
  await page.goto(`./ru/syntax/cut#${CUT_IDS.HEIGHT_TALL}`);

  const tallCut = page.locator(`#${CUT_IDS.HEIGHT_TALL}`);

  // Assert - Cut should be expanded
  await expect(tallCut).toHaveAttribute('open');

  // Assert - Cut should be visible in viewport (scrolled to)
  await expect(tallCut).toBeInViewport();
});
```

### 3. Playwright Test Structure

**Follow the AAA pattern (Arrange-Act-Assert):**

```typescript
test('should expand cut when URL contains hash', async ({page}) => {
  // Arrange - Navigate with hash for basic cut
  await page.goto(`./ru/syntax/cut#${CUT_IDS.BASIC}`);

  // Get the cut by ID
  const basicCut = page.locator(`#${CUT_IDS.BASIC}`);

  // Assert - Cut should be expanded and highlighted
  await expect(basicCut).toHaveAttribute('open');

  // Assert - Cut should be visible in viewport
  await expect(basicCut).toBeInViewport();
});
```

### 4. Grouping Tests

**Use `test.describe()` for logical grouping:**

```typescript
test.describe('URL hash functionality', () => {
  test.beforeEach(async ({page}) => {
    await page.goto(`./`);
  });

  test('should expand cut when URL contains hash', async ({page}) => {
    // ...
  });

  test('should scroll to cut when opened via hash', async ({page}) => {
    // ...
  });

  test('should expand nested cut when URL contains inner cut hash', async ({page}) => {
    // ...
  });
});
```

### 5. Constants and Selectors

**Extract selectors into constants:**

```typescript
const selectors = {
  cut: '.yfm-cut',
  cutTitle: '.yfm-cut-title',
  cutContent: '.yfm-cut-content',
  cutButton: 'summary.yfm-cut-title',
  expanded: '[open]',
  highlight: '.cut-highlight',
} as const;
```

### 6. Handling Async Operations

**Use state-based waits instead of fixed delays:**

```typescript
// ✅ Good - wait for element to appear
await expect(page.locator(`#${CUT_IDS.BASIC}`)).toBeVisible();

// ✅ Good - wait for state change
await expect(page.locator(`#${CUT_IDS.BASIC}`)).toHaveAttribute('open');

// ❌ Bad - fixed delays
await page.waitForTimeout(1000);
```

### 7. Asserting Element States

**Assert complete element state:**

```typescript
// ✅ Good - assert multiple aspects
const basicCut = page.locator(`#${CUT_IDS.BASIC}`);
await expect(basicCut).toHaveAttribute('open');
await expect(basicCut).toBeInViewport();
await expect(basicCut).toHaveClass(/cut-highlight/);

// ❌ Bad - single aspect only
await expect(basicCut).toHaveAttribute('open');
```

### 8. Testing Interactivity

**Verify user interactions:**

```typescript
test('should expand and collapse content when clicking button', async ({page}) => {
  // Arrange
  const basicCut = page.locator(`#${CUT_IDS.BASIC}`);
  const content = basicCut.locator(selectors.cutContent);
  const button = basicCut.locator(selectors.cutButton);

  // Act - Expand
  await button.click();

  // Assert - Content should be visible
  await expect(content).toBeVisible();
  await expect(basicCut).toHaveAttribute('open');

  // Act - Collapse
  await button.click();

  // Assert - Content should be hidden
  await expect(content).not.toBeVisible();
  await expect(basicCut).not.toHaveAttribute('open');
});
```

### 9. Keyboard Navigation and A11y

**Verify accessibility and keyboard navigation:**

```typescript
test('should have proper ARIA attributes and keyboard navigation', async ({page}) => {
  // Arrange
  const basicCut = page.locator(`#${CUT_IDS.BASIC}`);
  const button = basicCut.locator(selectors.cutButton);
  const content = basicCut.locator(selectors.cutContent);

  // Assert - Initial state
  await expect(basicCut).not.toHaveAttribute('open');

  // Act - Expand via click
  await button.click();

  // Assert - Expanded state
  await expect(basicCut).toHaveAttribute('open');

  // Act - Collapse via keyboard
  await button.focus();
  await page.keyboard.press('Enter');

  // Assert - Collapsed state
  await expect(content).not.toBeVisible();
  await expect(basicCut).not.toHaveAttribute('open');
});
```

### 10. Avoid Anti-patterns

**Do not use unreliable selectors:**

```typescript
// ❌ Bad - positional selectors
const firstCut = page.locator(selectors.cut).first();
const secondCut = page.locator(selectors.cut).nth(1);
const cuts = page.locator(selectors.cut);
const firstCut = cuts.nth(0);

// ❌ Bad - fixed delays
await page.waitForTimeout(1000);

// ❌ Bad - redundant checks
await expect(element).toBeTruthy();
await expect(element).toHaveAttribute('open');

// ❌ Bad - non-descriptive names
test('test 1', async ({page}) => {
  // ...
});
```

### 11. Stability Best Practices

**Follow these principles for stable tests:**

1. **Use unique IDs** instead of positional selectors
2. **Assert viewport visibility** when elements should be visible
3. **Wait for states** instead of fixed delays
4. **Group related tests** with `test.describe()`
5. **Use constants** for selectors and IDs
6. **Assert complete state** of elements
7. **Test full user flows** end-to-end
8. **Add accessibility checks** where appropriate

<a id="examples"></a>

## Examples

### Complete Test Example

```typescript
import {describe, expect, it, vi, afterEach} from 'vitest';
import {dedent} from 'ts-dedent';

describe('MyService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should process valid input correctly', async () => {
    // Arrange
    const input = dedent`
            line 1
            line 2
            line 3
        `;

    // Act
    const result = await service.process(input);

    // Assert
    expect(result).toEqual({
      processed: true,
      lines: 3,
    });
  });
});
```
