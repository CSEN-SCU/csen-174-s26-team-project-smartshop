/**
 * Terry / backend: future Express (or service-layer) seam that loads LowDB/JSON store prices and returns ranked options.
 */
import { describe, it, expect } from "vitest";
import { searchGroceryDeals } from "./searchService.js";

describe("backend search orchestration (integration, future)", () => {
  it("resolves with store rows and prices once the Node search path is wired to local data", async () => {
    // Front-end sends items; the API should answer with data shaped for the step-by-step compare screen.

    // Arrange
    const query = { items: ["milk", "eggs"] };

    // Act
    const resultPromise = searchGroceryDeals(query);

    // Assert — RED: no full implementation yet; seam stays explicit for Sprint 1 TDD
    await expect(resultPromise).resolves.toMatchObject({
      ok: true,
      stores: expect.any(Array),
    });
  });
});
