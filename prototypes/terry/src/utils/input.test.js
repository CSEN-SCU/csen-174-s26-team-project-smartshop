/**
 * Terry / backend: input normalization before grocery search against store/catalog data (not UI-only formatting).
 */
import { describe, it, expect } from "vitest";
import {
  normalizeGroceryItemInput,
  parseGroceryListPaste,
} from "./input.js";

describe("normalizeGroceryItemInput", () => {
  it("normalizes messy labels on the server so search queries hit the catalog consistently", () => {
    // Shoppers type sloppy labels; the API should clean them before matching Divya’s DB / JSON catalog.

    // Arrange
    const messyLabel = "  Organic   MILK  ";

    // Act
    const normalized = normalizeGroceryItemInput(messyLabel);

    // Assert
    expect(normalized).toBe("organic milk");
  });
});

describe("parseGroceryListPaste", () => {
  it("splits a pasted list on the server into separate items for a batch grocery search", () => {
    // Terry’s backend support for the step-by-step flow: one pasted note becomes many search terms.

    // Arrange — shopper cleared the box or only left blank lines; API should not emit empty search tokens
    const whitespaceOnlyPaste = "\n   \n\t\n";

    // Act
    const noItems = parseGroceryListPaste(whitespaceOnlyPaste);

    // Assert
    expect(noItems).toEqual([]);

    // Arrange — real multi-line paste
    const pasted = `Milk 2%
organic eggs
Bananas; yogurt`;

    // Act
    const items = parseGroceryListPaste(pasted);

    // Assert
    expect(items).toEqual([
      "milk 2%",
      "organic eggs",
      "bananas",
      "yogurt",
    ]);
  });
});
