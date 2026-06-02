/**
 * Local dev: users in auth-data.json (writable project dir).
 * Vercel/serverless: no file writes — accounts live in signed HttpOnly cookies (session.ts).
 */
import { createHmac } from "crypto";
import fs from "fs";
import path from "path";

const AUTH_DATA_PATH = path.join(process.cwd(), "auth-data.json");

export type AuthUser = { id: number; email: string; password_hash: string };

type AuthDataFile = {
  nextUserId: number;
  users: AuthUser[];
};

export function usesFileAuthStore(): boolean {
  return !process.env.VERCEL;
}

/** Stable id for the same email on serverless (cookie-backed accounts). */
export function stableUserId(email: string): number {
  const digest = createHmac("sha256", "smartshop-prototype-user-id").update(email).digest();
  const id = digest.readUInt32BE(0);
  return id === 0 ? 1 : id;
}

function defaultData(): AuthDataFile {
  return { nextUserId: 1, users: [] };
}

function readAuthData(): AuthDataFile {
  if (!fs.existsSync(AUTH_DATA_PATH)) return defaultData();
  try {
    const raw = fs.readFileSync(AUTH_DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as AuthDataFile;
    return {
      nextUserId: parsed.nextUserId ?? 1,
      users: parsed.users ?? [],
    };
  } catch {
    return defaultData();
  }
}

function writeAuthData(data: AuthDataFile): void {
  fs.writeFileSync(AUTH_DATA_PATH, JSON.stringify(data, null, 2), "utf8");
}

export function createUser(email: string, passwordHash: string): AuthUser {
  if (!usesFileAuthStore()) {
    return { id: stableUserId(email), email, password_hash: passwordHash };
  }

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
  if (!usesFileAuthStore()) return undefined;
  const data = readAuthData();
  return data.users.find((u) => u.email === email);
}
