'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'smartshop.db');

function getDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  initSchema(db);
  return db;
}

function initSchema(db) {
  // Schema mirrors prototypes/divya/src/lib/db.ts exactly so the output .db
  // file can be dropped directly into prototypes/divya/smartshop.db.
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

function upsertStore(db, storeInfo) {
  const row = db.prepare('SELECT id FROM stores WHERE name = ?').get(storeInfo.name);
  if (row) {
    db.prepare('UPDATE stores SET address = ?, distance_miles = ? WHERE id = ?')
      .run(storeInfo.address, storeInfo.distance_miles, row.id);
    return row.id;
  }
  const res = db.prepare(
    'INSERT INTO stores (name, address, distance_miles) VALUES (?, ?, ?)'
  ).run(storeInfo.name, storeInfo.address, storeInfo.distance_miles);
  return res.lastInsertRowid;
}

function replaceProducts(db, storeId, products) {
  db.prepare('DELETE FROM products WHERE store_id = ?').run(storeId);
  const ins = db.prepare(
    'INSERT INTO products (store_id, item_name, price, unit, brand, category) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const batch = db.transaction((rows) => {
    for (const p of rows) {
      ins.run(storeId, p.item_name, p.price, p.unit || '', p.brand || '', p.category || '');
    }
  });
  batch(products);
}

module.exports = { getDb, upsertStore, replaceProducts, DB_PATH };
