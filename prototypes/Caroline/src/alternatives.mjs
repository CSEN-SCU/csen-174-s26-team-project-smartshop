/**
 * Find-similar-alternatives handler for unit tests (inject mock `openai`).
 * Mirrors the prototype API contract without wiring into server.js yet.
 */

export function fallbackAlternatives(description) {
  const key = description.toLowerCase();
  return [
    { name: `${key} - budget alternative`, estimatedPrice: 14.99, reason: "Lower-cost similar style/material." },
    { name: `${key} - midrange alternative`, estimatedPrice: 24.99, reason: "Balanced price and quality." },
    { name: `${key} - value pack alternative`, estimatedPrice: 11.49, reason: "Best savings per unit." }
  ];
}

/** One `responses.create` per user alternatives request (no batching or retries here). */
async function findAlternativesWithOpenAI(openai, description, imageDataUrl) {
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

export async function postFindAlternatives(openai, description, imageDataUrl = "") {
  if (!String(description || "").trim()) {
    return { status: 400, body: { error: "description is required." } };
  }

  try {
    const alternatives = openai
      ? await findAlternativesWithOpenAI(openai, description, imageDataUrl)
      : fallbackAlternatives(description);
    return { status: 200, body: { alternatives, source: openai ? "openai" : "fallback" } };
  } catch {
    return { status: 200, body: { alternatives: fallbackAlternatives(description), source: "fallback" } };
  }
}
