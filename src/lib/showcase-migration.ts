import type { DatabaseSync } from "node:sqlite";

export function migrateShowcase(database: DatabaseSync) {
  database.exec("BEGIN IMMEDIATE");
  try {
    const columns = new Set(
      (database.prepare("PRAGMA table_info(skills)").all() as { name: string }[])
        .map((column) => column.name),
    );
    for (const name of ["use_cases", "example_input", "example_output"]) {
      if (!columns.has(name)) {
        database.exec(`ALTER TABLE skills ADD COLUMN ${name} TEXT NOT NULL DEFAULT ''`);
      }
    }
    database.exec(`
      CREATE TABLE IF NOT EXISTS skill_screenshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        filename TEXT NOT NULL UNIQUE,
        content_type TEXT NOT NULL,
        position INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_screenshots_skill ON skill_screenshots(skill_id);
    `);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
