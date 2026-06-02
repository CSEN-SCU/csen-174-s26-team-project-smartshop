'use strict';

// Safeway — Santa Clara (3025 El Camino Real, Santa Clara, CA 95051)
// Uses Playwright because Safeway's product search requires session cookies
// and a selected store. Store ID 2774 is the El Camino Real, Santa Clara location.

const { chromium } = require('playwright');

const STORE_INFO = {
  name: 'Safeway',
  address: '3025 El Camino Real, Santa Clara, CA 95051',
  distance_miles: 0.6,
};

// Safeway internal store ID for 3025 El Camino Real, Santa Clara
const STORE_ID = '2774';

const SEARCH_TERMS = [
  'eggs', 'milk', 'butter', 'cheese', 'yogurt', 'cream',
  'chicken breast', 'ground beef', 'pork chops', 'salmon', 'shrimp', 'tuna',
  'white bread', 'sourdough bread', 'pasta', 'white rice', 'oatmeal', 'cereal', 'tortillas',
  'apples', 'bananas', 'oranges', 'strawberries',
  'spinach', 'broccoli', 'carrots', 'onions', 'garlic',
  'tomatoes', 'potatoes', 'avocado', 'cucumber', 'bell pepper',
  'olive oil', 'vegetable oil', 'sugar', 'all purpose flour', 'honey',
  'black beans', 'chickpeas', 'canned tomatoes', 'chicken broth',
  'orange juice', 'apple juice', 'coffee', 'almond milk', 'oat milk',
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
    // Land on Safeway and accept cookies/store selection
    process.stdout.write('  Safeway: opening homepage...\n');
    await page.goto('https://www.safeway.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await sleep(2500);

    // Dismiss any modals
    await dismissModals(page);

    // Set Santa Clara store via direct URL
    await page.goto(`https://www.safeway.com/storepickup.html?storeId=${STORE_ID}`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    await sleep(2000);

    for (const term of SEARCH_TERMS) {
      await sleep(1800);
      try {
        await page.goto(
          `https://www.safeway.com/search?query=${encodeURIComponent(term)}&store=${STORE_ID}`,
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
            brand: item.brand || 'Safeway',
            category: term,
          });
        }
        process.stdout.write(`  Safeway "${term}": ${items.length} items\n`);
      } catch (err) {
        process.stderr.write(`  Safeway "${term}" error: ${err.message}\n`);
      }
    }
  } finally {
    await browser.close();
  }

  return { storeInfo: STORE_INFO, products: [...seen.values()] };
}

async function extractProducts(page) {
  return page.evaluate(() => {
    // Safeway renders product cards with several possible selectors across versions
    const selectors = [
      '[data-testid="product-item"]',
      '[class*="product-item"]',
      '[class*="ProductItem"]',
      '.product-card',
      '[class*="product-card"]',
    ];
    let cards = [];
    for (const sel of selectors) {
      const found = document.querySelectorAll(sel);
      if (found.length > 0) { cards = Array.from(found); break; }
    }

    return cards.slice(0, 15).map(card => {
      const text = (sel) => card.querySelector(sel)?.textContent?.trim() ?? '';
      const nameSelectors = [
        '[data-testid="product-title"]',
        '[class*="product-name"]',
        '[class*="ProductName"]',
        '[class*="title"]',
        'h2', 'h3',
      ];
      const priceSelectors = [
        '[data-testid="product-price"]',
        '[class*="product-price"]',
        '[class*="ProductPrice"]',
        '[class*="price-text"]',
        '[class*="price"]',
      ];
      const unitSelectors = [
        '[class*="unit-price"]',
        '[class*="UnitPrice"]',
        '[class*="unit"]',
        '[data-testid="unit-price"]',
      ];

      let name = '';
      for (const s of nameSelectors) { name = text(s); if (name) break; }
      let rawPrice = '';
      for (const s of priceSelectors) { rawPrice = text(s); if (rawPrice) break; }
      let unit = '';
      for (const s of unitSelectors) { unit = text(s); if (unit) break; }

      const price = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
      return { name, price: isNaN(price) ? 0 : price, unit, brand: '' };
    }).filter(i => i.name && i.price > 0);
  });
}

async function dismissModals(page) {
  const dismissSelectors = [
    '[data-testid="modal-close"]',
    'button[aria-label="Close"]',
    '[class*="close-button"]',
    '[class*="CloseButton"]',
    'button[class*="dismiss"]',
  ];
  for (const sel of dismissSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 800 })) await el.click();
    } catch {
      // ignore — no modal present
    }
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = { scrape, STORE_INFO };
