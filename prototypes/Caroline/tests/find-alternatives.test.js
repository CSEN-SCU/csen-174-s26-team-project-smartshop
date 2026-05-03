import test from "node:test";
import assert from "node:assert/strict";

import { postFindAlternatives } from "../src/alternatives.mjs";

// As a shopper, when I describe something I want to buy—like a cotton hoodie—I want Smart Shop to suggest a few similar products with estimated prices and short reasons so I can compare options before I shop.
test("find-alternatives returns structured alternatives from OpenAI-shaped response", async () => {
  // Arrange — set up inputs: a fake AI client returning a fixed JSON payload, and my plain-language request.
  const mockOpenAI = {
    responses: {
      create: async () => ({
        output_text: JSON.stringify({
          alternatives: [
            { name: "Uniqlo cotton hoodie", estimatedPrice: 39.9, reason: "Similar fabric and fit." },
            { name: "Hanes fleece pullover", estimatedPrice: 24.99, reason: "Lower price, casual use." },
            { name: "Amazon Essentials hoodie", estimatedPrice: 28.0, reason: "Budget-friendly basic." }
          ]
        })
      })
    }
  };
  const description = "cotton hoodie";

  // Action — call the handler that builds the alternatives response our app would return.
  const result = await postFindAlternatives(mockOpenAI, description, "");

  // Assert — status, source, and each alternative row must match what we expose to users.
  const data = result.body;
  assert.equal(result.status, 200);
  assert.ok(Array.isArray(data.alternatives), "alternatives must be an array");
  assert.ok(data.alternatives.length > 0, "alternatives must not be empty");
  assert.equal(data.source, "openai");

  for (const alt of data.alternatives) {
    assert.equal(typeof alt.name, "string");
    assert.ok(alt.name.trim().length > 0);
    assert.equal(typeof alt.estimatedPrice, "number");
    assert.ok(Number.isFinite(alt.estimatedPrice));
    assert.equal(typeof alt.reason, "string");
    assert.ok(alt.reason.trim().length > 0);
  }
});
