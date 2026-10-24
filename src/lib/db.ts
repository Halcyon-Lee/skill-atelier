import "server-only";

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { hashPassword } from "@/lib/password";
import { SEED_BOOKMARKS, SEED_SKILLS, SEED_USERS } from "@/lib/seed-data";

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    bio TEXT NOT NULL DEFAULT '',
    avatar_color TEXT NOT NULL DEFAULT '#d94f2b',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    note TEXT NOT NULL DEFAULT '',
    max_uses INTEGER NOT NULL DEFAULT 1,
    used_count INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT,
    revoked_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    version TEXT NOT NULL DEFAULT '1.0.0',
    license TEXT NOT NULL DEFAULT 'MIT',
    source_url TEXT,
    install_command TEXT,
    author_id INTEGER NOT NULL REFERENCES users(id),
    featured INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, skill_id)
  );

  CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
  CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
  CREATE INDEX IF NOT EXISTS idx_skills_author ON skills(author_id);
  CREATE INDEX IF NOT EXISTS idx_bookmarks_skill ON bookmarks(skill_id);
  CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
`;

function seed(db: DatabaseSync) {
  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
  if (userCount.count > 0) return;

  const now = new Date();
  const adminEmail = (process.env.ADMIN_EMAIL || "curator@atelier.local").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const inviteCode = process.env.SEED_INVITE_CODE?.trim().toUpperCase();
  const inviteExpires = new Date(now.getTime() + 180 * 86_400_000).toISOString();

  if (!adminPassword || adminPassword.length < 8) {
    throw new Error(
      "ADMIN_PASSWORD is required (min 8 characters). Copy .env.example to .env.local and set it before first launch.",
    );
  }
  if (!inviteCode || inviteCode.length < 4) {
    throw new Error(
      "SEED_INVITE_CODE is required (min 4 characters). Copy .env.example to .env.local and set it before first launch.",
    );
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    const insertUser = db.prepare(`
      INSERT INTO users (email, name, password_hash, role, bio, avatar_color, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const userIds = new Map<string, number>();
    for (const user of SEED_USERS) {
      const isAdmin = user.email === "curator@atelier.local";
      const email = isAdmin ? adminEmail : user.email;
      const passwordHash = isAdmin ? hashPassword(adminPassword) : "disabled";
      const result = insertUser.run(
        email,
        user.name,
        passwordHash,
        isAdmin ? "admin" : user.role,
        user.bio,
        user.avatarColor,
        user.createdAt,
      );
      userIds.set(user.email, Number(result.lastInsertRowid));
    }

    const adminId = userIds.get("curator@atelier.local");
    if (!adminId) throw new Error("Admin seed user was not created");

    db.prepare(`
      INSERT INTO invites (code, created_by, note, max_uses, used_count, expires_at, created_at)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `).run(inviteCode, adminId, "开馆初始邀请码", 25, inviteExpires, now.toISOString());

    const insertSkill = db.prepare(`
      INSERT INTO skills (
        slug, name, tagline, description, category, tags, version, license,
        source_url, install_command, author_id, featured, view_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const skillIds = new Map<string, number>();
    for (const skill of SEED_SKILLS) {
      const authorId = userIds.get(skill.authorEmail);
      if (!authorId) continue;
      const result = insertSkill.run(
        skill.slug,
        skill.name,
        skill.tagline,
        skill.description,
        skill.category,
        JSON.stringify(skill.tags),
        skill.version,
        skill.license,
        skill.sourceUrl,
        skill.installCommand,
        authorId,
        skill.featured ? 1 : 0,
        skill.viewCount,
        skill.createdAt,
        skill.createdAt,
      );
      skillIds.set(skill.slug, Number(result.lastInsertRowid));
    }

    const insertBookmark = db.prepare(
      "INSERT OR IGNORE INTO bookmarks (user_id, skill_id, created_at) VALUES (?, ?, ?)",
    );
    for (const bookmark of SEED_BOOKMARKS) {
      const userId = userIds.get(bookmark.userEmail);
      const skillId = skillIds.get(bookmark.skillSlug);
      if (userId && skillId) {
        insertBookmark.run(userId, skillId, now.toISOString());
      }
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function createDatabase(): DatabaseSync {
  const databasePath =
    process.env.DATABASE_PATH || path.join(process.cwd(), "data", "atelier.db");
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec(SCHEMA);
  seed(database);
  return database;
}

const globalForDatabase = globalThis as typeof globalThis & {
  __atelierDatabase?: DatabaseSync;
};

export function getDb(): DatabaseSync {
  if (!globalForDatabase.__atelierDatabase) {
    globalForDatabase.__atelierDatabase = createDatabase();
  }
  return globalForDatabase.__atelierDatabase;
}
