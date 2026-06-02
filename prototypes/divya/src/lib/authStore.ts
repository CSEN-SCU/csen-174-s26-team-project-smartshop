/**
 * In-memory user/session store.
 * Resets on cold start — fine for a prototype demo.
 * (File-based storage doesn't work on Vercel because serverless instances
 *  don't share a filesystem, so sign-up on one instance isn't visible to login on another.)
 */

export type AuthUser = { id: number; email: string; password_hash: string };

let nextUserId = 1;
const users: AuthUser[] = [];
const sessions: { id: string; user_id: number; expires_at: string }[] = [];

export function createUser(email: string, passwordHash: string): AuthUser {
  if (users.some((u) => u.email === email)) {
    throw new Error("EMAIL_EXISTS");
  }
  const user: AuthUser = { id: nextUserId++, email, password_hash: passwordHash };
  users.push(user);
  return user;
}

export function findUserByEmail(email: string): AuthUser | undefined {
  return users.find((u) => u.email === email);
}

export function createSession(token: string, userId: number, expiresAt: string): void {
  sessions.push({ id: token, user_id: userId, expires_at: expiresAt });
}

export function deleteSession(token: string): void {
  const idx = sessions.findIndex((s) => s.id === token);
  if (idx !== -1) sessions.splice(idx, 1);
}

export function findSessionUser(
  token: string,
): { user_id: number; email: string; expires_at: string } | undefined {
  const session = sessions.find((s) => s.id === token);
  if (!session) return undefined;
  const user = users.find((u) => u.id === session.user_id);
  if (!user) return undefined;
  return { user_id: user.id, email: user.email, expires_at: session.expires_at };
}
