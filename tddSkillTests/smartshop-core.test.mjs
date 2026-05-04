/**
 * Cross-prototype unit tests (TDD skill examples).
 * Imports live modules from team prototypes; this folder is not owned by a single member path.
 */

import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";

import { postFindAlternatives } from "../prototypes/Caroline/src/alternatives.mjs";
import { compareStores } from "../prototypes/terry/server/compare.js";

test("alternatives: empty description returns 400 and does not call the model", async () => {
  let modelCalls = 0;
  const mockOpenAI = {
    responses: {
      create: async () => {
        modelCalls += 1;
        return { output_text: '{"alternatives":[]}' };
      }
    }
  };

  const result = await postFindAlternatives(mockOpenAI, "   ", "");

  assert.equal(result.status, 400);
  assert.equal(result.body.error, "description is required.");
  assert.equal(modelCalls, 0);
});

test("alternatives: without an OpenAI client, response uses fallback and stays usable", async () => {
  const result = await postFindAlternatives(null, "organic oats", "");

  assert.equal(result.status, 200);
  assert.equal(result.body.source, "fallback");
  assert.equal(result.body.alternatives.length, 3);
  assert.ok(result.body.alternatives.every((a) => typeof a.estimatedPrice === "number"));
});

function memoryDbWithMilkCatalog() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE items (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      search_key TEXT NOT NULL UNIQUE
    );
    CREATE TABLE stores (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      distance_miles REAL NOT NULL
    );
    CREATE TABLE store_prices (
      store_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      price REAL NOT NULL,
      PRIMARY KEY (store_id, item_id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    );
  `);
  db.prepare("INSERT INTO items (id, name, search_key) VALUES (1, 'Milk (1 gal)', 'milk')").run();
  return db;
}

test("compareStores: unresolved labels yield ok false and list unresolved items", () => {
  const db = memoryDbWithMilkCatalog();

  const out = compareStores(db, ["totally-unknown-sku-xyz"]);

  assert.equal(out.ok, false);
  assert.ok(typeof out.error === "string" && out.error.length > 0);
  assert.deepEqual(out.unresolved, ["totally-unknown-sku-xyz"]);
});
