/**
 * Uses OpenAI when OPENAI_API_KEY is set; otherwise splits the list locally
 * so the demo always runs.
 */

function offlineNormalize(raw) {
  if (!raw || typeof raw !== "string") return [];
  const pieces = raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const p of pieces) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const pretty = p.charAt(0).toUpperCase() + p.slice(1);
    out.push(pretty);
  }
  return out;
}

export async function normalizeGroceryList(rawList) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { items: offlineNormalize(rawList), mode: "offline" };
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const base =
    process.env.OPENAI_BASE_URL?.replace(/\/$/, "") ||
    "https://api.openai.com/v1";

  const system = `You help a college student plan groceries. Given messy text, return a JSON object ONLY, with shape:
{"items":["item 1","item 2",...]}
Rules:
- One string per distinct product (merge duplicates).
- Use short, clear product names (e.g. "Milk (1 gal)" style when size matters).
- No extra keys, no markdown, no commentary.`;

  const user = `Normalize this grocery list into the JSON object:\n\n${rawList}`;

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`AI request failed (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim() || "";
  let parsed;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch {
    return { items: offlineNormalize(rawList), mode: "fallback" };
  }

  const items = Array.isArray(parsed.items)
    ? parsed.items.map((s) => String(s).trim()).filter(Boolean)
    : [];

  return { items: items.length ? items : offlineNormalize(rawList), mode: "ai" };
}
