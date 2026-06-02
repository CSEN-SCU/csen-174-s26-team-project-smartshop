import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getPricesForItems, saveMessage, getRecentMessages } from "@/lib/db";
import {
  buildDietaryInstruction,
  buildDietaryWarning,
  findDietaryConflicts,
} from "@/lib/dietary";

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "Missing OPENAI_API_KEY. Create a .env.local file in this directory and add: OPENAI_API_KEY=your_key_here\n" +
      "Get your key at: https://platform.openai.com/api-keys"
  );
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = "gpt-4.1-mini";

const SYSTEM_PROMPT = `You are SmartShop, a grocery price comparison assistant. When a user mentions grocery items, you receive REAL product price data scraped from nearby stores. Each entry has a specific product name, brand, size (unit), price, store, and distance.

OUTPUT FORMAT — do NOT write conversational sentences, greetings, paragraphs, intros, or sign-offs. Output ONLY a markdown bullet list. For each product, output one line in exactly this format:

- **<Brand> <Product name>, <size>** — $<price> at <Store> (<distance> mi)

Rules:
- Use ONLY the products in the provided price data. Do NOT invent products, brands, sizes, or prices, and do NOT estimate. Every brand, product name, size, and price you output must come verbatim from the data.
- For each grocery item the user asked about, show the best 1 to 3 options by overall value (balance price AND distance).
- If the brand is empty, just use the product name and size.
- If an item the user asked about has NO entries in the provided data, output exactly: "- <item> — not available at nearby stores yet".
- No intros, summaries, ingredient notes, or follow-up questions. Just the bullet list.`;

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
    const { message, reset, restrictions, dietaryNotes } = await req.json();

    if (reset) {
      const { clearMessages } = await import("@/lib/db");
      clearMessages();
      return NextResponse.json({ success: true });
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    const restrictionIds: string[] = Array.isArray(restrictions)
      ? restrictions.map((r) => String(r))
      : [];
    const dietaryFreeText =
      typeof dietaryNotes === "string" ? dietaryNotes : "";

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

  saveMessage("user", message);

    const items = await extractGroceryItems(message);

    let priceContext = "";
    if (items.length > 0) {
      const priceData = getPricesForItems(items);

      // Pre-filter: drop any scraped product that conflicts with the shopper's
      // restrictions so the model never even sees a non-compliant option.
      if (restrictionIds.length > 0) {
        for (const key of Object.keys(priceData)) {
          priceData[key] = priceData[key].filter((row) => {
            const label = `${row.brand} ${row.product} ${row.unit}`.trim();
            return findDietaryConflicts([label], restrictionIds).length === 0;
          });
          if (priceData[key].length === 0) delete priceData[key];
        }
      }

      priceContext = `\n\nHere is the current product price data scraped from nearby stores (use ONLY these products):\n${JSON.stringify(priceData, null, 2)}`;
    }

    const history = getRecentMessages(6);
    const prior = history.slice(0, -1);

    const dietaryInstruction = buildDietaryInstruction(restrictionIds, dietaryFreeText);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT + dietaryInstruction },
      ...prior.map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
        content: m.content,
      })),
      { role: "user", content: message + priceContext },
    ];

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages,
    });

    let reply = completion.choices[0]?.message?.content?.trim() || "I couldn’t generate a reply. Try again.";

    // Deterministic safety net: scan the products the AI suggested (one per line)
    // and only append a caution if a SUGGESTED product appears to violate a
    // restriction. Compliant items (e.g. "gluten-free bread", "almond milk") are
    // not flagged, so this fires only when the model itself slips up.
    if (restrictionIds.length > 0) {
      const suggestedLines = reply.split("\n").filter((l) => l.trim());
      const conflicts = findDietaryConflicts(suggestedLines, restrictionIds);
      const warning = buildDietaryWarning(conflicts);
      if (warning) {
        reply = reply + warning;
      }
    }

    saveMessage("assistant", reply);

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    console.error("Chat API error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
