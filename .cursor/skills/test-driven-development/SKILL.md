---
name: test-driven-development
description: >-
  Vitest TDD for Smart Shop (prototypes/terry): RED-GREEN-REFACTOR, AAA, user-facing
  test comments, and behavior-focused tests. Use when adding or changing tests or
  test-first implementation in this repo.
---

# Test-Driven Development (Smart Shop / Vitest)

Apply this skill when writing or refactoring tests under `prototypes/terry` (Vitest, `npm test` / `npm run test:watch`).

## Cycle: RED → GREEN → REFACTOR

1. **RED** — Add or change a test that expresses desired behavior. Run tests; the new or updated behavior should fail until implementation exists (or fail for the right reason if you are documenting a stub).
2. **GREEN** — Write the smallest change that makes the test pass. Avoid extra features.
3. **REFACTOR** — Clean up production and test code while keeping tests green. Do not change behavior without a failing test first.

## Structure: Arrange / Act / Assert

In each test, use clear `// Arrange`, `// Act`, and `// Assert` sections (or equivalent). One behavior per test; keep setup obvious.

## User-facing comments

Include a short **plain-language comment from the shopper’s perspective** (what they see or get), either in the test title (`it("…")`) or immediately inside the test. Tests should read like outcomes users care about, not internal jargon.

## Prefer behavior over implementation

- Name tests after **observable outcomes** (sorted prices, normalized search text, API response shape) rather than function names alone.
- Assert on **results and contracts** (return values, thrown errors, resolved promises), not on “the function was called” unless that is the user-visible guarantee.

## Do not mock the function under test

Replace dependencies **around** the unit if needed; never stub or spy on the **function you are testing**. If you must isolate I/O, mock **at the boundary** (e.g. `fetch`, DB adapter), not the SUT.

## Avoid trivial tests

Do not use placeholders such as `expect(true).toBe(true)` or assertions that cannot fail. Every assertion should fail if the behavior regresses.

## Smart Shop context

Grocery comparison features should reflect **real shopper value**: price ordering, input cleanup, search/compare flows, and clear errors when something is intentionally not implemented yet.
