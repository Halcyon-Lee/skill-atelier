import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";

export const SESSION_COOKIE = "atelier_session";
const SESSION_DAYS = 30;

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: "member" | "admin";
  bio: string;
  avatarColor: string;
  createdAt: string;
};

type UserRow = {
  id: number;
  email: string;
  name: string;
  role: "member" | "admin";
  bio: string;
  avatar_color: string;
  created_at: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function mapUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    bio: row.bio,
    avatarColor: row.avatar_color,
    createdAt: row.created_at,
  };
}

export function findUserByEmail(email: string): (SessionUser & { passwordHash: string }) | null {
  const row = getDb()
    .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
    .get(email.trim().toLowerCase()) as (UserRow & { password_hash: string }) | undefined;

  if (!row) return null;
  return { ...mapUser(row), passwordHash: row.password_hash };
}

export function findUserById(id: number): SessionUser | null {
  const row = getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export async function createSession(userId: number): Promise<void> {
  const db = getDb();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
  const token = randomBytes(32).toString("base64url");

  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now.toISOString());
  db.prepare(
    "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
  ).run(hashToken(token), userId, now.toISOString(), expires.toISOString());

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    path: "/",
    expires,
    priority: "high",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
  }
  cookieStore.delete(SESSION_COOKIE);
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = getDb()
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(hashToken(token), new Date().toISOString()) as UserRow | undefined;

  return row ? mapUser(row) : null;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/library");
  return user;
}
