import type OpenAI from "openai";

export const SIMILAR_ALTERNATIVES_DISCLAIMER =
  "AI suggestions only—verify products, ingredients, and prices in store before you buy.";

const SYSTEM =
  "You help grocery and household shoppers. The user names one product. Suggest 3–4 similar alternatives " +
  "(different brands, sizes, store brands, or close substitutes). Return ONLY valid JSON (no markdown) with shape " +
  '{"alternatives":[{"name":string,"whySimilar":string}]} . Each whySimilar is one short sentence.';

const MODEL = "gpt-4.1-mini";

export function fallbackSimilarAlternatives(item: string) {
  const k = String(item || "item").toLowerCase().trim() || "item";
  return [
    { name: `Store-brand ${k}`, whySimilar: "Same category, usually same aisle as national brands." },
    { name: `${k} (smaller pack)`, whySimilar: "Lower shelf price if you need less quantity." },
    { name: `Bulk ${k}`, whySimilar: "Often better per-unit cost when you can use more." },
  ];
}

function parseJson(raw: string): { alternatives?: unknown[] } {
  const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : "{}";
  return JSON.parse(slice) as { alternatives?: unknown[] };
}

function normalizeRow(entry: unknown): { name: string; whySimilar: string } {
  const e = entry as Record<string, unknown>;
  return {
    name: String(e?.name ?? "").trim() || "Alternative",
    whySimilar: String(e?.whySimilar ?? e?.reason ?? "").trim(),
  };
}

export async function fetchSimilarAlternativesFromOpenAI(openai: OpenAI, item: string) {
  const res = await openai.responses.create({
    model: MODEL,
    input: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Product the shopper has in mind: "${item}". Return JSON only.`,
      },
    ],
  });
  const text = String(res.output_text || "{}");
  const parsed = parseJson(text);
  const rows = Array.isArray(parsed.alternatives) ? parsed.alternatives : [];
  return rows.map(normalizeRow).filter((r) => r.name);
}

export type SimilarAlternativesBody = {
  item: string;
  alternatives: { name: string; whySimilar: string }[];
  source: "openai" | "fallback";
  disclaimer: string;
};

export async function buildSimilarAlternativesResponse(
  openai: OpenAI | null,
  item: string
): Promise<{ status: number; body: SimilarAlternativesBody | { error: string; disclaimer: string } }> {
  const trimmed = String(item || "").trim();
  if (!trimmed) {
    return {
      status: 400,
      body: { error: "item is required.", disclaimer: SIMILAR_ALTERNATIVES_DISCLAIMER },
    };
  }

  try {
    const list = openai ? await fetchSimilarAlternativesFromOpenAI(openai, trimmed) : fallbackSimilarAlternatives(trimmed);
    const alternatives = list.length ? list : fallbackSimilarAlternatives(trimmed);
    return {
      status: 200,
      body: {
        item: trimmed,
        alternatives,
        source: openai ? "openai" : "fallback",
        disclaimer: SIMILAR_ALTERNATIVES_DISCLAIMER,
      },
    };
  } catch {
    return {
      status: 200,
      body: {
        item: trimmed,
        alternatives: fallbackSimilarAlternatives(trimmed),
        source: "fallback",
        disclaimer: SIMILAR_ALTERNATIVES_DISCLAIMER,
      },
    };
  }
}
