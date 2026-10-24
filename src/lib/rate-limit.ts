import { headers } from "next/headers";
import { getDb } from "@/lib/db";

export type RateLimitResult = { ok: true } | { ok: false; retryAfter: number };

export async function requestIp(): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headerStore.get("x-real-ip") ?? "local";
}

export function consumeRateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const db = getDb();
  const now = Date.now();
  const resetAt = now + windowSeconds * 1000;
  const existing = db
    .prepare("SELECT count, reset_at FROM rate_limits WHERE key = ?")
    .get(key) as { count: number; reset_at: number } | undefined;

  if (!existing || existing.reset_at <= now) {
    db.prepare(
      "INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at",
    ).run(key, resetAt);
    return { ok: true };
  }

  if (existing.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((existing.reset_at - now) / 1000)) };
  }

  db.prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ?").run(key);
  return { ok: true };
}

export function clearRateLimit(key: string): void {
  getDb().prepare("DELETE FROM rate_limits WHERE key = ?").run(key);
}

export function rateLimitMessage(retryAfter: number): string {
  if (retryAfter >= 60) {
    return `尝试过于频繁，请在 ${Math.ceil(retryAfter / 60)} 分钟后重试。`;
  }
  return `尝试过于频繁，请在 ${retryAfter} 秒后重试。`;
}
