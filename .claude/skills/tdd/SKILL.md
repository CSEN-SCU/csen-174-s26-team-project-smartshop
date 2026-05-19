---
name: tdd
description: "Use this skill to generate, review, or improve tests for the SmartShop codebase using TDD. Triggers include: writing new tests, generating RED tests before implementation, turning RED tests GREEN, checking test coverage, writing unit tests for database functions, writing integration tests for API routes, or writing AI-behavior tests. Use for any task involving Jest, ts-jest, or testing TypeScript/Next.js code in this repo."
---

# TDD Skill for SmartShop

## Overview

SmartShop uses Jest with ts-jest for testing. The stack is Next.js 14, TypeScript, SQLite (better-sqlite3), and the **OpenAI** API (Divya prototype: `/api/chat` and `/api/similar-alternatives`). Tests live next to the files they test.

## Test File Locations

| Test type | File location |
|-----------|--------------|
| Database unit tests | src/lib/db.test.ts |
| API integration tests | src/app/api/chat/route.test.ts |
| AI behavior tests | src/app/api/chat/ai-behavior.test.ts |

## Running Tests

```bash
npm install
npm test
```

## TDD Workflow

Always follow RED then GREEN then REFACTOR:

1. RED: Write a test for functionality that does not exist yet. Run npm test and confirm it fails.
2. GREEN: Write the minimum code to make the test pass. Run npm test and confirm it passes.
3. REFACTOR: Clean up without breaking tests.

## Writing Unit Tests (Database Layer)

Always call clearMessages() in beforeEach to reset state between tests.

```typescript
import { getPricesForItems, saveMessage, getRecentMessages, clearMessages } from "./db";

beforeEach(() => {
  clearMessages();
});

test("describes the behavior, not the implementation", () => {
  // ARRANGE
  // ACT
  // ASSERT
});
```

Test behavior, not implementation. Ask "what does the caller experience?" not "how is it built?"

Good: expect(getPricesForItems(["eggs"])).toBeDefined()
Bad: expect(dbPrepare).toHaveBeenCalledWith("SELECT...")

## Writing Integration Tests (API Route)

Mock the OpenAI SDK and set `OPENAI_API_KEY` before importing the route.

```typescript
jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    responses: {
      create: jest.fn().mockResolvedValue({ output_text: '["eggs", "milk"]' }),
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: "Trader Joe's has eggs for $2.99." } }],
        }),
      },
    },
  })),
}));

process.env.OPENAI_API_KEY = "test-key";
import { POST } from "./route";
```

## Writing AI Behavior Tests

Use jest.resetModules() and jest.doMock() to control what the AI returns per test. Test outcomes like "reply mentions a store" not internals like "OpenAI was called once."

```typescript
function mockOpenAIReplies(extractJson: string, chatReply: string) {
  jest.resetModules();
  jest.doMock("openai", () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      responses: {
        create: jest.fn().mockResolvedValue({ output_text: extractJson }),
      },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: chatReply } }],
          }),
        },
      },
    })),
  }));
}
```

## Generating New Tests

When asked to generate tests:
1. Read the target source file first to understand what functions exist
2. Identify behaviors to test (happy path, edge cases, error cases)
3. Write tests that start RED if the functionality is not yet implemented
4. Use descriptive test names that explain expected behavior in plain English
5. Keep each test focused on one behavior

## Common Gotchas

- better-sqlite3 is a native module. Always use testEnvironment: "node" in jest config.
- `route.ts` throws at module load time if `OPENAI_API_KEY` is missing. Always set `process.env.OPENAI_API_KEY = "test-key"` before importing the chat route.
- Chat route uses `responses.create` for item extraction and `chat.completions.create` for the reply—mock both on the default export client.
- Use jest.resetModules() between AI behavior tests to avoid mock bleed-through.
