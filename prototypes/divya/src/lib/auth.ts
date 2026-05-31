import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "smartshop_session";
const SESSION_DAYS = 14;

export type PublicUser = { id: number; email: string };

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function sessionExpiresAt(): string {
  const ms = SESSION_DAYS * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms).toISOString();
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
  secure: process.env.NODE_ENV === "production",
};

export function attachSessionCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(SESSION_COOKIE, token, cookieOptions);
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateCredentials(email: string, password: string): string | null {
  if (!email.includes("@") || email.length < 5) return "Valid email is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
}
