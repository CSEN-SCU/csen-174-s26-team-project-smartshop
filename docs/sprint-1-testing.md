# Sprint 1 Testing Strategy and TDD

## Overview

This week was mostly about writing tests that say what SmartShop *should* do before we bury ourselves in implementation. SmartShop is for shoppers who care about **price and distance**, not a single shelf price in a vacuum. After Week 4 we decided to combine **Caroline’s** prototype (list input, alternate results, location API ideas) with **Terry’s** step-by-step flow that ends in **one clear recommendation** from price + distance. On the team: **Shreeya** owns frontend, **Terry** backend, **Caroline** AI integration, **Divya** database. Stack-wise we are on HTML/CSS/JS, Node/Express, local JSON/LowDB-style data, OpenAI, and a geocoding API. The tests are our shared cheat sheet so we do not accidentally build four different apps.

## Part 1: Spec Tests in the Repo

All of the Vitest specs we care about for this sprint live under **`prototypes/terry/src`**.

- **Terry / backend unit tests** cover **`normalizeGroceryItemInput`** and **`parseGroceryListPaste`** (getting messy shopper text into a shape the server can use for search) and **`sortStoreOptionsByPrice`** plus **`adjustedTripCost`** (ranking and scoring stores so the backend can support that single best pick).
- **`search.integration.test.js`** is aimed at a **future backend search path**: something that will sit between Express and **local store/catalog data** and return structured results for the UI. It is written against **`searchGroceryDeals`** as that seam’s name, even though the wiring is not there yet.
- **`recommendation.test.js`** is a **team-level** spec for **AI-style complementary suggestions** (`suggestNextItems`). That behavior aligns more with **Caroline’s AI integration** area than with Terry’s day-to-day backend units—we keep the test to document the contract we want later.
- After we loaded the TDD Cursor skill, we added **three more meaningful tests** (not the original four): coverage for **`parseGroceryListPaste`**, **`adjustedTripCost`**, and the **RED** placeholder around **`suggestWeeklySavingsTarget`** in `budgetAdvisor.test.js`.

**Current `npm test` snapshot:** **4 passing**, **3 failing** (on purpose—see below).

**Passing:** `normalizeGroceryItemInput`, `parseGroceryListPaste`, `sortStoreOptionsByPrice`, `adjustedTripCost`.

**Not yet implemented (RED, but intentional):** `searchGroceryDeals`, `suggestNextItems`, `suggestWeeklySavingsTarget`. Those failures come back with clear **`not implemented yet`** errors. They are **planned work** for Sprint 1 follow-through or a later sprint when we hook up the search API, team AI, and optional planning logic—not “broken” tests.

## Part 2: Red-to-Green Narrative

For the small **backend utilities** we actually ran the loop: failing test first, tiny pass, refactor if it helped. That is how **`normalizeGroceryItemInput`**, **`sortStoreOptionsByPrice`**, and later **`parseGroceryListPaste`** / **`adjustedTripCost`** got real code.

The heavy stuff—**`searchGroceryDeals`** (wire Express to local data and a stable response shape), **`suggestNextItems`** (team AI / OpenAI), **`suggestWeeklySavingsTarget`** (optional planning API)—is still **RED on purpose**. Finishing those is not a one-line fix; it is routes, Divya’s DB side, Caroline’s AI integration, etc. Leaving the stubs loud means the tests still spell out **what finished should look like** without us faking that it already works.

## Part 3: Testing Skill Installed and Used

We dropped a project skill at **`.cursor/skills/test-driven-development/SKILL.md`**. It reminded us to:

- Stick to **RED → GREEN → REFACTOR** instead of jumping straight to “it works on my machine”  
- Drop **shopper-facing comments** in tests so the *why* is obvious  
- Use **Arrange / Act / Assert** so every test is readable under stress  
- Skip **fake** tests that cannot fail  
- Care about **what users see** before internal details  

With that skill loaded, Cursor helped add the extra tests around **`parseGroceryListPaste`**, **`adjustedTripCost`**, and the **`suggestWeeklySavingsTarget`** stub. Having those in the repo made explaining backend vs. future AI/planning work way easier in standup.

## Part 4: AI Critique

### 1. `parseGroceryListPaste`

- **Real user need vs. code behavior?** Mostly a **real need**: people paste notes with weird newlines and separators, and the backend has to turn that into separate items for batch search. The test names that story in plain language, which is good. It is still a bit **implementation-shaped** in that it only exercises one happy path (no commas inside a single product name, for example).
- **Would it break on a harmless refactor?** If we refactored **how** we split strings but kept the **same visible output** for the same input, the test should still pass. If we changed splitting rules (e.g. commas inside `"milk, 2%"`), the test would fail—which is correct if behavior changed, but we do not have a test that locks what we want for that grocery corner case yet.
- **Missing domain case?** We **closed the whitespace-only gap in the repo**: the same `parseGroceryListPaste` test now asserts that blank / whitespace-only paste returns **`[]`** so the backend does not run junk catalog queries. **Comma-within-item** labels (e.g. `"milk, 2%"`) are still an open product decision if we keep comma as a separator.

### 2. `adjustedTripCost` (and briefly `budgetAdvisor`)

- **`adjustedTripCost`:** The test expresses a **real shopper tradeoff**: slightly lower shelf total but a longer drive vs. a closer store. That matches SmartShop’s price + distance story. It is tied to specific numbers (`0.35` $/mi, two hard-coded baskets), so a **pure refactor** of the formula with the same numeric contract would be fine, but swapping constants without updating the test would break it—which is mostly what we want. **Missing cases:** **zero distance**, **zero or negative shelf total** (bad data from upstream), and a **tie** or **near-tie** between two stores to document rounding expectations.
- **`suggestWeeklySavingsTarget`:** This one is **intentionally RED**. As a spec it points at a **future user need** (a savings goal from a spend profile), but today it only checks “does not throw” once implemented. When we go green, we will want assertions on **shape and sane bounds**, not just “no error.”

#### Before / after: meaningful test improvement (in the repo)

We updated **`prototypes/terry/src/utils/input.test.js`** so the **same** `it(...)` for `parseGroceryListPaste` covers both the edge case and the happy path—still **one** test, so the suite stays at **4 passing / 3 failing**. The implementation already returned `[]` for whitespace-only input; we only locked that in with an explicit **Arrange / Act / Assert** block.

```diff
   it("splits a pasted list on the server into separate items for a batch grocery search", () => {
     // Terry’s backend support for the step-by-step flow: one pasted note becomes many search terms.

+    // Arrange — shopper cleared the box or only left blank lines; API should not emit empty search tokens
+    const whitespaceOnlyPaste = "\n   \n\t\n";
+
+    // Act
+    const noItems = parseGroceryListPaste(whitespaceOnlyPaste);
+
+    // Assert
+    expect(noItems).toEqual([]);
+
-    // Arrange
+    // Arrange — real multi-line paste
     const pasted = `Milk 2%
```

That is not cosmetic: it documents **real API behavior** for junk paste and protects against regressions where we might accidentally return `[""]` or spam the catalog with empty strings.

## Part 5: Jolli Connection

![Jolli connected repo screenshot](./jolli-connected-repo.png)

*(Placeholder image—add the screenshot file next to this doc when you have it.)*
