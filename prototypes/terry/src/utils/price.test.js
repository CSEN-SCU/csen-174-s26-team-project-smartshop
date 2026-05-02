/**
 * Terry / backend: ranking math that supports one clear SmartShop recommendation (price + distance), not a chat transcript.
 */
import { describe, it, expect } from "vitest";
import {
  adjustedTripCost,
  sortStoreOptionsByPrice,
} from "./price.js";

describe("sortStoreOptionsByPrice", () => {
  it("orders store candidates by basket total so the API can surface the cheapest option first", () => {
    // The step-by-step flow still ends in one pick; the backend ranks stores before that response is built.

    // Arrange
    const storeOptions = [
      { storeName: "Budget Mart", totalPrice: 42.5, distanceMiles: 2 },
      { storeName: "Corner Grocer", totalPrice: 38.1, distanceMiles: 1 },
      { storeName: "Express Foods", totalPrice: 55.0, distanceMiles: 3 },
    ];

    // Act
    const sorted = sortStoreOptionsByPrice(storeOptions);

    // Assert
    expect(sorted.map((s) => s.storeName)).toEqual([
      "Corner Grocer",
      "Budget Mart",
      "Express Foods",
    ]);
    expect(sorted.map((s) => s.totalPrice)).toEqual([38.1, 42.5, 55.0]);
  });
});

describe("adjustedTripCost", () => {
  it("scores shelf total plus travel so the backend can prefer a closer store when savings are tiny", () => {
    // Aligns with Express + geocoding: distance feeds the same “one recommendation” Terry’s flow exposes.

    // Arrange
    const dollarsPerMile = 0.35;
    const nearby = { shelfTotal: 44.0, distanceMiles: 0.5 };
    const farther = { shelfTotal: 43.0, distanceMiles: 4.0 };

    // Act
    const nearbyScore = adjustedTripCost(
      nearby.shelfTotal,
      nearby.distanceMiles,
      dollarsPerMile,
    );
    const fartherScore = adjustedTripCost(
      farther.shelfTotal,
      farther.distanceMiles,
      dollarsPerMile,
    );

    // Assert
    expect(nearbyScore).toBeLessThan(fartherScore);
    expect(nearbyScore).toBeCloseTo(44.175, 5);
    expect(fartherScore).toBeCloseTo(44.4, 5);
  });
});
