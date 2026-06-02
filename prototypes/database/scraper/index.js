#!/usr/bin/env node
'use strict';

/**
 * SmartShop Scraper — Sprint 3
 *
 * Scrapes grocery prices from four Santa Clara stores and writes a SQLite
 * database whose schema matches prototypes/divya/src/lib/db.ts, so the
 * output file (data/smartshop.db) can be copied directly into
 * prototypes/divya/smartshop.db.
 *
 * Usage:
 *   npm run scrape                  # all four stores
 *   node scraper/index.js traderjoes target   # specific stores only
 */

const { getDb, upsertStore, replaceProducts, DB_PATH } = require('./db');

const SCRAPERS = [
  { key: 'traderjoes', name: "Trader Joe's", module: './stores/traderjoes' },
  { key: 'safeway',    name: 'Safeway',       module: './stores/safeway'    },
  { key: 'wholefoods', name: 'Whole Foods',   module: './stores/wholefoods' },
  { key: 'target',     name: 'Target',        module: './stores/target'     },
];

// Filter to stores named on the command line (case-insensitive substring match)
const requested = process.argv.slice(2).map(s => s.toLowerCase());

async function main() {
  console.log('\n🛒  SmartShop Scraper — Santa Clara grocery stores\n');

  const db = getDb();
  let totalProducts = 0;
  const results = [];

  for (const { key, name, module: mod } of SCRAPERS) {
    const skip =
      requested.length > 0 &&
      !requested.some(r => key.includes(r) || name.toLowerCase().includes(r));

    if (skip) {
      console.log(`⏭   Skipping ${name}`);
      continue;
    }

    console.log(`\n📦  Scraping ${name}...`);
    const start = Date.now();

    try {
      const { scrape } = require(mod);
      const { storeInfo, products } = await scrape();

      const storeId = upsertStore(db, storeInfo);
      replaceProducts(db, storeId, products);

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`  ✅  ${name}: ${products.length} products saved (${elapsed}s)`);
      totalProducts += products.length;
      results.push({ name, count: products.length, ok: true });
    } catch (err) {
      console.error(`  ❌  ${name} failed: ${err.message}`);
      results.push({ name, count: 0, ok: false, error: err.message });
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log('Store             Products  Status');
  console.log('─────────────────────────────────────────');
  for (const r of results) {
    const pad = name => name.padEnd(18);
    const status = r.ok ? '✅' : `❌  ${r.error ?? ''}`;
    console.log(`${pad(r.name)}  ${String(r.count).padStart(7)}  ${status}`);
  }
  console.log('─────────────────────────────────────────');
  console.log(`Total products saved: ${totalProducts}`);
  console.log(`Database:            ${DB_PATH}`);
  console.log('\nTo use in the app:');
  console.log('  cp data/smartshop.db ../divya/smartshop.db\n');

  process.exit(results.some(r => !r.ok) ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
