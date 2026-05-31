import { NextRequest, NextResponse } from "next/server";
import {
  normalizeEmail,
  validateCredentials,
  verifyPassword,
} from "@/lib/auth";
import { findUserByEmail } from "@/lib/authStore";
import { startSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = normalizeEmail(String(body?.email ?? ""));
    const password = String(body?.password ?? "");

    const validationError = validateCredentials(email, password);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const user = findUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const res = NextResponse.json({
      user: { id: user.id, email: user.email },
    });
    return startSession(user.id, res);
  } catch (err: unknown) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
