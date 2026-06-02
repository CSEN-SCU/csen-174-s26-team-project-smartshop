'use strict';

// Whole Foods Market — Santa Clara (2732 Augustine Dr, Santa Clara, CA 95054)
// Near Great America Pkwy / Hwy 101. Uses Playwright because WFM is Amazon-owned
// and doesn't expose a clean public product API.

const { chromium } = require('playwright');

const STORE_INFO = {
  name: 'Whole Foods Market',
  address: '2732 Augustine Dr, Santa Clara, CA 95054',
  distance_miles: 2.3,
};

const SEARCH_TERMS = [
  'eggs', 'milk', 'butter', 'cheese', 'yogurt', 'heavy cream',
  'chicken breast', 'ground beef', 'salmon', 'shrimp', 'pork',
  'bread', 'pasta', 'brown rice', 'oats', 'granola', 'tortillas',
  'apples', 'bananas', 'oranges', 'blueberries',
  'spinach', 'kale', 'broccoli', 'carrots', 'onions',
  'garlic', 'tomatoes', 'potatoes', 'avocado', 'zucchini',
  'olive oil', 'coconut oil', 'sugar', 'almond flour', 'honey',
  'black beans', 'lentils', 'canned tomatoes', 'vegetable broth',
  'orange juice', 'kombucha', 'cold brew coffee', 'oat milk', 'almond milk',
];

async function scrape() {
  const headless = process.env.PLAYWRIGHT_HEADLESS !== '0';
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  const seen = new Map();

  try {
    process.stdout.write('  Whole Foods: opening homepage...\n');
    await page.goto('https://www.wholefoodsmarket.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await sleep(2500);
    await dismissModals(page);

    for (const term of SEARCH_TERMS) {
      await sleep(1800);
      try {
        await page.goto(
          `https://www.wholefoodsmarket.com/search?text=${encodeURIComponent(term)}`,
          { waitUntil: 'domcontentloaded', timeout: 25000 }
        );
        await sleep(2200);
        await dismissModals(page);

        const items = await extractProducts(page);
        for (const item of items) {
          if (!item.name || seen.has(item.name)) continue;
          seen.set(item.name, {
            item_name: item.name,
            price: item.price,
            unit: item.unit,
            brand: item.brand || 'Whole Foods',
            category: term,
          });
        }
        process.stdout.write(`  Whole Foods "${term}": ${items.length} items\n`);
      } catch (err) {
        process.stderr.write(`  Whole Foods "${term}" error: ${err.message}\n`);
      }
    }
  } finally {
    await browser.close();
  }

  return { storeInfo: STORE_INFO, products: [...seen.values()] };
}

async function extractProducts(page) {
  return page.evaluate(() => {
    const selectors = [
      '[data-ref="product-tile"]',
      '[class*="w-product-tile"]',
      '[class*="ProductTile"]',
      '[class*="product-tile"]',
      'article[class*="product"]',
      '[class*="product-item"]',
    ];
    let cards = [];
    for (const sel of selectors) {
      const found = document.querySelectorAll(sel);
      if (found.length > 0) { cards = Array.from(found); break; }
    }

    return cards.slice(0, 15).map(card => {
      const text = (sel) => card.querySelector(sel)?.textContent?.trim() ?? '';

      const nameSelectors = ['h2', 'h3', '[class*="title"]', '[class*="name"]', '[class*="Title"]'];
      const priceSelectors = [
        '[class*="bds--heading-5"]',
        '[data-ref="price"]',
        '[class*="price"]',
        '[class*="Price"]',
      ];
      const unitSelectors = [
        '[class*="unit"]', '[class*="size"]', '[class*="weight"]',
        '[class*="Unit"]', '[class*="Size"]',
      ];
      const brandSelectors = [
        '[class*="brand"]', '[class*="vendor"]', '[class*="Brand"]',
      ];

      let name = '';
      for (const s of nameSelectors) { name = text(s); if (name) break; }
      let rawPrice = '';
      for (const s of priceSelectors) { rawPrice = text(s); if (rawPrice) break; }
      let unit = '';
      for (const s of unitSelectors) { unit = text(s); if (unit) break; }
      let brand = '';
      for (const s of brandSelectors) { brand = text(s); if (brand) break; }

      const price = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
      return { name, price: isNaN(price) ? 0 : price, unit, brand };
    }).filter(i => i.name && i.price > 0);
  });
}

async function dismissModals(page) {
  const dismissSelectors = [
    'button[aria-label="Close"]',
    '[class*="close"]',
    '[class*="Close"]',
    '[data-ref="modal-close"]',
    '#onetrust-accept-btn-handler',
  ];
  for (const sel of dismissSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 800 })) await el.click();
    } catch {
      // no modal
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = { scrape, STORE_INFO };
