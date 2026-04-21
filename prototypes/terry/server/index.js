import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { openDatabase } from "./db.js";
import { normalizeGroceryList } from "./aiNormalize.js";
import { compareStores } from "./compare.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const app = express();
const db = openDatabase();

app.use(express.json({ limit: "256kb" }));
app.use(express.static(publicDir));

app.post("/api/normalize", async (req, res) => {
  try {
    const rawList = req.body?.rawList;
    if (typeof rawList !== "string") {
      return res.status(400).json({ error: "Expected { rawList: string }" });
    }
    const result = await normalizeGroceryList(rawList);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Normalize failed" });
  }
});

app.post("/api/compare", (req, res) => {
  try {
    const items = req.body?.items;
    if (!Array.isArray(items) || !items.every((x) => typeof x === "string")) {
      return res
        .status(400)
        .json({ error: "Expected { items: string[] }" });
    }
    const result = compareStores(db, items);
    if (!result.ok) {
      return res.status(422).json(result);
    }
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Compare failed" });
  }
});

const PORT = Number(process.env.PORT) || 3840;
app.listen(PORT, () => {
  console.log(`SmartShop prototype: http://localhost:${PORT}`);
});
