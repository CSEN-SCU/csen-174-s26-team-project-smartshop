import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "data", "smartshop.db");

export function openDatabase() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      search_key TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      distance_miles REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS store_prices (
      store_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      price REAL NOT NULL,
      PRIMARY KEY (store_id, item_id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    );
  `);

  const count = db.prepare("SELECT COUNT(*) AS c FROM items").get().c;
  if (count === 0) {
    seed(db);
  }

  return db;
}

function seed(db) {
  const items = [
    ["Milk (1 gal)", "milk"],
    ["Eggs (dozen)", "eggs"],
    ["Bread (loaf)", "bread"],
    ["Bananas (lb)", "bananas"],
    ["Pasta (1 lb)", "pasta"],
    ["Rice (2 lb)", "rice"],
    ["Yogurt (32 oz)", "yogurt"],
    ["Cheddar cheese (8 oz)", "cheese"],
  ];

  const insertItem = db.prepare(
    "INSERT INTO items (name, search_key) VALUES (?, ?)"
  );
  for (const [name, key] of items) {
    insertItem.run(name, key);
  }

  const stores = [
    ["Campus Corner Market", 0.4],
    ["Budget Foods Plaza", 2.1],
    ["GreenLeaf Organic Co-op", 3.5],
  ];
  const insertStore = db.prepare(
    "INSERT INTO stores (name, distance_miles) VALUES (?, ?)"
  );
  for (const [name, d] of stores) {
    insertStore.run(name, d);
  }

  // Prices tuned so the "best" store depends on both price and distance.
  // store ids 1,2,3 in insertion order
  const prices = [
    // Campus Corner — close but not always cheapest per item
    [1, "milk", 4.29],
    [1, "eggs", 3.49],
    [1, "bread", 2.99],
    [1, "bananas", 0.79],
    [1, "pasta", 1.89],
    [1, "rice", 3.29],
    [1, "yogurt", 4.99],
    [1, "cheese", 3.79],
    // Budget Foods — farther, lower prices on many staples
    [2, "milk", 3.19],
    [2, "eggs", 2.79],
    [2, "bread", 1.99],
    [2, "bananas", 0.59],
    [2, "pasta", 1.29],
    [2, "rice", 2.49],
    [2, "yogurt", 3.99],
    [2, "cheese", 2.99],
    // Co-op — farthest, mid/high on some organics
    [3, "milk", 5.49],
    [3, "eggs", 3.99],
    [3, "bread", 3.49],
    [3, "bananas", 0.99],
    [3, "pasta", 2.29],
    [3, "rice", 3.99],
    [3, "yogurt", 5.49],
    [3, "cheese", 4.49],
  ];

  const itemRows = db.prepare("SELECT id, search_key FROM items").all();
  const keyToId = Object.fromEntries(itemRows.map((r) => [r.search_key, r.id]));
  const storeRows = db.prepare("SELECT id, name FROM stores").all();
  const nameToStoreId = Object.fromEntries(
    storeRows.map((r) => [r.name, r.id])
  );

  const insertPrice = db.prepare(
    "INSERT INTO store_prices (store_id, item_id, price) VALUES (?, ?, ?)"
  );

  const storeNameByNum = {
    1: "Campus Corner Market",
    2: "Budget Foods Plaza",
    3: "GreenLeaf Organic Co-op",
  };

  for (const [storeNum, key, price] of prices) {
    const sid = nameToStoreId[storeNameByNum[storeNum]];
    const iid = keyToId[key];
    insertPrice.run(sid, iid, price);
  }
}
