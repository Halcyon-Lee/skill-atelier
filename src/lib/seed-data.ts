import type { DatabaseSync } from "node:sqlite";
import { hashPassword } from "./password.ts";

// Only bootstrap the real administrator and invitation. Catalog entries are imported separately.
export function seedDatabase(db: DatabaseSync, env: NodeJS.ProcessEnv = process.env) {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
  if (count > 0) return;

  const adminEmail = (env.ADMIN_EMAIL || "admin@126.com").trim().toLowerCase();
  const adminName = env.ADMIN_NAME?.trim() || "带熊猫去竹林";
  const adminPassword = env.ADMIN_PASSWORD;
  const inviteCode = env.SEED_INVITE_CODE?.trim() || "Leadnext2026";
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error("ADMIN_PASSWORD is required (min 8 characters). Set it in .env.local before first launch.");
  }
  if (inviteCode.length < 4 || /\s/.test(inviteCode)) {
    throw new Error("SEED_INVITE_CODE must contain at least 4 characters without spaces.");
  }

  const now = new Date().toISOString();
  db.exec("BEGIN IMMEDIATE");
  try {
    const admin = db.prepare(`
      INSERT INTO users (email, name, password_hash, role, bio, avatar_color, created_at)
      VALUES (?, ?, ?, 'admin', '', '#4f6752', ?)
    `).run(adminEmail, adminName, hashPassword(adminPassword), now);
    // max_uses = 0 represents an unlimited invitation; it still counts registrations.
    db.prepare(`
      INSERT INTO invites (code, created_by, note, max_uses, used_count, expires_at, created_at)
      VALUES (?, ?, '社区固定邀请码', 0, 0, NULL, ?)
    `).run(inviteCode, Number(admin.lastInsertRowid), now);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
