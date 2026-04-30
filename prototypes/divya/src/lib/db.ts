import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "smartshop.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
    seedData(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      distance_miles REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      price REAL NOT NULL,
      unit TEXT NOT NULL,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedData(db: Database.Database) {
  const storeCount = (db.prepare("SELECT COUNT(*) as count FROM stores").get() as { count: number }).count;
  if (storeCount > 0) return;

  const insertStore = db.prepare("INSERT INTO stores (name, address, distance_miles) VALUES (?, ?, ?)");
  const insertProduct = db.prepare("INSERT INTO products (store_id, item_name, price, unit) VALUES (?, ?, ?, ?)");

  const stores = [
    { name: "Trader Joe's", address: "123 College Ave", distance: 0.8 },
    { name: "Safeway", address: "456 Main St", distance: 1.2 },
    { name: "Whole Foods", address: "789 Market Blvd", distance: 2.1 },
    { name: "Target", address: "321 Plaza Dr", distance: 1.7 },
    { name: "Costco", address: "555 Warehouse Way", distance: 3.4 },
  ];

  const storeIds: number[] = [];
  for (const s of stores) {
    const result = insertStore.run(s.name, s.address, s.distance);
    storeIds.push(result.lastInsertRowid as number);
  }

  const products = [
    [storeIds[0], "eggs (1 dozen)", 2.99, "dozen"],
    [storeIds[1], "eggs (1 dozen)", 3.49, "dozen"],
    [storeIds[2], "eggs (1 dozen)", 4.99, "dozen"],
    [storeIds[3], "eggs (1 dozen)", 3.19, "dozen"],
    [storeIds[4], "eggs (2 dozen)", 5.49, "2-pack"],
    [storeIds[0], "milk (1 gallon)", 3.49, "gallon"],
    [storeIds[1], "milk (1 gallon)", 3.99, "gallon"],
    [storeIds[2], "milk (1 gallon)", 5.49, "gallon"],
    [storeIds[3], "milk (1 gallon)", 3.29, "gallon"],
    [storeIds[4], "milk (2 gallons)", 5.99, "2-pack"],
    [storeIds[0], "chicken breast (1 lb)", 4.99, "lb"],
    [storeIds[1], "chicken breast (1 lb)", 5.49, "lb"],
    [storeIds[2], "chicken breast (1 lb)", 7.99, "lb"],
    [storeIds[3], "chicken breast (1 lb)", 5.99, "lb"],
    [storeIds[4], "chicken breast (3 lb)", 12.99, "3 lb pack"],
    [storeIds[0], "white rice (2 lb)", 2.49, "2 lb bag"],
    [storeIds[1], "white rice (2 lb)", 2.99, "2 lb bag"],
    [storeIds[2], "white rice (2 lb)", 4.49, "2 lb bag"],
    [storeIds[3], "white rice (2 lb)", 2.79, "2 lb bag"],
    [storeIds[4], "white rice (25 lb)", 15.99, "25 lb bag"],
    [storeIds[0], "bread (loaf)", 2.99, "loaf"],
    [storeIds[1], "bread (loaf)", 3.49, "loaf"],
    [storeIds[2], "bread (loaf)", 5.99, "loaf"],
    [storeIds[3], "bread (loaf)", 3.19, "loaf"],
    [storeIds[0], "bananas (1 lb)", 0.29, "lb"],
    [storeIds[1], "bananas (1 lb)", 0.39, "lb"],
    [storeIds[2], "bananas (1 lb)", 0.79, "lb"],
    [storeIds[3], "bananas (1 lb)", 0.49, "lb"],
    [storeIds[0], "pasta (1 lb)", 1.29, "lb"],
    [storeIds[1], "pasta (1 lb)", 1.99, "lb"],
    [storeIds[2], "pasta (1 lb)", 3.49, "lb"],
    [storeIds[3], "pasta (1 lb)", 1.79, "lb"],
    [storeIds[0], "yogurt (32 oz)", 3.99, "32 oz"],
    [storeIds[1], "yogurt (32 oz)", 4.49, "32 oz"],
    [storeIds[2], "yogurt (32 oz)", 6.99, "32 oz"],
    [storeIds[3], "yogurt (32 oz)", 4.29, "32 oz"],
  ];

  for (const p of products) {
    insertProduct.run(...(p as [number, string, number, string]));
  }
}

export function getPricesForItems(items: string[]): object {
  const db = getDb();
  const result: Record<string, { store: string; price: number; unit: string; distance: number }[]> = {};

  for (const item of items) {
    const rows = db.prepare(`
      SELECT p.item_name, p.price, p.unit, s.name as store_name, s.distance_miles
      FROM products p JOIN stores s ON p.store_id = s.id
      WHERE LOWER(p.item_name) LIKE LOWER(?)
      ORDER BY p.price ASC
    `).all(`%${item}%`) as { item_name: string; price: number; unit: string; store_name: string; distance_miles: number }[];

    if (rows.length > 0) {
      result[item] = rows.map(r => ({
        store: r.store_name,
        price: r.price,
        unit: r.unit,
        distance: r.distance_miles,
      }));
    }
  }

  return result;
}

export function saveMessage(role: string, content: string) {
  const db = getDb();
  db.prepare("INSERT INTO chat_messages (role, content) VALUES (?, ?)").run(role, content);
}

export function getRecentMessages(limit = 10): { role: string; content: string }[] {
  const db = getDb();
  return db.prepare(
    "SELECT role, content FROM chat_messages ORDER BY created_at DESC LIMIT ?"
  ).all(limit).reverse() as { role: string; content: string }[];
}

export function clearMessages() {
  const db = getDb();
  db.prepare("DELETE FROM chat_messages").run();
}

// Returns the total number of stores in the database
export function getStoreCount(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as count FROM stores").get() as { count: number };
  return row.count;
}

// Returns all products for a given store id
export function getProductsByStore(storeId: number): object[] {
  const db = getDb();
  return db.prepare(
    "SELECT item_name, price, unit FROM products WHERE store_id = ? ORDER BY item_name ASC"
  ).all(storeId) as object[];
}
