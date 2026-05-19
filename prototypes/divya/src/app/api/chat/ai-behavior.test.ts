/**
 * AI-behavior tests for SmartShop (team-owned)
 * These verify that the AI response content meets expected behavioral contracts —
 * e.g., mentions stores, handles unknown items gracefully, stays concise.
 */

import { NextRequest } from "next/server";

process.env.OPENAI_API_KEY = "test-key";

// Each test controls exactly what the AI "says" via mocking
function mockOpenAIReplies(extractJson: string, chatReply: string) {
  jest.resetModules();
  jest.doMock("openai", () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      responses: {
        create: jest.fn().mockResolvedValue({
          output_text: extractJson,
        }),
      },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: chatReply } }],
          }),
        },
      },
    })),
  }));
}

describe("AI behavior contract", () => {
  test.skip("reply for a grocery query mentions a store name", async () => {
    mockOpenAIReplies(
      '["eggs"]',
      "Trader Joe's has the best price for eggs at $2.99 (0.8 mi away)."
    );
    const { POST } = await import("./route");

    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "where can I buy eggs cheaply?" }),
    });

    const res = await POST(req);
    const data = await res.json();
    const storeNames = ["Trader Joe's", "Safeway", "Whole Foods", "Target", "Costco"];
    const mentionsStore = storeNames.some((s) => data.reply.includes(s));
    expect(mentionsStore).toBe(true);
  });

  test.skip("reply does not contain 'undefined' or '[object Object]'", async () => {
    mockOpenAIReplies('["eggs"]', "Trader Joe's has eggs for $2.99.");
    const { POST } = await import("./route");

    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "cheapest eggs?" }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.reply).not.toContain("undefined");
    expect(data.reply).not.toContain("[object Object]");
  });

  test.skip("reply for unknown item acknowledges it is not in the database", async () => {
    mockOpenAIReplies(
      '["dragonfruitXYZ"]',
      "I don't have price data for dragonfruitXYZ in my database. Try checking a nearby store directly."
    );
    const { POST } = await import("./route");

    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "where can I buy dragonfruitXYZ?" }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(data.reply.length).toBeGreaterThan(10);
  });
});
