import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

import { buildSimilarAlternativesResponse } from "@/lib/similarAlternatives";

let cached: OpenAI | null | undefined;

function getOpenAI(): OpenAI | null {
  if (cached !== undefined) return cached;
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    cached = null;
    return null;
  }
  cached = new OpenAI({ apiKey: key });
  return cached;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const item = String(body?.item ?? "");
    const result = await buildSimilarAlternativesResponse(getOpenAI(), item);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err: unknown) {
    console.error("similar-alternatives API error:", err);
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
