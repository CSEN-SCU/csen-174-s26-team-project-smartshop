import test from "node:test";
import assert from "node:assert/strict";

import { postFindAlternatives } from "../src/alternatives.mjs";

// As a shopper, when I type what I want (like a cotton hoodie), Smart Shop should ask the AI once on that request—not skip the model or spam it with duplicate calls for the same click.
test("find-alternatives calls the AI client exactly once for a valid description", async () => {
  // Arrange — a fake OpenAI client that counts how many times we try to generate alternatives.
  let modelCalls = 0;
  const mockOpenAI = {
    responses: {
      create: async () => {
        modelCalls += 1;
        return {
          output_text: JSON.stringify({
            alternatives: [
              { name: "Example hoodie", estimatedPrice: 29.99, reason: "Placeholder suggestion for the test." }
            ]
          })
        };
      }
    }
  };
  const description = "cotton hoodie";

  // Action — I submit one alternatives search.
  await postFindAlternatives(mockOpenAI, description, "");

  // Assert — exactly one model request was made for that single user action.
  assert.equal(modelCalls, 1);
});
