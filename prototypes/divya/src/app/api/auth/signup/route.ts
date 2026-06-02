import { NextRequest, NextResponse } from "next/server";
import {
  hashPassword,
  normalizeEmail,
  validateCredentials,
} from "@/lib/auth";
import { createUser, findUserByEmail } from "@/lib/authStore";
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

    if (findUserByEmail(email)) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    let user;
    try {
      user = createUser(email, hashPassword(password));
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "EMAIL_EXISTS") {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }
      throw err;
    }
    const res = NextResponse.json({
      user: { id: user.id, email: user.email },
    });
    return startSession(user.id, user.email, user.password_hash, res);
  } catch (error: unknown) {
    console.error("Signup failed:", error);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
