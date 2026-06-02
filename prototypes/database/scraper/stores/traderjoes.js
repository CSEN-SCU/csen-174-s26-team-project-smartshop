'use strict';

// Trader Joe's — Santa Clara (3430 El Camino Real, Santa Clara, CA 95051)
// Uses TJ's public GraphQL API. No authentication required.
// Pricing is national (TJ's doesn't vary by store), so any storeCode works.

const axios = require('axios');

const STORE_INFO = {
  name: "Trader Joe's",
  address: '3430 El Camino Real, Santa Clara, CA 95051',
  distance_miles: 1.2,
};

const SEARCH_TERMS = [
  'eggs', 'milk', 'butter', 'cream', 'cheese', 'yogurt',
  'chicken', 'beef', 'pork', 'salmon', 'tuna', 'shrimp',
  'bread', 'pasta', 'rice', 'oats', 'cereal', 'tortillas',
  'apples', 'bananas', 'oranges', 'berries',
  'spinach', 'broccoli', 'kale', 'carrots', 'onions',
  'garlic', 'tomatoes', 'potatoes', 'avocado', 'cucumber',
  'olive oil', 'canola oil', 'sugar', 'flour', 'honey',
  'black beans', 'chickpeas', 'lentils', 'canned tomatoes',
  'orange juice', 'coffee', 'tea', 'almond milk', 'soy milk',
];

const GQL_QUERY = `
  query SearchProducts(
    $search: String
    $pageSize: Int
    $currentPage: Int
    $storeCode: String = "TJ"
    $availability: String = "1"
    $published: String = "1"
  ) {
    products(
      search: $search
      filter: {
        store_code: { eq: $storeCode }
        availability: { eq: $availability }
        published: { eq: $published }
      }
      pageSize: $pageSize
      currentPage: $currentPage
    ) {
      total_count
      items {
        item_title
        retail_price
        sales_size
        sales_unit_of_measure
        sku
        category_hierarchy { name }
      }
    }
  }
`;

async function scrape() {
  const seen = new Map();

  for (const term of SEARCH_TERMS) {
    await sleep(400);
    try {
      const resp = await axios.post(
        'https://www.traderjoes.com/api/graphql',
        {
          operationName: 'SearchProducts',
          variables: {
            storeCode: 'TJ',
            availability: '1',
            published: '1',
            search: term,
            pageSize: 15,
            currentPage: 1,
          },
          query: GQL_QUERY,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Origin: 'https://www.traderjoes.com',
            Referer: 'https://www.traderjoes.com/',
          },
          timeout: 15000,
        }
      );

      const items = resp.data?.data?.products?.items ?? [];
      for (const item of items) {
        if (!item.item_title || !item.retail_price) continue;
        if (seen.has(item.item_title)) continue;
        seen.set(item.item_title, {
          item_name: item.item_title,
          price: parseFloat(item.retail_price) || 0,
          unit: [item.sales_size, item.sales_unit_of_measure].filter(Boolean).join(' '),
          brand: "Trader Joe's",
          category: item.category_hierarchy?.[0]?.name ?? term,
        });
      }
      process.stdout.write(`  TJ's "${term}": ${items.length} items\n`);
    } catch (err) {
      process.stderr.write(`  TJ's "${term}" error: ${err.message}\n`);
    }
  }

  return { storeInfo: STORE_INFO, products: [...seen.values()] };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = { scrape, STORE_INFO };
