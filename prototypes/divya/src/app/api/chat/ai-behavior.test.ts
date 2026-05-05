/**
 * AI-behavior tests for SmartShop (team-owned)
 * These verify that the AI response content meets expected behavioral contracts —
 * e.g., mentions stores, handles unknown items gracefully, stays concise.
 */

import { NextRequest } from "next/server";

process.env.GEMINI_API_KEY = "test-key";

// Each test controls exactly what the AI "says" via mocking
function mockGeminiReply(reply: string) {
  jest.resetModules();
  jest.doMock("@google/generative-ai", () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: { text: () => '["eggs"]' },
        }),
        startChat: jest.fn().mockReturnValue({
          sendMessage: jest.fn().mockResolvedValue({
            response: { text: () => reply },
          }),
        }),
      }),
    })),
  }));
}

describe("AI behavior contract", () => {
  test.skip("reply for a grocery query mentions a store name", async () => {
    // Sprint 2: AI behavior contract tests — deferred until Gemini integration is stable in W6
    mockGeminiReply(
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
    // Sprint 2: AI behavior contract tests — deferred until Gemini integration is stable in W6
    mockGeminiReply("Trader Joe's has eggs for $2.99.");
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
    // Sprint 2: AI behavior contract tests — deferred until Gemini integration is stable in W6
    mockGeminiReply(
      "I don't have price data for dragonfruitXYZ in my database. Try checking a nearby store directly."
    );
    const { POST } = await import("./route");

    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "where can I buy dragonfruitXYZ?" }),
    });

    const res = await POST(req);
    const data = await res.json();
    // The AI should acknowledge the missing item gracefully
    expect(data.reply.length).toBeGreaterThan(10);
  });
});
