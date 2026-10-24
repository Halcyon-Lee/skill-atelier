import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { seedDatabase } from '../src/lib/seed-data.ts';
import { verifyPassword } from '../src/lib/password.ts';

function database() {
  const db = new DatabaseSync(':memory:');
  const source = readFileSync(new URL('../src/lib/db.ts', import.meta.url), 'utf8');
  db.exec(source.match(/const SCHEMA = `([\s\S]*?)`;/)[1]);
  return db;
}
const env = { ADMIN_EMAIL: 'bootstrap@example.com', ADMIN_PASSWORD: 'test-only-password' };

test('new databases contain only the administrator and reusable fixed invitation', () => {
  const db = database();
  try {
    seedDatabase(db, env);
    const users = db.prepare('SELECT * FROM users').all();
    assert.equal(users.length, 1);
    assert.equal(users[0].name, '带熊猫去竹林');
    assert.equal(users[0].email, env.ADMIN_EMAIL);
    assert.equal(users[0].role, 'admin');
    assert.ok(verifyPassword(env.ADMIN_PASSWORD, users[0].password_hash));
    assert.equal(db.prepare('SELECT count(*) n FROM skills').get().n, 0);
    assert.equal(db.prepare('SELECT count(*) n FROM bookmarks').get().n, 0);
    const invite = db.prepare('SELECT * FROM invites').get();
    assert.equal(invite.code, 'Leadnext2026');
    assert.equal(invite.max_uses, 0);
    assert.equal(invite.expires_at, null);
    assert.equal(invite.created_by, users[0].id);
    db.prepare('UPDATE users SET name=? WHERE id=?').run('管理员修改的昵称', users[0].id);
    seedDatabase(db, { ...env, ADMIN_PASSWORD: 'different-password' });
    const after = db.prepare('SELECT * FROM users').get();
    assert.equal(after.name, '管理员修改的昵称');
    assert.equal(after.password_hash, users[0].password_hash);
    assert.equal(db.prepare('SELECT count(*) n FROM invites').get().n, 1);
  } finally { db.close(); }
});

test('invalid configuration leaves no partially initialized administrator', () => {
  const db = database();
  try {
    assert.throws(() => seedDatabase(db, { ...env, ADMIN_PASSWORD: '' }), /ADMIN_PASSWORD/);
    assert.throws(() => seedDatabase(db, { ...env, SEED_INVITE_CODE: 'invalid code' }), /SEED_INVITE_CODE/);
    assert.equal(db.prepare('SELECT count(*) n FROM users').get().n, 0);
  } finally { db.close(); }
});

test('invitation write failure rolls back administrator creation', () => {
  const db = database();
  try {
    db.exec("CREATE TRIGGER fail_invite BEFORE INSERT ON invites BEGIN SELECT RAISE(ABORT, 'invitation failure'); END;");
    assert.throws(() => seedDatabase(db, env), /invitation failure/);
    assert.equal(db.prepare('SELECT count(*) n FROM users').get().n, 0);
  } finally { db.close(); }
});
