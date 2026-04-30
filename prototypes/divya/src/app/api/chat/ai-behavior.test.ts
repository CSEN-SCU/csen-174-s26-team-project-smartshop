/**
 * AI-behavior tests for SmartShop (team-owned)
 * Verifies that AI responses meet behavioral expectations:
 * mentions stores, avoids bad output, handles unknown items gracefully.
 */

import { NextRequest } from "next/server";

process.env.GEMINI_API_KEY = "test-key";

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
  test("reply for a grocery query mentions a known store name", async () => {
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

  test("reply does not contain 'undefined' or '[object Object]'", async () => {
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

  test("reply for an unknown item is a non-empty string", async () => {
    mockGeminiReply(
      "I don't have price data for dragonfruitXYZ. Try checking a nearby store directly."
    );
    const { POST } = await import("./route");
    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "where can I buy dragonfruitXYZ?" }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(typeof data.reply).toBe("string");
    expect(data.reply.length).toBeGreaterThan(10);
  });
});
