import type { DatabaseSync } from "node:sqlite";
import { DEFAULT_VIDEO_OPTIONS } from "./options.ts";
export function migrateVideo(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS video_jobs (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      style_slug TEXT NOT NULL, style_version TEXT NOT NULL, renderer TEXT NOT NULL,
      script TEXT NOT NULL, title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','planning','rendering','compositing','succeeded','failed')),
      idempotency_key TEXT NOT NULL, retry_of TEXT REFERENCES video_jobs(id),
      worker_token TEXT, heartbeat_at INTEGER, output_bytes INTEGER, error TEXT,
      created_at TEXT NOT NULL, started_at TEXT, finished_at TEXT,
      UNIQUE(user_id, idempotency_key)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_video_one_active_per_user ON video_jobs(user_id)
      WHERE status IN ('queued','planning','rendering','compositing');
    CREATE INDEX IF NOT EXISTS idx_video_jobs_queue ON video_jobs(status,created_at);
    CREATE INDEX IF NOT EXISTS idx_video_jobs_user ON video_jobs(user_id,created_at);
    CREATE TABLE IF NOT EXISTS video_worker (
      id INTEGER PRIMARY KEY CHECK(id=1), token TEXT NOT NULL, heartbeat_at INTEGER NOT NULL,
      ready INTEGER NOT NULL DEFAULT 0, message TEXT NOT NULL DEFAULT '', renderers TEXT NOT NULL DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS video_favorites (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      style_slug TEXT NOT NULL, created_at TEXT NOT NULL,
      PRIMARY KEY(user_id,style_slug)
    );
  `);
  db.exec("BEGIN IMMEDIATE");
  try {
    const columns = db.prepare("PRAGMA table_info(video_jobs)").all() as { name: string }[];
    if (!columns.some(column => column.name === "options_json")) {
      db.exec(`ALTER TABLE video_jobs ADD COLUMN options_json TEXT NOT NULL DEFAULT '${JSON.stringify(DEFAULT_VIDEO_OPTIONS)}'`);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
