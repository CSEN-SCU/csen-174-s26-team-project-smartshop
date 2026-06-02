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
  // Logout clears active session only — profile cookie keeps the prototype account for re-login.
  return clearSessionCookie(res);
}

function profileFromCookies(): ReturnType<typeof verifyProfileToken> {
  const profileToken = cookies().get(PROFILE_COOKIE)?.value;
  if (!profileToken) return null;
  return verifyProfileToken(profileToken);
}

/** True if email exists in auth-data.json (local) or this browser's signed profile cookie. */
export function emailHasSavedAccount(email: string): boolean {
  if (findUserByEmail(email)) return true;
  const profile = profileFromCookies();
  return profile?.email === email;
}

/**
 * Login: local file store first, then signed profile cookie (required on Vercel).
 */
export function resolveUserForLogin(email: string, password: string): AuthUser | null {
  const fromFile = findUserByEmail(email);
  if (fromFile && verifyPassword(password, fromFile.password_hash)) return fromFile;

  const profile = profileFromCookies();
  if (!profile || profile.email !== email) return null;
  if (!verifyPassword(password, profile.passwordHash)) return null;
  return {
    id: profile.userId,
    email: profile.email,
    password_hash: profile.passwordHash,
  };
}
