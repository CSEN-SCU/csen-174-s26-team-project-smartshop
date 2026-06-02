import { cookies } from "next/headers";
import {
  attachProfileCookie,
  attachSessionCookie,
  clearSessionCookie,
  PublicUser,
  SESSION_COOKIE,
  signProfileToken,
  signSessionToken,
  verifyProfileToken,
  verifySessionToken,
  verifyPassword,
  PROFILE_COOKIE,
} from "./auth";
import { findUserByEmail, AuthUser } from "./authStore";
import { NextResponse } from "next/server";

/** Stateless session: cookie is HMAC-signed; no server-side session row required. */
export function resolveUserFromToken(token: string | undefined): PublicUser | null {
  if (!token) return null;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  return { id: payload.userId, email: payload.email };
}

export function getSessionUserFromCookies(): PublicUser | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return resolveUserFromToken(token);
}

export function startSession(
  userId: number,
  email: string,
  passwordHash: string,
  res: NextResponse,
): NextResponse {
  attachSessionCookie(res, signSessionToken(userId, email));
  return attachProfileCookie(res, signProfileToken(userId, email, passwordHash));
}

export function endSession(res: NextResponse): NextResponse {
  return clearSessionCookie(res);
}

/**
 * Login fallback when SQLite user row is missing (common on Vercel serverless).
 * Uses the signed profile cookie set at signup/login on this browser.
 */
export function resolveUserForLogin(email: string, password: string): AuthUser | null {
  const fromDb = findUserByEmail(email);
  if (fromDb && verifyPassword(password, fromDb.password_hash)) return fromDb;

  const profileToken = cookies().get(PROFILE_COOKIE)?.value;
  if (!profileToken) return null;
  const profile = verifyProfileToken(profileToken);
  if (!profile || profile.email !== email) return null;
  if (!verifyPassword(password, profile.passwordHash)) return null;
  return {
    id: profile.userId,
    email: profile.email,
    password_hash: profile.passwordHash,
  };
}
