/**
 * Terry / backend: optional future planning endpoint—RED placeholder, separate from the core compare flow.
 */
import { describe, it, expect } from "vitest";
import { suggestWeeklySavingsTarget } from "./budgetAdvisor.js";

describe("backend planning API (future)", () => {
  it("returns a weekly savings target object once spend profile logic exists on the server", () => {
    // Shoppers may later send typical spend; the API would answer with a numeric goal—not implemented in Sprint 1.

    // Arrange
    const profile = { typicalWeeklySpend: 120, householdSize: 2 };

    // Act
    const getTarget = () => suggestWeeklySavingsTarget(profile);

    // Assert — RED: planning stub only
    expect(getTarget).not.toThrow();
  });
});
