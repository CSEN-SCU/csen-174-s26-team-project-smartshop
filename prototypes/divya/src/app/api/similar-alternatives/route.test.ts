/**
 * POST /api/similar-alternatives — mocks OpenAI
 */

import { NextRequest } from "next/server";

jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    responses: {
      create: jest.fn().mockResolvedValue({
        output_text: JSON.stringify({
          alternatives: [{ name: "Store-brand oats", whySimilar: "Same use case, lower marketing cost." }],
        }),
      }),
    },
  })),
}));

process.env.OPENAI_API_KEY = "test-key";

import { POST } from "./route";

describe("POST /api/similar-alternatives", () => {
  test("returns alternatives for a valid item", async () => {
    const req = new NextRequest("http://localhost/api/similar-alternatives", {
      method: "POST",
      body: JSON.stringify({ item: "rolled oats" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.source).toBe("openai");
    expect(data.alternatives.length).toBeGreaterThanOrEqual(1);
    expect(data.alternatives[0].name).toBeDefined();
    expect(data.disclaimer).toBeDefined();
  });

  test("returns 400 for empty item", async () => {
    const req = new NextRequest("http://localhost/api/similar-alternatives", {
      method: "POST",
      body: JSON.stringify({ item: "   " }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
