/**
 * Integration test for the /api/chat route (team-owned)
 * Mocks OpenAI so no real API key is needed.
 */

import { NextRequest } from "next/server";

jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    responses: {
      create: jest.fn().mockResolvedValue({
        output_text: '["eggs", "milk"]',
      }),
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: "Trader Joe's has eggs for $2.99 (0.8 mi) — best value nearby!" } }],
        }),
      },
    },
  })),
}));

process.env.OPENAI_API_KEY = "test-key";

import { POST } from "./route";

describe("POST /api/chat", () => {
  test.skip("returns a reply for a valid grocery message", async () => {
    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "where can I buy eggs?" }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reply).toBeDefined();
    expect(typeof data.reply).toBe("string");
  });

  test.skip("returns 400 for an empty message", async () => {
    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "   " }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test.skip("reset clears conversation and returns success", async () => {
    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ reset: true }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
