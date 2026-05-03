import test from "node:test";
import assert from "node:assert/strict";

import { postFindAlternatives } from "../src/alternatives.mjs";

// As a shopper, when I describe an item I want (like a hoodie), Smart Shop suggests a few comparable options with estimated prices so I can compare without visiting every store.
test("find-alternatives returns structured alternatives from OpenAI-shaped response", async () => {
  // Arrange
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

  // Action
  const result = await postFindAlternatives(mockOpenAI, description, "");
  const data = result.body;

  // Assert
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
