// Run once: node scripts/export-db.js
// Exports smartshop.db to src/lib/products-data.json so the app works on Vercel
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_LOCATIONS = [
  path.join(__dirname, '../smartshop.db'),
  path.join(__dirname, '../../../../smartshop-database/data/smartshop.db'),
];
const dbPath = DB_LOCATIONS.find(p => fs.existsSync(p));
if (!dbPath) { console.error('Could not find smartshop.db'); process.exit(1); }
console.log('Using db:', dbPath);
const db = new Database(dbPath);
const stores = db.prepare('SELECT * FROM stores').all();
const products = db.prepare(
  'SELECT p.*, s.name as store_name, s.address, s.distance_miles FROM products p JOIN stores s ON p.store_id = s.id'
).all();

const out = JSON.stringify({ stores, products }, null, 2);
fs.writeFileSync(path.join(__dirname, '../src/lib/products-data.json'), out);
console.log(`Exported ${stores.length} stores and ${products.length} products to products-data.json`);
db.close();
