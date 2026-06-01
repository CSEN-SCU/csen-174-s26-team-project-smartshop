import { cookies } from "next/headers";
import {
  attachSessionCookie,
  clearSessionCookie,
  newSessionToken,
  PublicUser,
  SESSION_COOKIE,
  sessionExpiresAt,
} from "./auth";
import { createSession, deleteSession, findSessionUser } from "./authStore";
import { NextResponse } from "next/server";

export function resolveUserFromToken(token: string | undefined): PublicUser | null {
  if (!token) return null;
  const row = findSessionUser(token);
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    deleteSession(token);
    return null;
  }
  return { id: row.user_id, email: row.email };
}

export function getSessionUserFromCookies(): PublicUser | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return resolveUserFromToken(token);
}

export function startSession(userId: number, res: NextResponse): NextResponse {
  const token = newSessionToken();
  createSession(token, userId, sessionExpiresAt());
  return attachSessionCookie(res, token);
}

export function endSession(res: NextResponse): NextResponse {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) deleteSession(token);
  return clearSessionCookie(res);
}
