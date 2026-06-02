import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "smartshop_session";
export const PROFILE_COOKIE = "smartshop_auth_profile";
const SESSION_DAYS = 14;

function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    console.warn("AUTH_SECRET is not set; using insecure fallback for demo only");
  }
  return "smartshop-dev-auth-secret";
}

function signPayload(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", authSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifyPayload<T extends { exp: number }>(token: string): T | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", authSecret()).update(body).digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as T;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export type SessionPayload = { userId: number; email: string; exp: number };
export type ProfilePayload = {
  userId: number;
  email: string;
  passwordHash: string;
  exp: number;
};

export function signSessionToken(userId: number, email: string): string {
  return signPayload({
    userId,
    email,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function verifySessionToken(token: string): SessionPayload | null {
  return verifyPayload<SessionPayload>(token);
}

export function signProfileToken(userId: number, email: string, passwordHash: string): string {
  return signPayload({
    userId,
    email,
    passwordHash,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function verifyProfileToken(token: string): ProfilePayload | null {
  return verifyPayload<ProfilePayload>(token);
}

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

export function attachProfileCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(PROFILE_COOKIE, token, cookieOptions);
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return res;
}

export function clearProfileCookie(res: NextResponse): NextResponse {
  res.cookies.set(PROFILE_COOKIE, "", { ...cookieOptions, maxAge: 0 });
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
