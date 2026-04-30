/**
 * Unit tests for the database layer (owned by Divya)
 * Tests new functions getStoreCount and getProductsByStore — start RED until implemented.
 */

import {
  getDb,
  getPricesForItems,
  saveMessage,
  getRecentMessages,
  clearMessages,
  getStoreCount,
  getProductsByStore,
} from "./db";

beforeEach(() => {
  clearMessages();
});

// ─── Existing functions ──────────────────────────────────────────────────────

describe("getPricesForItems", () => {
  test("returns price data for a known item", () => {
    const result = getPricesForItems(["eggs"]) as Record<string, unknown[]>;
    expect(result["eggs"]).toBeDefined();
    expect(result["eggs"].length).toBeGreaterThan(0);
  });

  test("returns an empty object for an unknown item", () => {
    const result = getPricesForItems(["dragonfruitXYZ"]);
    expect(result).toEqual({});
  });

  test("each result has store, price, unit, and distance fields", () => {
    const result = getPricesForItems(["milk"]) as Record<
      string,
      { store: string; price: number; unit: string; distance: number }[]
    >;
    const first = result["milk"][0];
    expect(first).toHaveProperty("store");
    expect(first).toHaveProperty("price");
    expect(first).toHaveProperty("unit");
    expect(first).toHaveProperty("distance");
  });
});

describe("saveMessage / getRecentMessages", () => {
  test("saves a message and retrieves it", () => {
    saveMessage("user", "hello world");
    const msgs = getRecentMessages(5);
    expect(msgs[msgs.length - 1].content).toBe("hello world");
    expect(msgs[msgs.length - 1].role).toBe("user");
  });

  test("getRecentMessages respects the limit", () => {
    for (let i = 0; i < 10; i++) saveMessage("user", `message ${i}`);
    const msgs = getRecentMessages(3);
    expect(msgs.length).toBeLessThanOrEqual(3);
  });

  test("clearMessages removes all messages", () => {
    saveMessage("user", "test");
    clearMessages();
    expect(getRecentMessages(10).length).toBe(0);
  });
});

// ─── New functions (start RED — implemented in db.ts to turn GREEN) ──────────

describe("getStoreCount", () => {
  test("returns the total number of stores in the database", () => {
    const count = getStoreCount();
    expect(count).toBe(5);
  });
});

describe("getProductsByStore", () => {
  test("returns all products for a given store id", () => {
    const db = getDb();
    const store = db
      .prepare("SELECT id FROM stores LIMIT 1")
      .get() as { id: number };

    const products = getProductsByStore(store.id) as {
      item_name: string;
      price: number;
      unit: string;
    }[];

    expect(products.length).toBeGreaterThan(0);
    expect(products[0]).toHaveProperty("item_name");
    expect(products[0]).toHaveProperty("price");
  });

  test("returns an empty array for a non-existent store id", () => {
    const products = getProductsByStore(9999);
    expect(products).toEqual([]);
  });
});
