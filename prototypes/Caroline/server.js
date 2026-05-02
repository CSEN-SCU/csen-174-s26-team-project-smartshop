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
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

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

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
const GOOGLE_PLACES_NEARBY_NEW_URL = "https://places.googleapis.com/v1/places:searchNearby";
const GOOGLE_PLACES_TEXT_NEW_URL = "https://places.googleapis.com/v1/places:searchText";
const locationCache = new Map();

/**
 * Collector contract (architecture sketch):
 * - id: unique source id
 * - displayName: source label
 * - collect({ items, maxDistance, userLocation }): returns normalized store option list
 *
 * Each real retailer implementation should fetch location-aware product prices, then map
 * into this same shape so compare logic stays unchanged.
 */
function createMockCollector(store) {
  return {
    id: `mock-${store.name.toLowerCase().replace(/\s+/g, "-")}`,
    displayName: `${store.name} (mock)`,
    async collect({ items, maxDistance }) {
      const option = calculateStoreOption(store, items);
      if (option.distanceMi > maxDistance) {
        return [];
      }
      return [
        {
          ...option,
          source: "mock",
          sourceId: this.id,
          fetchedAt: new Date().toISOString()
        }
      ];
    }
  };
}

const collectors = STORE_CATALOG.map((store) => createMockCollector(store));

function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function retailerMultiplier(name) {
  const lower = name.toLowerCase();
  if (lower.includes("whole foods")) return 1.2;
  if (lower.includes("trader joe")) return 1.05;
  if (lower.includes("walmart")) return 0.9;
  if (lower.includes("costco")) return 0.88;
  if (lower.includes("target")) return 0.98;
  if (lower.includes("safeway")) return 1.03;
  return 1;
}

async function geocodeLocation(locationQuery) {
  const cacheKey = `geo:${locationQuery.toLowerCase()}`;
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey);
  }

  // Prefer Google geocoding when key is present.
  if (GOOGLE_MAPS_API_KEY && locationQuery) {
    const url = new URL(GOOGLE_GEOCODE_URL);
    url.searchParams.set("address", locationQuery);
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);
    const res = await fetch(url);
    if (res.ok) {
      const payload = await res.json();
      if (payload.status === "OK" && Array.isArray(payload.results) && payload.results.length) {
        const loc = payload.results[0].geometry?.location;
        if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
          const value = {
            lat: Number(loc.lat),
            lon: Number(loc.lng),
            formattedAddress: String(payload.results[0].formatted_address || locationQuery)
          };
          locationCache.set(cacheKey, value);
          return value;
        }
      }
    }
  }

  if (!locationQuery) return null;
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", locationQuery);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  const res = await fetch(url, {
    headers: { "User-Agent": "smart-shop-prototype/1.0 (educational project)" }
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) return null;
  const value = {
    lat: Number(data[0].lat),
    lon: Number(data[0].lon),
    formattedAddress: String(data[0].display_name || locationQuery)
  };
  locationCache.set(cacheKey, value);
  return value;
}

async function fetchNearbyGoogleStores(location, radiusMeters = 12000) {
  if (!GOOGLE_MAPS_API_KEY || !location) return [];
  const res = await fetch(GOOGLE_PLACES_NEARBY_NEW_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask":
        "places.displayName,places.location,places.formattedAddress,places.primaryType,places.types"
    },
    body: JSON.stringify({
      includedTypes: ["supermarket", "grocery_store", "department_store"],
      maxResultCount: 20,
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: {
          center: { latitude: location.lat, longitude: location.lon },
          radius: radiusMeters
        }
      }
    })
  });
  if (!res.ok) return [];
  const payload = await res.json();
  const results = Array.isArray(payload.places) ? payload.places : [];

  // Deduplicate chain duplicates by name (keep nearest entry only).
  const deduped = results
    .map((place) => {
      const lat = Number(place.location?.latitude);
      const lon = Number(place.location?.longitude);
      return {
        name: String(place.displayName?.text || "Unnamed Store"),
        lat,
        lon,
        address: String(place.formattedAddress || ""),
        primaryType: String(place.primaryType || ""),
        distanceMi: haversineMiles(location.lat, location.lon, lat, lon)
      };
    })
    .filter((s) => s.name !== "Unnamed Store" && Number.isFinite(s.distanceMi));

  const byName = new Map();
  for (const store of deduped.sort((a, b) => a.distanceMi - b.distanceMi)) {
    const key = store.name.toLowerCase().trim();
    if (!byName.has(key)) {
      byName.set(key, store);
    }
  }
  return Array.from(byName.values()).slice(0, 12);
}

async function fetchChainGoogleStores(location, locationQuery, radiusMeters = 12000) {
  if (!GOOGLE_MAPS_API_KEY || !location) return [];
  const chains = ["Target", "Walmart", "Costco", "Safeway", "Trader Joe's", "Whole Foods"];
  const queryAnchor = locationQuery?.trim()
    ? locationQuery.trim()
    : location.formattedAddress || `${location.lat},${location.lon}`;
  const requests = chains.map((chain) =>
    fetch(GOOGLE_PLACES_TEXT_NEW_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask":
          "places.displayName,places.location,places.formattedAddress,places.primaryType"
      },
      body: JSON.stringify({
        textQuery: `${chain} near ${queryAnchor}`,
        maxResultCount: 4,
        locationBias: {
          circle: {
            center: { latitude: location.lat, longitude: location.lon },
            radius: radiusMeters
          }
        }
      })
    }).then(async (res) => {
      if (!res.ok) return [];
      const payload = await res.json();
      return Array.isArray(payload.places) ? payload.places : [];
    })
  );

  const chainResults = (await Promise.all(requests)).flat();
  return chainResults
    .map((place) => {
      const lat = Number(place.location?.latitude);
      const lon = Number(place.location?.longitude);
      return {
        name: String(place.displayName?.text || "Unnamed Store"),
        lat,
        lon,
        address: String(place.formattedAddress || ""),
        primaryType: String(place.primaryType || ""),
        distanceMi: haversineMiles(location.lat, location.lon, lat, lon)
      };
    })
    .filter((s) => s.name !== "Unnamed Store" && Number.isFinite(s.distanceMi) && s.distanceMi <= radiusMeters / 1609.34);
}

async function checkGoogleApiCapability() {
  if (!GOOGLE_MAPS_API_KEY) {
    return {
      hasApiKey: false,
      geocodingEnabled: false,
      placesEnabled: false,
      mode: "fallback"
    };
  }

  let geocodingEnabled = false;
  let placesEnabled = false;

  try {
    const geoUrl = new URL(GOOGLE_GEOCODE_URL);
    geoUrl.searchParams.set("address", "Santa Clara, CA");
    geoUrl.searchParams.set("key", GOOGLE_MAPS_API_KEY);
    const geoRes = await fetch(geoUrl);
    if (geoRes.ok) {
      const geoPayload = await geoRes.json();
      geocodingEnabled = geoPayload.status !== "REQUEST_DENIED" && geoPayload.status !== "OVER_DAILY_LIMIT";
    }
  } catch {
    geocodingEnabled = false;
  }

  try {
    const placesUrl = new URL(GOOGLE_PLACES_TEXT_SEARCH_URL);
    placesUrl.searchParams.set("query", "grocery stores in Santa Clara");
    placesUrl.searchParams.set("key", GOOGLE_MAPS_API_KEY);
    const placesRes = await fetch(placesUrl);
    if (placesRes.ok) {
      const placesPayload = await placesRes.json();
      placesEnabled = placesPayload.status !== "REQUEST_DENIED" && placesPayload.status !== "OVER_DAILY_LIMIT";
    }
  } catch {
    placesEnabled = false;
  }

  return {
    hasApiKey: true,
    geocodingEnabled,
    placesEnabled,
    mode: placesEnabled ? "google-places" : geocodingEnabled ? "google-geocode+fallback-stores" : "fallback"
  };
}

async function fetchNearbyRealStores(location, radiusMeters = 12000) {
  if (!location) return [];
  const googleStores = await fetchNearbyGoogleStores(location, radiusMeters);
  const chainStores = await fetchChainGoogleStores(location, location.formattedAddress, radiusMeters);
  const mergedGoogle = [...googleStores, ...chainStores];
  if (mergedGoogle.length) {
    const byName = new Map();
    for (const store of mergedGoogle.sort((a, b) => a.distanceMi - b.distanceMi)) {
      const key = store.name.toLowerCase().trim();
      if (!byName.has(key)) byName.set(key, store);
    }
    return Array.from(byName.values()).slice(0, 15);
  }

  const query = `
[out:json][timeout:20];
(
  node["shop"="supermarket"](around:${radiusMeters},${location.lat},${location.lon});
  node["shop"="department_store"](around:${radiusMeters},${location.lat},${location.lon});
  node["shop"="convenience"](around:${radiusMeters},${location.lat},${location.lon});
);
out body 40;
`;
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: query
  });
  if (!res.ok) return [];
  const payload = await res.json();
  const elements = Array.isArray(payload.elements) ? payload.elements : [];
  return elements
    .map((el) => ({
      name: el.tags?.name || "Unnamed Store",
      lat: Number(el.lat),
      lon: Number(el.lon),
      distanceMi: haversineMiles(location.lat, location.lon, Number(el.lat), Number(el.lon))
    }))
    .filter((s) => s.name !== "Unnamed Store" && Number.isFinite(s.distanceMi))
    .sort((a, b) => a.distanceMi - b.distanceMi)
    .slice(0, 15);
}

function createRealStoreCollector() {
  return {
    id: "real-osm-nearby-stores",
    displayName: "OpenStreetMap Nearby Stores",
    async collect({ items, maxDistance, userLocation }) {
      const rawLocationQuery = userLocation?.locationQuery || "";
      const location = await geocodeLocation(rawLocationQuery);
      if (!location) return [];
      // Match lookup radius to user's chosen max distance.
      const radiusMeters = Math.min(Math.max(Math.ceil(maxDistance * 1609.34), 1609), 50000);
      location.formattedAddress = rawLocationQuery || location.formattedAddress;
      const nearbyStores = await fetchNearbyRealStores(location, radiusMeters);
      return nearbyStores
        .filter((store) => store.distanceMi <= maxDistance)
        .map((store) => {
          const itemBreakdown = items.map((item) => {
            const base = estimateUnknownPrice(item.name, "Budget Basket");
            const adj = retailerMultiplier(store.name);
            return {
              item: item.name,
              category: item.category,
              price: Number((base * adj).toFixed(2)),
              estimated: true
            };
          });
          const total = itemBreakdown.reduce((sum, entry) => sum + entry.price, 0);
          return {
            storeName: store.name,
            distanceMi: Number(store.distanceMi.toFixed(2)),
            storeAddress: store.address || "",
            total,
            knownCount: 0,
            totalCount: itemBreakdown.length,
            itemBreakdown,
            source: "real-store-estimated-price",
            sourceId: this.id,
            fetchedAt: new Date().toISOString()
          };
        });
    }
  };
}

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
  const request = {
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "Normalize shopping list entries. Return strict JSON {\"items\": [{\"name\": string, \"category\": \"groceries|cleaning|home goods|clothing|makeup|other\"}]}. Lowercase item names."
      },
      { role: "user", content: `Normalize this list:\n${rawText}` }
    ]
  };

  let lastError = null;
  let response = null;

  // Give OpenAI an extra attempt for slower/transient responses before falling back.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await openai.responses.create(request, { timeout: 45000 });
      break;
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  if (!response) {
    throw lastError || new Error("OpenAI normalization request failed.");
  }

  const rawOutput = String(response.output_text || "");
  let parsed;
  try {
    parsed = JSON.parse(rawOutput || "{\"items\":[]}");
  } catch {
    // Recover JSON object if model wraps valid JSON with extra text.
    const start = rawOutput.indexOf("{");
    const end = rawOutput.lastIndexOf("}");
    if (start >= 0 && end > start) {
      parsed = JSON.parse(rawOutput.slice(start, end + 1));
    } else {
      throw new Error("OpenAI normalization response was not valid JSON.");
    }
  }

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

function fallbackAlternatives(description) {
  const key = description.toLowerCase();
  return [
    { name: `${key} - budget alternative`, estimatedPrice: 14.99, reason: "Lower-cost similar style/material." },
    { name: `${key} - midrange alternative`, estimatedPrice: 24.99, reason: "Balanced price and quality." },
    { name: `${key} - value pack alternative`, estimatedPrice: 11.49, reason: "Best savings per unit." }
  ];
}

async function findAlternativesWithOpenAI(description, imageDataUrl) {
  const input = [
    {
      role: "system",
      content:
        "You are a shopping alternative assistant. Return strict JSON with {\"alternatives\":[{\"name\":string,\"estimatedPrice\":number,\"reason\":string}]} and no extra text."
    }
  ];
  const userContent = [{ type: "input_text", text: `Find 3 affordable alternatives for: ${description}` }];
  if (imageDataUrl) {
    userContent.push({ type: "input_image", image_url: imageDataUrl });
  }
  input.push({ role: "user", content: userContent });

  const response = await openai.responses.create({ model: "gpt-4.1-mini", input });
  const parsed = JSON.parse(response.output_text || "{\"alternatives\":[]}");
  return Array.isArray(parsed.alternatives) ? parsed.alternatives : [];
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
  } catch (error) {
    const items = normalizeFallback(rawText).map((name) => ({ name, category: detectCategory(name) }));
    const message = String(error?.message || "unknown error").replace(/\s+/g, " ").trim();
    return res.json({
      items,
      source: "fallback",
      warning: `OpenAI normalization failed: ${message}`
    });
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

  const includeMode = String(req.body?.storeMode || "both").toLowerCase();
  const activeCollectors = [];
  if (includeMode === "both" || includeMode === "mock") {
    activeCollectors.push(...collectors);
  }
  if (includeMode === "both" || includeMode === "real") {
    activeCollectors.push(createRealStoreCollector());
  }

  Promise.all(
    activeCollectors.map((collector) =>
      collector.collect({
        items,
        maxDistance,
        userLocation: req.body?.userLocation || null
      })
    )
  )
    .then((collectorResults) => {
      const options = collectorResults
        .flat()
        .sort((a, b) => (a.total === b.total ? a.distanceMi - b.distanceMi : a.total - b.total));

      const categoryCounts = items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});

      const hasReal = options.some((option) => option.source === "real-store-estimated-price");
      return res.json({
        options,
        frequentItems: getTopItems(userId),
        categoryCounts,
        resolvedLocation: req.body?.userLocation?.locationQuery || "",
        sourceCounts: options.reduce((acc, option) => {
          const key = option.source || "unknown";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {}),
        collectorSummary: activeCollectors.map((collector) => ({
          id: collector.id,
          displayName: collector.displayName
        })),
        warnings: hasReal
          ? []
          : [
              GOOGLE_MAPS_API_KEY
                ? "No live stores returned for the location query; showing mock fallback."
                : "GOOGLE_MAPS_API_KEY missing; live store results may be limited."
            ]
      });
    })
    .catch((error) => {
      return res.status(500).json({ error: `collector_failure: ${error.message}` });
    });
});

app.post("/api/find-alternatives", async (req, res) => {
  const description = String(req.body?.description || "").trim();
  const imageDataUrl = req.body?.imageDataUrl ? String(req.body.imageDataUrl) : "";

  if (!description) {
    return res.status(400).json({ error: "description is required." });
  }

  try {
    const alternatives = openai
      ? await findAlternativesWithOpenAI(description, imageDataUrl)
      : fallbackAlternatives(description);
    return res.json({ alternatives, source: openai ? "openai" : "fallback" });
  } catch {
    return res.json({ alternatives: fallbackAlternatives(description), source: "fallback" });
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

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/capabilities", async (_req, res) => {
  const google = await checkGoogleApiCapability();
  return res.json({
    google,
    liveStoreProvider: google.placesEnabled ? "google_places" : "openstreetmap_or_mock"
  });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`Smart Shop prototype server running at http://localhost:${PORT}`);
});

server.on("close", () => {
  console.log("Server closed.");
});

// Keep process active in environments that aggressively unref idle listeners.
setInterval(() => {}, 1 << 30);
