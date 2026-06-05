import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getPricesForItems, saveMessage, getRecentMessages, dataExportedAt } from "@/lib/db";

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "Missing OPENAI_API_KEY. Add it in your Vercel project settings under Environment Variables."
    );
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const MODEL = "gpt-4.1-mini";

const SYSTEM_PROMPT = `You are SmartShop, a friendly grocery price comparison assistant. Your job is to help budget-conscious shoppers find the best deals across nearby stores. When a user mentions grocery items, you will receive structured price data from a local database. Use this data to give a clear, conversational recommendation about where to shop. Be friendly and concise. Always mention both price AND distance because a cheaper store farther away may not be worth it. Highlight the best overall value, not just cheapest price. If an item is not in the database, say so and suggest they try a nearby store. Keep responses short, 3 to 5 sentences max unless listing multiple items. Use simple language, not technical jargon.`;

function parseItemArray(raw: string): string[] {
  const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.map((x) => String(x).trim()).filter(Boolean);
    }
  } catch {
    /* try slice below */
  }
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      if (Array.isArray(parsed)) {
        return parsed.map((x) => String(x).trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }
  return [];
}

async function extractGroceryItems(message: string): Promise<string[]> {
  const openai = getOpenAI();
  const res = await openai.responses.create({
    model: MODEL,
    input: [
      {
        role: "system",
        content:
          "Extract grocery item names from the user's message as a JSON array of strings. Only include actual grocery or food items. Return ONLY the JSON array, no other text.",
      },
      {
        role: "user",
        content: `Message: "${message}"\nExample output: ["eggs", "milk", "chicken breast"]`,
      },
    ],
  });
  const text = String(res.output_text || "[]");
  return parseItemArray(text);
}

export async function POST(req: NextRequest) {
  try {
    const { message, reset, allergens } = await req.json();

    if (reset) {
      const { clearMessages } = await import("@/lib/db");
      clearMessages();
      return NextResponse.json({ success: true });
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // Responsible AI: crisis/sensitive-content gate — runs before DB write or AI call
  const CRISIS_PATTERNS = [
    /hurt(?:ing)?\s+(?:my)?self/i,
    /kill(?:ing)?\s+(?:my)?self/i,
    /suicid/i,
    /self[\s-]?harm/i,
    /want to die/i,
    /end (?:my )?life/i,
    /i(?:'m| am) (?:only )?\d{1,2}(?:\s*years? old|\s*yo)?/i,
    /i(?:'m| am) a minor/i,
  ];
  const CRISIS_RESPONSE =
    "I'm a grocery price assistant and not equipped to help with what you've shared. " +
    "If you're going through something difficult, please reach out to someone who can support you.\n\n" +
    "**988 Suicide & Crisis Lifeline** — call or text **988** (US)\n" +
    "**Crisis Text Line** — text HOME to **741741**\n\n" +
    "If you have grocery questions, I'm here to help with those.";
  if (CRISIS_PATTERNS.some((p) => p.test(message))) {
    // Do NOT save to DB or call OpenAI — return safe response immediately
    return NextResponse.json({ reply: CRISIS_RESPONSE });
  }

  // Off-topic guard — block non-grocery questions
  const OFF_TOPIC_PATTERNS = [
    /homework|assignment|essay|exam|quiz|test\s+(question|help|me)/i,
    /write\s+(my|a|an|the)\s+(essay|report|paper|code|program|function|class)/i,
    /solve\s+(this|my|the)\s+(problem|equation|math)/i,
    /what\s+is\s+the\s+(capital|population|president|history)/i,
    /how\s+do\s+(you|i)\s+(code|program|build|make)\s+(?!a grocery|a shopping|a meal)/i,
    /tell\s+me\s+(a\s+joke|about\s+yourself|a\s+story)/i,
    /who\s+(are\s+you|made\s+you|created\s+you)/i,
    /weather|news|sports|politics|stock|crypto/i,
  ];
  const OFF_TOPIC_RESPONSE = "I'm only able to help with grocery shopping and price comparisons! Try asking me something like \"where can I find the cheapest eggs?\" or \"compare milk prices near me.\"";
  if (OFF_TOPIC_PATTERNS.some((p) => p.test(message))) {
    return NextResponse.json({ reply: OFF_TOPIC_RESPONSE });
  }

  saveMessage("user", message);

    const items = await extractGroceryItems(message);

    let priceContext = "";
    if (items.length > 0) {
      const priceData = getPricesForItems(items);
      const dateLabel = dataExportedAt
        ? new Date(dataExportedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "unknown date";
      priceContext = `\n\nHere is the price data from nearby stores (last updated: ${dateLabel}). Always include this disclaimer when showing prices: "⚠️ Prices last updated ${dateLabel} — verify with the store before your trip."\n\n${JSON.stringify(priceData, null, 2)}`;
    }

    const history = getRecentMessages(6);
    const prior = history.slice(0, -1);

    const allergenList = Array.isArray(allergens) && allergens.length > 0 ? allergens : [];
    const allergenNote = allergenList.length > 0
      ? `\n\nIMPORTANT — ALLERGEN AWARENESS: This user is allergic to: ${allergenList.join(", ")}. You must think carefully about what each grocery item is made from and warn if there is any connection. Use broad ingredient knowledge — for example:
- gluten is found in wheat, so pasta, bread, flour, crackers, cereal, soy sauce, and beer all contain gluten
- dairy includes milk, butter, cheese, yogurt, cream, whey, and casein
- peanuts may be present in peanut butter, mixed nuts, some sauces, and candy
- eggs are in mayonnaise, pasta (some types), baked goods, and dressings
- soy is in tofu, edamame, soy sauce, miso, and many processed foods
- tree nuts include almonds, cashews, walnuts, pecans, etc.
If an item the user asks about commonly contains or is derived from one of their allergens, warn them with "⚠️ Allergen warning — [item] commonly contains [allergen]." before giving prices. Do not skip this warning even if the item seems obvious.`
      : "";

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT + allergenNote },
      ...prior.map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
        content: m.content,
      })),
      { role: "user", content: message + priceContext },
    ];

    const completion = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "I couldn’t generate a reply. Try again.";
    saveMessage("assistant", reply);

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    console.error("Chat API error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
