import Database from "better-sqlite3";
import path from "path";
import scrapedData from "./products-data.json";

const DB_PATH = path.join(process.cwd(), "smartshop.db");

type ScrapedStore = { name: string; address: string; distance_miles: number };
type ScrapedProduct = {
  store_id: number;
  item_name: string;
  price: number;
  unit: string;
  brand: string;
  category: string;
};

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
    ensureProductColumns(db);
    seedData(db);
  }
  return db;
}

// Brings older or scraper-produced databases up to the current product schema.
// The scraper writes brand/category/scraped_at; add them if a pre-existing DB
// (e.g. the original mock seed) is missing them so reads never fail.
function ensureProductColumns(db: Database.Database) {
  const cols = (db.prepare("PRAGMA table_info(products)").all() as { name: string }[]).map(
    (c) => c.name
  );
  if (!cols.includes("brand")) db.exec("ALTER TABLE products ADD COLUMN brand TEXT");
  if (!cols.includes("category")) db.exec("ALTER TABLE products ADD COLUMN category TEXT");
  if (!cols.includes("scraped_at")) db.exec("ALTER TABLE products ADD COLUMN scraped_at DATETIME");
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
      brand TEXT,
      category TEXT,
      scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

  // Seed from the real scraped dataset (products-data.json) exported by the
  // store scrapers, so the chat shows specific branded products and prices.
  const insertStore = db.prepare("INSERT INTO stores (name, address, distance_miles) VALUES (?, ?, ?)");
  const insertProduct = db.prepare(
    "INSERT INTO products (store_id, item_name, price, unit, brand, category) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const stores = scrapedData.stores as ScrapedStore[];
  const products = scrapedData.products as ScrapedProduct[];

  // Map the JSON's store_id values to the autoincrement ids we insert here.
  const storeIdMap = new Map<number, number>();

  const seed = db.transaction(() => {
    for (const s of stores) {
      const res = insertStore.run(s.name, s.address, s.distance_miles);
      const jsonId = (scrapedData.stores as (ScrapedStore & { id: number })[]).find(
        (x) => x.name === s.name
      )?.id;
      if (jsonId !== undefined) storeIdMap.set(jsonId, res.lastInsertRowid as number);
    }

    for (const p of products) {
      const storeId = storeIdMap.get(p.store_id);
      if (storeId === undefined) continue;
      insertProduct.run(storeId, p.item_name, p.price, p.unit || "", p.brand || "", p.category || "");
    }
  });

  seed();
}

export type PriceRow = {
  product: string;
  brand: string;
  store: string;
  price: number;
  unit: string;
  distance: number;
};

export function getPricesForItems(items: string[]): Record<string, PriceRow[]> {
  const db = getDb();
  const result: Record<string, PriceRow[]> = {};

  for (const item of items) {
    const rows = db.prepare(`
      SELECT p.item_name, p.brand, p.price, p.unit, s.name as store_name, s.distance_miles
      FROM products p JOIN stores s ON p.store_id = s.id
      WHERE LOWER(p.item_name) LIKE LOWER(?) OR LOWER(p.brand) LIKE LOWER(?)
      ORDER BY p.price ASC
    `).all(`%${item}%`, `%${item}%`) as {
      item_name: string;
      brand: string | null;
      price: number;
      unit: string;
      store_name: string;
      distance_miles: number;
    }[];

    if (rows.length > 0) {
      result[item] = rows.map(r => ({
        product: r.item_name,
        brand: r.brand || "",
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
