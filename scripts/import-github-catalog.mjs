import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { CATEGORIES } from '../src/lib/categories.ts';
import { validateShowcase } from '../src/lib/showcase-rules.ts';
import { migrateShowcase } from '../src/lib/showcase-migration.ts';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const catalogPath = path.join(projectRoot, 'catalog/github-high-star-skills-2026-10-24.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const categoryNames = new Set(CATEGORIES.map((category) => category.slug));
const dryRun = process.argv.includes('--dry-run');
const counts = Object.fromEntries([...categoryNames].map((category) => [category, 0]));
const seen = new Set();

assert.equal(catalog.skills.length, 35, 'Catalog must contain 35 skills');
for (const skill of catalog.skills) {
  assert.ok(categoryNames.has(skill.category), `Unknown category: ${skill.category}`);
  counts[skill.category] += 1;
  assert.ok(!seen.has(skill.sourceUrl), `Duplicate source: ${skill.sourceUrl}`);
  seen.add(skill.sourceUrl);
  assert.ok(skill.name.length >= 2 && skill.name.length <= 60);
  assert.ok(skill.tagline.length >= 12 && skill.tagline.length <= 120);
  assert.ok(skill.description.length >= 40 && skill.description.length <= 20000);
  assert.ok(skill.tags.length >= 1 && skill.tags.length <= 6);
  assert.ok(skill.license.length <= 32 && skill.version.length <= 24);
  assert.ok(skill.source.repositoryStars >= 30000);
  assert.match(skill.source.commit, /^[a-f0-9]{40}$/);
  assert.ok(skill.sourceUrl.includes(skill.source.commit));
  assert.ok(skill.exampleOutput.includes('说明性示例'));
  assert.deepEqual(validateShowcase(skill, false), {});
}
assert.ok(Object.values(counts).every((count) => count === 5), 'Each category must contain 5 skills');

const envPath = path.join(projectRoot, '.env.local');
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);
const databasePath = process.env.DATABASE_PATH || path.join(projectRoot, 'data', 'atelier.db');
assert.ok(fs.existsSync(databasePath), '请先启动项目并访问一次首页，初始化数据库后再导入。');
const database = new DatabaseSync(databasePath, { readOnly: dryRun });
database.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
try {
  if (!dryRun) migrateShowcase(database);
  const admin = database.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE AND role = 'admin'")
    .get(process.env.ADMIN_EMAIL || 'admin@126.com');
  assert.ok(admin, '配置中的管理员账号不存在，未导入任何内容。');
  const exists = database.prepare('SELECT id FROM skills WHERE source_url = ? OR slug = ?');
  const pending = catalog.skills.filter((skill) => !exists.get(skill.sourceUrl, skill.slug));
  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, toImport: pending.length, skipped: 35 - pending.length, counts }, null, 2));
  } else {
    database.exec('BEGIN IMMEDIATE');
    try {
      const insert = database.prepare(`INSERT INTO skills (
        slug, name, tagline, description, category, tags, version, license,
        source_url, install_command, author_id, featured, view_count, created_at, updated_at,
        use_cases, example_input, example_output
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`);
      const now = new Date().toISOString();
      let imported = 0;
      // Skip existing sources/identifiers so repeated imports preserve later human edits.
      for (const skill of catalog.skills) {
        if (exists.get(skill.sourceUrl, skill.slug)) continue;
        insert.run(skill.slug, skill.name, skill.tagline, skill.description, skill.category,
          JSON.stringify(skill.tags), skill.version, skill.license, skill.sourceUrl,
          skill.installCommand, admin.id, skill.featured ? 1 : 0, now, now,
          skill.useCases, skill.exampleInput, skill.exampleOutput);
        imported += 1;
      }
      database.exec('COMMIT');
      console.log(JSON.stringify({ imported, skipped: 35 - imported, counts, totalSkills: database.prepare('SELECT count(*) AS count FROM skills').get().count }, null, 2));
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  }
} finally {
  database.close();
}
