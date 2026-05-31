/**
 * File-backed user/session store for auth (no native SQLite required).
 * Grocery catalog data remains in better-sqlite3 via db.ts.
 */
import fs from "fs";
import path from "path";

const AUTH_DATA_PATH = path.join(process.cwd(), "auth-data.json");

export type AuthUser = { id: number; email: string; password_hash: string };

type AuthDataFile = {
  nextUserId: number;
  users: AuthUser[];
  sessions: { id: string; user_id: number; expires_at: string }[];
};

function defaultData(): AuthDataFile {
  return { nextUserId: 1, users: [], sessions: [] };
}

function readAuthData(): AuthDataFile {
  if (!fs.existsSync(AUTH_DATA_PATH)) return defaultData();
  try {
    const raw = fs.readFileSync(AUTH_DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as AuthDataFile;
    return {
      nextUserId: parsed.nextUserId ?? 1,
      users: parsed.users ?? [],
      sessions: parsed.sessions ?? [],
    };
  } catch {
    return defaultData();
  }
}

function writeAuthData(data: AuthDataFile): void {
  fs.writeFileSync(AUTH_DATA_PATH, JSON.stringify(data, null, 2), "utf8");
}

export function createUser(email: string, passwordHash: string): AuthUser {
  const data = readAuthData();
  if (data.users.some((u) => u.email === email)) {
    throw new Error("EMAIL_EXISTS");
  }
  const user: AuthUser = {
    id: data.nextUserId++,
    email,
    password_hash: passwordHash,
  };
  data.users.push(user);
  writeAuthData(data);
  return user;
}

export function findUserByEmail(email: string): AuthUser | undefined {
  const data = readAuthData();
  return data.users.find((u) => u.email === email);
}

export function createSession(token: string, userId: number, expiresAt: string): void {
  const data = readAuthData();
  data.sessions.push({ id: token, user_id: userId, expires_at: expiresAt });
  writeAuthData(data);
}

export function deleteSession(token: string): void {
  const data = readAuthData();
  data.sessions = data.sessions.filter((s) => s.id !== token);
  writeAuthData(data);
}

export function findSessionUser(
  token: string,
): { user_id: number; email: string; expires_at: string } | undefined {
  const data = readAuthData();
  const session = data.sessions.find((s) => s.id === token);
  if (!session) return undefined;
  const user = data.users.find((u) => u.id === session.user_id);
  if (!user) return undefined;
  return {
    user_id: user.id,
    email: user.email,
    expires_at: session.expires_at,
  };
}
