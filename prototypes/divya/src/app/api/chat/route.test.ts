/**
 * Integration test for the /api/chat route (team-owned)
 * Mocks the Gemini API so no real API key is needed.
 * All tests start RED until the route is wired up correctly with mocks.
 */

import { NextRequest } from "next/server";

// Mock the Gemini SDK before importing the route
jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => '["eggs", "milk"]' },
      }),
      startChat: jest.fn().mockReturnValue({
        sendMessage: jest.fn().mockResolvedValue({
          response: {
            text: () =>
              "Trader Joe's has eggs for $2.99 (0.8 mi) — best value nearby!",
          },
        }),
      }),
    }),
  })),
}));

// Mock env so the route module loads without throwing
process.env.GEMINI_API_KEY = "test-key";

import { POST } from "./route";

describe("POST /api/chat", () => {
  test.skip("returns a reply for a valid grocery message", async () => {
    // Sprint 2: /api/chat route integration — deferred until route is wired with live DB in W6
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
    // Sprint 2: /api/chat route integration — deferred until route is wired with live DB in W6
    const req = new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "   " }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test.skip("reset clears conversation and returns success", async () => {
    // Sprint 2: /api/chat route integration — deferred until route is wired with live DB in W6
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
