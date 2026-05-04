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

/** RED: not calling the model yet — implement GREEN with one `responses.create` per request. */
async function findAlternativesWithOpenAI(_openai, _description, _imageDataUrl) {
  return [];
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
