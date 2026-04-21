/**
 * Resolves free-text item names to catalog rows and scores stores using
 * total price + distance penalty (dollars per mile).
 */

const DISTANCE_WEIGHT = 0.35;

function resolveItemId(db, label) {
  const q = label.trim().toLowerCase();
  if (!q) return null;

  const exact = db
    .prepare(
      `SELECT id, name FROM items WHERE lower(name) = ? OR search_key = ? LIMIT 1`
    )
    .get(q, q);
  if (exact) return exact;

  const like = db
    .prepare(
      `SELECT id, name FROM items
       WHERE ? LIKE '%' || search_key || '%' OR search_key LIKE '%' || ? || '%'
       OR lower(name) LIKE '%' || ? || '%'
       ORDER BY length(search_key) DESC
       LIMIT 1`
    )
    .get(q, q, q);
  return like || null;
}

export function compareStores(db, itemLabels) {
  const resolved = [];
  const unresolved = [];

  for (const label of itemLabels) {
    const row = resolveItemId(db, label);
    if (row) {
      resolved.push({ label, itemId: row.id, catalogName: row.name });
    } else {
      unresolved.push(label);
    }
  }

  if (resolved.length === 0) {
    return {
      ok: false,
      error:
        "No items matched our sample catalog. Try items like milk, eggs, bread, bananas, pasta, rice, yogurt, or cheese.",
      unresolved,
    };
  }

  const stores = db.prepare("SELECT id, name, distance_miles FROM stores").all();

  const priceStmt = db.prepare(
    "SELECT price FROM store_prices WHERE store_id = ? AND item_id = ?"
  );

  const results = [];

  for (const store of stores) {
    let total = 0;
    const lineItems = [];
    let missing = 0;

    for (const r of resolved) {
      const pr = priceStmt.get(store.id, r.itemId);
      if (pr == null) {
        missing++;
        continue;
      }
      total += pr.price;
      lineItems.push({
        label: r.catalogName,
        price: pr.price,
      });
    }

    if (missing > 0) {
      continue;
    }

    const distanceCost = DISTANCE_WEIGHT * store.distance_miles;
    const score = total + distanceCost;

    results.push({
      storeId: store.id,
      name: store.name,
      distanceMiles: store.distance_miles,
      totalPrice: Math.round(total * 100) / 100,
      score: Math.round(score * 100) / 100,
      lineItems,
    });
  }

  if (results.length === 0) {
    return {
      ok: false,
      error:
        "Sample data does not cover every item at a single store. Remove unmatched lines or stick to catalog items.",
      unresolved,
      partialMatches: resolved.map((r) => r.catalogName),
    };
  }

  results.sort((a, b) => a.score - b.score);
  const best = results[0];

  const whyLines = [
    `We ranked each store by **total cart price** plus **${DISTANCE_WEIGHT} × miles** from you (a simple “time and travel” cost).`,
    `**${best.name}** had the lowest combined score (**${best.score.toFixed(2)}**): groceries about **$${best.totalPrice.toFixed(2)}** and only **${best.distanceMiles} mi** away.`,
  ];

  if (results.length > 1) {
    const runner = results[1];
    whyLines.push(
      `Runner-up: **${runner.name}** — cart **$${runner.totalPrice.toFixed(2)}** at **${runner.distanceMiles} mi** (score **${runner.score.toFixed(2)}**). The extra distance tipped the balance.`
    );
  }

  return {
    ok: true,
    best,
    alternatives: results.slice(1),
    resolvedItems: resolved.map((r) => r.catalogName),
    unresolved,
    scoring: {
      distanceWeightPerMile: DISTANCE_WEIGHT,
      formula: `score = total_price + ${DISTANCE_WEIGHT} * distance_miles`,
    },
    why: whyLines.join("\n\n"),
  };
}
