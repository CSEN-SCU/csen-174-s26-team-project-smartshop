import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getPricesForItems, saveMessage, getRecentMessages } from "@/lib/db";

if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "Missing GEMINI_API_KEY. Create a .env.local file in this directory and add: GEMINI_API_KEY=your_key_here\n" +
    "Get your key at: https://aistudio.google.com/app/apikey"
  );
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are SmartShop, a friendly grocery price comparison assistant. Your job is to help budget-conscious shoppers find the best deals across nearby stores. When a user mentions grocery items, you will receive structured price data from a local database. Use this data to give a clear, conversational recommendation about where to shop. Be friendly and concise. Always mention both price AND distance because a cheaper store farther away may not be worth it. Highlight the best overall value, not just cheapest price. If an item is not in the database, say so and suggest they try a nearby store. Keep responses short, 3 to 5 sentences max unless listing multiple items. Use simple language, not technical jargon.`;

export async function POST(req: NextRequest) {
  try {
    const { message, reset } = await req.json();

    if (reset) {
      const { clearMessages } = await import("@/lib/db");
      clearMessages();
      return NextResponse.json({ success: true });
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    saveMessage("user", message);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
      systemInstruction: {
        role: "system",
        parts: [{ text: SYSTEM_PROMPT }],
      },
    });

    const extractModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const extractResult = await extractModel.generateContent(
      `Extract grocery item names from this message as a JSON array of strings. Only include actual grocery or food items. Return ONLY the JSON array, no other text. Message: "${message}" Example output: ["eggs", "milk", "chicken breast"]`
    );

    let items: string[] = [];
    try {
      const extractedText = extractResult.response.text().trim();
      const cleaned = extractedText.replace(/```json\n?|\n?```/g, "").trim();
      items = JSON.parse(cleaned);
    } catch {
      items = [];
    }

    let priceContext = "";
    if (items.length > 0) {
      const priceData = getPricesForItems(items);
      priceContext = `\n\nHere is the current price data from nearby stores:\n${JSON.stringify(priceData, null, 2)}`;
    }

    const history = getRecentMessages(6);

    const chat = model.startChat({
      history: history.slice(0, -1).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    });

    const userMessageWithContext = message + priceContext;
    const result = await chat.sendMessage(userMessageWithContext);
    const reply = result.response.text();

    saveMessage("assistant", reply);

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    console.error("Chat API error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
