import "server-only";

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { seedDatabase } from "@/lib/seed-data";
import { migrateShowcase } from "@/lib/showcase-migration";
import { migrateVideo } from "@/lib/video/migration";

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

function createDatabase(): DatabaseSync {
  const databasePath =
    process.env.DATABASE_PATH || path.join(process.cwd(), "data", "atelier.db");
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec(SCHEMA);
  migrateShowcase(database);
  migrateVideo(database);
  seedDatabase(database);
  return database;
}

const globalForDatabase = globalThis as typeof globalThis & {
  __atelierDatabase?: DatabaseSync;
  __atelierShowcaseVersion?: number;
  __atelierVideoVersion?: number;
};

export function getDb(): DatabaseSync {
  if (!globalForDatabase.__atelierDatabase) {
    globalForDatabase.__atelierDatabase = createDatabase();
    globalForDatabase.__atelierShowcaseVersion = 1;
  }
  if (globalForDatabase.__atelierShowcaseVersion !== 1) {
    migrateShowcase(globalForDatabase.__atelierDatabase);
    globalForDatabase.__atelierShowcaseVersion = 1;
  }
  if (globalForDatabase.__atelierVideoVersion !== 2) {
    migrateVideo(globalForDatabase.__atelierDatabase);
    globalForDatabase.__atelierVideoVersion = 2;
  }
  return globalForDatabase.__atelierDatabase;
}
