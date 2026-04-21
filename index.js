const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sqlite3 = require("sqlite3").verbose();
const { OpenAI } = require("openai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("./grocery.db");

const baseCatalogEntries = [
  // Dairy and eggs
  ["milk", 3.69], ["almond_milk", 3.99], ["oat_milk", 4.19], ["eggs", 3.29], ["yogurt", 1.29],
  ["greek_yogurt", 1.59], ["cheese", 4.29], ["cheddar_cheese", 4.49], ["mozzarella", 4.39],
  ["butter", 4.69], ["cream_cheese", 3.49], ["sour_cream", 2.79], ["cottage_cheese", 3.59],
  // Produce - fruits
  ["bananas", 1.19], ["apples", 2.49], ["green_apples", 2.79], ["gala_apples", 2.89], ["oranges", 3.49],
  ["mandarins", 4.29], ["grapefruit", 1.49], ["lemons", 0.99], ["limes", 0.79], ["grapes", 3.99],
  ["red_grapes", 4.19], ["green_grapes", 4.09], ["strawberries", 3.99], ["blueberries", 4.49],
  ["raspberries", 4.99], ["blackberries", 4.79], ["pineapple", 3.99], ["mango", 1.69], ["peaches", 2.99],
  ["nectarines", 3.19], ["plums", 2.89], ["pears", 2.79], ["watermelon", 6.99], ["cantaloupe", 3.99],
  ["honeydew", 4.29], ["kiwi", 0.89], ["avocado", 1.69], ["cherries", 5.99], ["pomegranate", 2.49],
  ["coconut", 2.29], ["papaya", 3.49], ["dragon_fruit", 4.99], ["apricots", 3.59], ["cranberries", 3.89],
  // Produce - vegetables and herbs
  ["tomato", 2.29], ["roma_tomatoes", 2.49], ["cherry_tomatoes", 3.29], ["potato", 0.99],
  ["russet_potatoes", 1.19], ["red_potatoes", 1.39], ["sweet_potato", 1.39], ["onion", 1.19],
  ["yellow_onion", 1.29], ["red_onion", 1.39], ["white_onion", 1.29], ["garlic", 0.69], ["carrots", 1.49],
  ["baby_carrots", 2.29], ["broccoli", 2.29], ["broccoli_florets", 2.79], ["cauliflower", 3.49],
  ["spinach", 3.29], ["baby_spinach", 3.59], ["lettuce", 2.49], ["romaine_lettuce", 2.69], ["iceberg_lettuce", 2.29],
  ["kale", 2.99], ["arugula", 3.29], ["cucumber", 1.29], ["english_cucumber", 1.49], ["zucchini", 1.79],
  ["yellow_squash", 1.89], ["bell_pepper", 1.89], ["red_bell_pepper", 2.09], ["green_bell_pepper", 1.69],
  ["jalapeno", 0.79], ["serrano_pepper", 0.89], ["poblano_pepper", 1.19], ["mushrooms", 2.99],
  ["portobello_mushrooms", 3.49], ["shiitake_mushrooms", 4.49], ["celery", 1.79], ["asparagus", 3.99],
  ["green_beans", 2.49], ["corn", 0.89], ["corn_on_the_cob", 0.99], ["eggplant", 1.99], ["cabbage", 1.29],
  ["red_cabbage", 1.49], ["brussels_sprouts", 3.29], ["beets", 2.19], ["radish", 1.49], ["turnip", 1.59],
  ["leeks", 2.99], ["bok_choy", 2.49], ["okra", 2.89], ["snap_peas", 3.49], ["snow_peas", 3.79],
  ["artichoke", 2.79], ["butternut_squash", 2.99], ["acorn_squash", 2.69], ["pumpkin", 5.99], ["ginger", 1.29],
  ["cilantro", 0.99], ["parsley", 1.09], ["basil", 1.29], ["mint", 1.29], ["dill", 1.19], ["green_onions", 1.19],
  // Meat and seafood
  ["chicken", 6.99], ["chicken_thighs", 5.99], ["ground_beef", 7.49], ["beef_steak", 13.99],
  ["pork_chops", 6.79], ["bacon", 5.49], ["turkey", 8.29], ["turkey_breast", 7.99], ["salmon", 11.99],
  ["shrimp", 10.99], ["tilapia", 8.49], ["tuna", 3.29], ["deli_ham", 5.29], ["deli_turkey", 5.49],
  // Bakery and grains
  ["bread", 2.89], ["whole_wheat_bread", 3.19], ["bagels", 3.99], ["tortillas", 2.99], ["rice", 4.99],
  ["brown_rice", 5.29], ["jasmine_rice", 5.49], ["quinoa", 6.99], ["pasta", 1.99], ["spaghetti", 2.19],
  ["macaroni", 1.89], ["oats", 4.19], ["flour", 3.49], ["sugar", 2.99],
  // Pantry staples
  ["olive_oil", 9.99], ["vegetable_oil", 4.99], ["salt", 1.29], ["black_pepper", 2.79], ["garlic_powder", 2.49],
  ["paprika", 2.89], ["cinnamon", 2.49], ["soy_sauce", 3.29], ["hot_sauce", 3.49], ["ketchup", 3.19],
  ["mustard", 2.49], ["mayonnaise", 4.29], ["peanut_butter", 3.99], ["jam", 3.79], ["honey", 5.49],
  ["maple_syrup", 7.99], ["chicken_broth", 2.49], ["beef_broth", 2.69], ["canned_tomatoes", 1.89],
  ["black_beans", 1.29], ["chickpeas", 1.39], ["lentils", 1.79], ["kidney_beans", 1.29], ["corn_canned", 1.19],
  ["tuna_canned", 1.49], ["pasta_sauce", 2.99], ["salsa", 3.49], ["pickles", 3.79],
  // Breakfast and snacks
  ["cereal", 4.59], ["granola", 5.29], ["instant_oatmeal", 3.99], ["pancake_mix", 3.49], ["waffles_frozen", 3.99],
  ["cereal_bars", 3.99], ["protein_bars", 7.99], ["chips", 4.49], ["pretzels", 3.29], ["popcorn", 2.99],
  ["crackers", 3.49], ["cookies", 4.19], ["trail_mix", 6.49], ["nuts_mixed", 7.29], ["almonds", 6.99],
  // Frozen and convenience
  ["frozen_pizza", 6.99], ["frozen_vegetables", 2.29], ["frozen_berries", 4.99], ["frozen_fries", 3.49],
  ["chicken_nuggets", 6.29], ["frozen_meals", 4.99], ["ice_cream", 5.49], ["ice_pops", 3.29],
  // Drinks
  ["orange_juice", 4.19], ["apple_juice", 3.89], ["lemonade", 2.99], ["soda", 2.29], ["sparkling_water", 4.29],
  ["coffee", 8.99], ["ground_coffee", 9.49], ["tea_bags", 4.29], ["sports_drink", 2.19], ["energy_drink", 2.79],
  ["bottled_water", 5.99],
  // Household and personal care
  ["dish_soap", 3.49], ["laundry_detergent", 11.99], ["paper_towels", 8.99], ["toilet_paper", 9.99],
  ["trash_bags", 7.99], ["sponges", 2.99], ["aluminum_foil", 4.49], ["plastic_wrap", 3.99],
  ["toothpaste", 3.49], ["shampoo", 6.99], ["body_wash", 5.99], ["hand_soap", 2.49]
];

const basePriceCatalog = Object.fromEntries(baseCatalogEntries);
const produceFruitItems = new Set([
  "bananas", "apples", "green_apples", "gala_apples", "oranges", "mandarins", "grapefruit", "lemons", "limes",
  "grapes", "red_grapes", "green_grapes", "strawberries", "blueberries", "raspberries", "blackberries",
  "pineapple", "mango", "peaches", "nectarines", "plums", "pears", "watermelon", "cantaloupe", "honeydew",
  "kiwi", "avocado", "cherries", "pomegranate", "coconut", "papaya", "dragon_fruit", "apricots", "cranberries"
]);

const produceVegetableItems = new Set([
  "tomato", "roma_tomatoes", "cherry_tomatoes", "potato", "russet_potatoes", "red_potatoes", "sweet_potato",
  "onion", "yellow_onion", "red_onion", "white_onion", "garlic", "carrots", "baby_carrots", "broccoli",
  "broccoli_florets", "cauliflower", "spinach", "baby_spinach", "lettuce", "romaine_lettuce", "iceberg_lettuce",
  "kale", "arugula", "cucumber", "english_cucumber", "zucchini", "yellow_squash", "bell_pepper",
  "red_bell_pepper", "green_bell_pepper", "jalapeno", "serrano_pepper", "poblano_pepper", "mushrooms",
  "portobello_mushrooms", "shiitake_mushrooms", "celery", "asparagus", "green_beans", "corn", "corn_on_the_cob",
  "eggplant", "cabbage", "red_cabbage", "brussels_sprouts", "beets", "radish", "turnip", "leeks", "bok_choy",
  "okra", "snap_peas", "snow_peas", "artichoke", "butternut_squash", "acorn_squash", "pumpkin", "ginger",
  "cilantro", "parsley", "basil", "mint", "dill", "green_onions"
]);

const perItemItems = new Set([
  "avocado", "pineapple", "coconut", "papaya", "dragon_fruit", "watermelon", "cantaloupe", "honeydew",
  "artichoke", "pumpkin", "corn_on_the_cob", "cucumber", "english_cucumber", "mango", "pomegranate"
]);

function getItemCategory(itemName) {
  if (produceFruitItems.has(itemName)) {
    return "fruit";
  }
  if (produceVegetableItems.has(itemName)) {
    return "vegetable";
  }
  return "other";
}

function getItemUnit(itemName) {
  if (produceFruitItems.has(itemName) || produceVegetableItems.has(itemName)) {
    return perItemItems.has(itemName) ? "item" : "lb";
  }
  return "item";
}

function toDisplayName(itemName) {
  return itemName
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function levenshteinDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) {
    dp[i][0] = i;
  }
  for (let j = 0; j < cols; j += 1) {
    dp[0][j] = j;
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

function maybeFindFuzzyCatalogMatch(rawValue) {
  const candidate = rawValue.trim().toLowerCase().replace(/\s+/g, "_");
  if (!candidate) {
    return null;
  }

  const singular = candidate.endsWith("s") ? candidate.slice(0, -1) : candidate;
  const plural = candidate.endsWith("s") ? candidate : `${candidate}s`;
  if (basePriceCatalog[singular]) {
    return singular;
  }
  if (basePriceCatalog[plural]) {
    return plural;
  }

  const allItems = Object.keys(basePriceCatalog);
  let bestMatch = null;
  let bestDistance = Number.MAX_SAFE_INTEGER;

  allItems.forEach((itemName) => {
    const distance = levenshteinDistance(candidate, itemName);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = itemName;
    }
  });

  const maxAllowedDistance = candidate.length <= 5 ? 1 : 2;
  return bestDistance <= maxAllowedDistance ? bestMatch : null;
}

function applyStoreAdjustments(basePrices, multiplier, itemDeltas = {}) {
  const adjusted = {};
  Object.entries(basePrices).forEach(([item, basePrice]) => {
    const itemDelta = itemDeltas[item] || 0;
    adjusted[item] = Number((basePrice * multiplier + itemDelta).toFixed(2));
  });
  return adjusted;
}

const seedStores = [
  {
    name: "Walmart Supercenter",
    distance: 2.8,
    prices: applyStoreAdjustments(basePriceCatalog, 0.93, { produce: -0.05, milk: -0.12, eggs: -0.18 })
  },
  {
    name: "Target",
    distance: 3.6,
    prices: applyStoreAdjustments(basePriceCatalog, 1.01, { cereal: -0.2, coffee: -0.15, frozen_pizza: -0.25 })
  },
  {
    name: "Kroger",
    distance: 1.9,
    prices: applyStoreAdjustments(basePriceCatalog, 0.98, { chicken: -0.3, ground_beef: -0.25, rice: -0.2 })
  },
  {
    name: "Costco",
    distance: 5.4,
    prices: applyStoreAdjustments(basePriceCatalog, 0.89, { olive_oil: -0.8, coffee: -0.7, cheese: -0.45 })
  },
  {
    name: "Safeway",
    distance: 2.4,
    prices: applyStoreAdjustments(basePriceCatalog, 1.04, { strawberries: -0.25, blueberries: -0.2, salmon: -0.5 })
  },
  {
    name: "Whole Foods",
    distance: 4.1,
    prices: applyStoreAdjustments(basePriceCatalog, 1.19, { salmon: -0.35, spinach: -0.2 })
  }
];

const itemAliases = {
  "2% milk": "milk",
  "whole milk": "milk",
  "almond milk": "milk",
  "dozen eggs": "eggs",
  "brown eggs": "eggs",
  "white rice": "rice",
  "jasmine rice": "rice",
  "chicken breast": "chicken",
  "ground beef": "ground_beef",
  "orange juice": "orange_juice",
  "peanut butter": "peanut_butter",
  "olive oil": "olive_oil",
  "frozen pizza": "frozen_pizza",
  "ice cream": "ice_cream",
  "cereal bars": "cereal_bars",
  "green apple": "green_apples",
  "gala apple": "gala_apples",
  "red grapes": "red_grapes",
  "green grapes": "green_grapes",
  "roma tomato": "roma_tomatoes",
  "baby spinach": "baby_spinach",
  "romaine lettuce": "romaine_lettuce",
  "iceberg lettuce": "iceberg_lettuce",
  "english cucumber": "english_cucumber",
  "yellow squash": "yellow_squash",
  "red bell pepper": "red_bell_pepper",
  "green bell pepper": "green_bell_pepper",
  "broccoli florets": "broccoli_florets",
  "portobello mushrooms": "portobello_mushrooms",
  "shiitake mushrooms": "shiitake_mushrooms",
  "brussels sprouts": "brussels_sprouts",
  "corn on the cob": "corn_on_the_cob",
  "green onion": "green_onions",
  "protein bar": "protein_bars",
  "sports drink": "sports_drink",
  "sparkling water": "sparkling_water",
  "paper towels": "paper_towels",
  "toilet paper": "toilet_paper",
  "trash bags": "trash_bags",
  "dish soap": "dish_soap",
  "laundry detergent": "laundry_detergent",
  "ground coffee": "ground_coffee",
  "black beans": "black_beans",
  "chicken thighs": "chicken_thighs",
  "beef steak": "beef_steak",
  "bell pepper": "tomato",
  "romaine": "lettuce"
};

function initializeDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        distance_km REAL NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS store_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        item_name TEXT NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (store_id) REFERENCES stores(id)
      )
    `);

    db.get("SELECT COUNT(*) AS count FROM stores", (err, row) => {
      if (err) {
        console.error("Error checking seed data:", err.message);
        return;
      }

      db.get("SELECT COUNT(*) AS count FROM store_items", (itemErr, itemRow) => {
        if (itemErr) {
          console.error("Error checking item seed data:", itemErr.message);
          return;
        }

        const expectedItemCount = seedStores.length * baseCatalogEntries.length;
        const shouldSeed = row.count !== seedStores.length || itemRow.count !== expectedItemCount;
        if (!shouldSeed) {
          return;
        }

        db.run("DELETE FROM store_items", (deleteItemsErr) => {
          if (deleteItemsErr) {
            console.error("Error clearing store_items:", deleteItemsErr.message);
            return;
          }

          db.run("DELETE FROM stores", (deleteStoresErr) => {
            if (deleteStoresErr) {
              console.error("Error clearing stores:", deleteStoresErr.message);
              return;
            }

            seedStores.forEach((store) => {
              db.run(
                "INSERT INTO stores (name, distance_km) VALUES (?, ?)",
                [store.name, store.distance],
                function onStoreInsert(insertStoreErr) {
                  if (insertStoreErr) {
                    console.error("Error inserting store:", insertStoreErr.message);
                    return;
                  }

                  const storeId = this.lastID;
                  Object.entries(store.prices).forEach(([item, price]) => {
                    db.run(
                      "INSERT INTO store_items (store_id, item_name, price) VALUES (?, ?, ?)",
                      [storeId, item.toLowerCase(), price],
                      (insertItemErr) => {
                        if (insertItemErr) {
                          console.error("Error inserting item:", insertItemErr.message);
                        }
                      }
                    );
                  });
                }
              );
            });

            console.log(`Database seeded with ${seedStores.length} stores and ${baseCatalogEntries.length} grocery items.`);
          });
        });
      });
    });
  });
}

function maybeNormalizeItemName(item) {
  const cleaned = item.trim().toLowerCase();
  const fuzzyDirectMatch = maybeFindFuzzyCatalogMatch(cleaned);
  if (fuzzyDirectMatch) {
    return Promise.resolve(fuzzyDirectMatch);
  }

  if (itemAliases[cleaned]) {
    return Promise.resolve(itemAliases[cleaned]);
  }

  const normalizedSpacing = cleaned.replace(/\s+/g, "_");
  if (basePriceCatalog[normalizedSpacing]) {
    return Promise.resolve(normalizedSpacing);
  }

  if (basePriceCatalog[cleaned]) {
    return Promise.resolve(cleaned);
  }

  if (!process.env.OPENAI_API_KEY) {
    return Promise.resolve(fuzzyDirectMatch || cleaned);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client.responses
    .create({
      model: OPENAI_MODEL,
      input: `Normalize this grocery search into a single item keyword in lowercase.
Examples: "2% milk gallon" -> "milk", "brown eggs dozen" -> "eggs".
Return only the keyword.
Input: "${item}"`,
      max_output_tokens: 20
    })
    .then((response) => {
      const modelValue = response.output_text.trim().toLowerCase();
      const modelWithUnderscore = modelValue.replace(/\s+/g, "_");
      if (itemAliases[modelValue]) {
        return itemAliases[modelValue];
      }
      if (basePriceCatalog[modelWithUnderscore]) {
        return modelWithUnderscore;
      }
      if (basePriceCatalog[modelValue]) {
        return modelValue;
      }
      const fuzzyModelMatch = maybeFindFuzzyCatalogMatch(modelValue);
      if (fuzzyModelMatch) {
        return fuzzyModelMatch;
      }
      return cleaned;
    })
    .catch(() => fuzzyDirectMatch || cleaned);
}

function runAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

async function maybeNormalizeManyItems(items) {
  const normalized = await Promise.all(items.map((item) => maybeNormalizeItemName(item)));
  return [...new Set(normalized.filter((value) => value && basePriceCatalog[value]))];
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/items", (req, res) => {
  const categoryFilter = typeof req.query.category === "string" ? req.query.category.toLowerCase() : "all";
  const items = Object.keys(basePriceCatalog)
    .filter((itemName) => categoryFilter === "all" || getItemCategory(itemName) === categoryFilter)
    .sort((a, b) => a.localeCompare(b))
    .map((itemName) => ({
      key: itemName,
      label: toDisplayName(itemName),
      category: getItemCategory(itemName),
      unit: getItemUnit(itemName)
    }));

  res.json({ items });
});

app.get("/api/search", async (req, res) => {
  const item = req.query.item;

  if (!item || typeof item !== "string") {
    return res.status(400).json({ error: "Please provide an item query parameter." });
  }

  const normalizedItem = await maybeNormalizeItemName(item);
  const itemCategory = getItemCategory(normalizedItem);
  const itemUnit = getItemUnit(normalizedItem);

  const sql = `
    SELECT
      stores.name AS storeName,
      stores.distance_km AS distanceKm,
      store_items.price AS price
    FROM store_items
    JOIN stores ON stores.id = store_items.store_id
    WHERE store_items.item_name = ?
    ORDER BY store_items.price ASC
  `;

  db.all(sql, [normalizedItem], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database query failed." });
    }

    return res.json({
      requestedItem: item,
      matchedItem: normalizedItem,
      category: itemCategory,
      unit: itemUnit,
      results: rows
    });
  });
});

app.post("/api/ai/query", async (req, res) => {
  const { prompt, maxResults = 20 } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Please provide a prompt string." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(400).json({ error: "OPENAI_API_KEY is required for AI queries." });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const aiResponse = await client.responses.create({
      model: OPENAI_MODEL,
      input: `You are mapping grocery user requests to DB query parameters.
Return only valid JSON with this shape:
{
  "itemKeywords": string[],
  "maxDistanceMiles": number|null,
  "sortBy": "price"|"distance"
}
Rules:
- "itemKeywords" must contain grocery terms only.
- Use null for maxDistanceMiles when user does not mention distance.
- Default sortBy to "price" unless user explicitly prioritizes nearby distance.
User request: "${prompt}"`,
      max_output_tokens: 180
    });

    const parsed = safeJsonParse(aiResponse.output_text.trim());
    if (!parsed || !Array.isArray(parsed.itemKeywords) || parsed.itemKeywords.length === 0) {
      return res.status(400).json({ error: "Could not parse grocery items from prompt." });
    }

    const normalizedItems = await maybeNormalizeManyItems(parsed.itemKeywords);
    if (normalizedItems.length === 0) {
      return res.json({
        prompt,
        interpreted: { itemKeywords: parsed.itemKeywords, matchedItems: [], maxDistanceMiles: null, sortBy: "price" },
        results: []
      });
    }

    const maxDistanceMiles = Number(parsed.maxDistanceMiles);
    const hasDistanceLimit = Number.isFinite(maxDistanceMiles) && maxDistanceMiles > 0;
    const maxDistanceKm = hasDistanceLimit ? maxDistanceMiles / 0.621371 : null;
    const sortBy = parsed.sortBy === "distance" ? "distance" : "price";
    const safeLimit = Math.min(Math.max(Number(maxResults) || 20, 1), 100);
    const placeholders = normalizedItems.map(() => "?").join(", ");
    const whereDistance = hasDistanceLimit ? "AND stores.distance_km <= ?" : "";
    const orderBy = sortBy === "distance" ? "stores.distance_km ASC, store_items.price ASC" : "store_items.price ASC, stores.distance_km ASC";

    const sql = `
      SELECT
        stores.name AS storeName,
        stores.distance_km AS distanceKm,
        store_items.item_name AS itemName,
        store_items.price AS price
      FROM store_items
      JOIN stores ON stores.id = store_items.store_id
      WHERE store_items.item_name IN (${placeholders})
      ${whereDistance}
      ORDER BY ${orderBy}
      LIMIT ?
    `;

    const queryParams = hasDistanceLimit
      ? [...normalizedItems, maxDistanceKm, safeLimit]
      : [...normalizedItems, safeLimit];

    const rows = await runAll(sql, queryParams);
    const results = rows.map((row) => ({
      storeName: row.storeName,
      distanceKm: row.distanceKm,
      itemName: row.itemName,
      price: row.price,
      unit: getItemUnit(row.itemName),
      category: getItemCategory(row.itemName)
    }));

    return res.json({
      prompt,
      interpreted: {
        itemKeywords: parsed.itemKeywords,
        matchedItems: normalizedItems,
        maxDistanceMiles: hasDistanceLimit ? Number(maxDistanceMiles.toFixed(2)) : null,
        sortBy
      },
      results
    });
  } catch (error) {
    return res.status(500).json({ error: "AI query failed.", details: error.message });
  }
});

initializeDatabase();

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
