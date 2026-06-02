import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail, validateCredentials } from "@/lib/auth";
import { resolveUserForLogin, startSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = normalizeEmail(String(body?.email ?? ""));
    const password = String(body?.password ?? "");

    const validationError = validateCredentials(email, password);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const user = resolveUserForLogin(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const res = NextResponse.json({
      user: { id: user.id, email: user.email },
    });
    return startSession(user.id, user.email, user.password_hash, res);
  } catch (err: unknown) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
