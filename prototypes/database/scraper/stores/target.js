'use strict';

// Target — Santa Clara (3158 El Camino Real, Santa Clara, CA 95051)
// Uses Target's RedSky aggregation API — the same endpoint the target.com
// web frontend calls, publicly accessible with their published API key.

const axios = require('axios');

const STORE_INFO = {
  name: 'Target',
  address: '3158 El Camino Real, Santa Clara, CA 95051',
  distance_miles: 1.7,
};

// Santa Clara Target store ID (El Camino Real location)
const STORE_ID = '1267';
const ZIP = '95051';
// Public key Target embeds in their own web frontend bundle
const API_KEY = '9f36aeafbe60771e321a7cc95a78140772ab3e96';

const SEARCH_TERMS = [
  'eggs', 'milk', 'butter', 'cheese', 'yogurt',
  'chicken breast', 'ground beef', 'salmon fillet',
  'bread', 'pasta', 'white rice', 'oatmeal', 'cereal', 'tortillas',
  'apples', 'bananas', 'spinach', 'broccoli',
  'carrots', 'onions', 'garlic', 'tomatoes', 'potatoes', 'avocado',
  'olive oil', 'sugar', 'all purpose flour', 'black beans', 'canned tomatoes',
  'orange juice', 'coffee grounds', 'almond milk',
];

async function scrape() {
  const seen = new Map();

  for (const term of SEARCH_TERMS) {
    await sleep(700);
    try {
      const resp = await axios.get(
        'https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2',
        {
          params: {
            key: API_KEY,
            channel: 'WEB',
            count: 20,
            default_purchasability_filter: true,
            keyword: term,
            offset: 0,
            platform: 'desktop',
            pricing_store_id: STORE_ID,
            store_ids: STORE_ID,
            zip: ZIP,
            visitor_id: 'SmartShopScraper01',
          },
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'application/json',
            Referer: 'https://www.target.com/',
            Origin: 'https://www.target.com',
          },
          timeout: 15000,
        }
      );

      const items = resp.data?.data?.search?.products?.items ?? [];
      for (const item of items) {
        const name = item.item?.product_description?.title;
        if (!name || seen.has(name)) continue;

        const priceRaw =
          item.price?.current_retail ??
          item.price?.reg_retail ??
          parseFloat(String(item.price?.formatted_current_price ?? '').replace(/[^0-9.]/g, ''));

        const price = typeof priceRaw === 'number' ? priceRaw : 0;
        const brand = item.item?.primary_brand?.name ?? 'Target';
        const bullets = item.item?.product_description?.bullet_descriptions ?? [];
        const unit = bullets.find(b => /oz|lb|fl|g\b|ml|ct\b|count|pack/i.test(b)) ?? '';

        seen.set(name, {
          item_name: name,
          price,
          unit,
          brand,
          category: term,
        });
      }
      process.stdout.write(`  Target "${term}": ${items.length} items\n`);
    } catch (err) {
      process.stderr.write(`  Target "${term}" error: ${err.message}\n`);
    }
  }

  return { storeInfo: STORE_INFO, products: [...seen.values()] };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = { scrape, STORE_INFO };
