import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 4000;

const CATEGORY_KEYWORDS = {
  groceries: ["milk", "eggs", "bread", "chicken", "rice", "apples", "bananas", "cereal", "turkey", "olive oil"],
  cleaning: ["dish soap", "detergent", "paper towels", "bleach", "cleaner", "trash bags", "sponges"],
  "home goods": ["candles", "storage bin", "bed sheet", "pillow", "blanket", "lamp", "towel"],
  clothing: ["hoodie", "jeans", "dress", "shirt", "sneakers", "jacket", "leggings"],
  makeup: ["concealer", "mascara", "lip gloss", "foundation", "blush", "eyeliner", "moisturizer"]
};

const STORE_CATALOG = [
  {
    name: "SaveWay Market",
    distanceMi: 1.8,
    prices: {
      milk: 3.89,
      eggs: 4.2,
      bread: 2.75,
      "chicken breast": 8.4,
      rice: 3.5,
      "dish soap": 4.1,
      apples: 3.2,
      bananas: 1.6,
      cereal: 4.6,
      mascara: 10.99,
      "paper towels": 6.8,
      hoodie: 28.0
    }
  },
  {
    name: "Budget Basket",
    distanceMi: 4.6,
    prices: {
      milk: 3.49,
      eggs: 3.99,
      bread: 2.35,
      "chicken breast": 7.7,
      rice: 2.95,
      "dish soap": 3.69,
      apples: 2.9,
      bananas: 1.3,
      cereal: 4.15,
      concealer: 8.99,
      "paper towels": 5.9,
      jeans: 24.0
    }
  },
  {
    name: "Greenline Grocer",
    distanceMi: 2.9,
    prices: {
      milk: 4.1,
      eggs: 4.35,
      bread: 2.95,
      "chicken breast": 8.15,
      rice: 3.25,
      "dish soap": 4.4,
      apples: 3.55,
      bananas: 1.55,
      cereal: 5.05,
      "lip gloss": 9.6,
      "storage bin": 11.9,
      sneakers: 52.0
    }
  },
  {
    name: "Metro Hypermart",
    distanceMi: 7.3,
    prices: {
      milk: 3.3,
      eggs: 3.79,
      bread: 2.1,
      "chicken breast": 7.25,
      rice: 2.7,
      "dish soap": 3.6,
      apples: 2.7,
      bananas: 1.2,
      cereal: 3.95,
      foundation: 11.5,
      "home cleaner": 4.75,
      leggings: 18.99
    }
  }
];

const FALLBACK_MULTIPLIER = {
  "SaveWay Market": 1.04,
  "Budget Basket": 0.98,
  "Greenline Grocer": 1.07,
  "Metro Hypermart": 0.95
};

const db = new Low(new JSONFile(path.join(__dirname, "db.json")), { users: {} });
await db.read();
db.data ||= { users: {} };
await db.write();

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(__dirname));

function normalizeFallback(rawText) {
  return rawText
    .split("\n")
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean);
}

function detectCategory(item) {
  const lower = item.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return category;
    }
  }
  return "other";
}

async function normalizeWithOpenAI(rawText) {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "Normalize shopping list entries. Return strict JSON {\"items\": [{\"name\": string, \"category\": \"groceries|cleaning|home goods|clothing|makeup|other\"}]}. Lowercase item names."
      },
      { role: "user", content: `Normalize this list:\n${rawText}` }
    ]
  });
  const parsed = JSON.parse(response.output_text || "{\"items\":[]}");
  if (!Array.isArray(parsed.items)) {
    return [];
  }
  return parsed.items
    .map((item) => ({
      name: String(item.name || "").trim().toLowerCase(),
      category: String(item.category || "other").toLowerCase()
    }))
    .filter((item) => item.name);
}

function estimateUnknownPrice(itemName, storeName) {
  const base = 2.5 + itemName.length * 0.35;
  const multiplier = FALLBACK_MULTIPLIER[storeName] ?? 1;
  return Number((base * multiplier).toFixed(2));
}

function calculateStoreOption(store, items) {
  const itemBreakdown = items.map((item) => {
    const knownPrice = store.prices[item.name];
    const estimated = knownPrice === undefined;
    const price = knownPrice ?? estimateUnknownPrice(item.name, store.name);
    return { item: item.name, category: item.category, price, estimated };
  });

  const total = itemBreakdown.reduce((sum, entry) => sum + entry.price, 0);
  const knownCount = itemBreakdown.filter((entry) => !entry.estimated).length;

  return {
    storeName: store.name,
    distanceMi: store.distanceMi,
    total,
    knownCount,
    totalCount: itemBreakdown.length,
    itemBreakdown
  };
}

function ensureUser(userId) {
  if (!db.data.users[userId]) {
    db.data.users[userId] = { purchaseCounts: {} };
  }
  return db.data.users[userId];
}

function getTopItems(userId, limit = 8) {
  const user = ensureUser(userId);
  return Object.entries(user.purchaseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([item, count]) => ({ item, count }));
}

function fallbackDupes(description) {
  const key = description.toLowerCase();
  return [
    { name: `${key} - budget dupe`, estimatedPrice: 14.99, reason: "Lower-cost similar style/material." },
    { name: `${key} - midrange dupe`, estimatedPrice: 24.99, reason: "Balanced price and quality." },
    { name: `${key} - value pack dupe`, estimatedPrice: 11.49, reason: "Best savings per unit." }
  ];
}

async function findDupesWithOpenAI(description, imageDataUrl) {
  const input = [
    {
      role: "system",
      content:
        "You are a shopping dupe assistant. Return strict JSON with {\"dupes\":[{\"name\":string,\"estimatedPrice\":number,\"reason\":string}]} and no extra text."
    }
  ];
  const userContent = [{ type: "input_text", text: `Find 3 affordable dupes for: ${description}` }];
  if (imageDataUrl) {
    userContent.push({ type: "input_image", image_url: imageDataUrl });
  }
  input.push({ role: "user", content: userContent });

  const response = await openai.responses.create({ model: "gpt-4.1-mini", input });
  const parsed = JSON.parse(response.output_text || "{\"dupes\":[]}");
  return Array.isArray(parsed.dupes) ? parsed.dupes : [];
}

app.post("/api/normalize-items", async (req, res) => {
  const rawText = String(req.body?.rawText || "");
  if (!rawText.trim()) {
    return res.status(400).json({ error: "rawText is required." });
  }

  try {
    const items = openai
      ? await normalizeWithOpenAI(rawText)
      : normalizeFallback(rawText).map((name) => ({ name, category: detectCategory(name) }));
    return res.json({ items, source: openai ? "openai" : "fallback" });
  } catch {
    const items = normalizeFallback(rawText).map((name) => ({ name, category: detectCategory(name) }));
    return res.json({ items, source: "fallback", warning: "OpenAI normalization failed." });
  }
});

app.post("/api/compare", (req, res) => {
  const userId = String(req.body?.userId || "guest");
  const maxDistance = Number(req.body?.maxDistance || 10);
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];

  const items = rawItems
    .map((item) => {
      if (typeof item === "string") {
        const name = item.trim().toLowerCase();
        return { name, category: detectCategory(name) };
      }
      const name = String(item?.name || "").trim().toLowerCase();
      const category = String(item?.category || detectCategory(name)).toLowerCase();
      return { name, category };
    })
    .filter((item) => item.name);

  if (!items.length) {
    return res.status(400).json({ error: "items array is required." });
  }

  const options = STORE_CATALOG.map((store) => calculateStoreOption(store, items))
    .filter((option) => option.distanceMi <= maxDistance)
    .sort((a, b) => (a.total === b.total ? a.distanceMi - b.distanceMi : a.total - b.total));

  const categoryCounts = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  return res.json({ options, frequentItems: getTopItems(userId), categoryCounts });
});

app.post("/api/find-dupes", async (req, res) => {
  const description = String(req.body?.description || "").trim();
  const imageDataUrl = req.body?.imageDataUrl ? String(req.body.imageDataUrl) : "";

  if (!description) {
    return res.status(400).json({ error: "description is required." });
  }

  try {
    const dupes = openai ? await findDupesWithOpenAI(description, imageDataUrl) : fallbackDupes(description);
    return res.json({ dupes, source: openai ? "openai" : "fallback" });
  } catch {
    return res.json({ dupes: fallbackDupes(description), source: "fallback" });
  }
});

app.post("/api/users/:userId/purchases", async (req, res) => {
  const userId = String(req.params.userId || "guest");
  const items = Array.isArray(req.body?.items)
    ? req.body.items
        .map((item) => (typeof item === "string" ? item : item?.name))
        .map((item) => String(item || "").trim().toLowerCase())
        .filter(Boolean)
    : [];

  if (!items.length) {
    return res.status(400).json({ error: "items array is required." });
  }

  const user = ensureUser(userId);
  items.forEach((item) => {
    user.purchaseCounts[item] = (user.purchaseCounts[item] || 0) + 1;
  });
  await db.write();

  return res.json({ ok: true, frequentItems: getTopItems(userId) });
});

app.get("/api/users/:userId/frequent-items", (req, res) => {
  const userId = String(req.params.userId || "guest");
  return res.json({ items: getTopItems(userId) });
});

app.listen(PORT, () => {
  console.log(`Smart Shop prototype server running at http://localhost:${PORT}`);
});
