import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import sharp from "sharp";
import { migrateShowcase } from "../src/lib/showcase-migration.ts";
import { validateShowcase, MAX_SCREENSHOT_BYTES } from "../src/lib/showcase-rules.ts";
import { prepareScreenshots, ScreenshotError, writeScreenshotFiles, saveScreenshotRecords, listScreenshots, removeScreenshotFiles, screenshotDirectory } from "../src/lib/screenshots.ts";

const complete = { useCases: "上线前检查登录和权限边界", exampleInput: "请检查这份登录接口的修改和会话过期逻辑。", exampleOutput: "输出问题所在位置、严重程度和可操作的修复建议。" };
const empty = { useCases: "", exampleInput: "", exampleOutput: "" };

function database() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON; CREATE TABLE skills (id INTEGER PRIMARY KEY, name TEXT NOT NULL); INSERT INTO skills VALUES (1, '已有内容');");
  return db;
}
async function imageForm() {
  const bytes = await sharp({ create: { width: 64, height: 32, channels: 3, background: "#eee8dd" } }).png().toBuffer();
  const form = new FormData();
  form.append("screenshots", new File([bytes], "screen.png", { type: "image/png" }));
  return form;
}

test("migration preserves existing rows and can run twice", () => {
  const db = database();
  try {
    migrateShowcase(db);
    migrateShowcase(db);
    assert.deepEqual({ ...db.prepare("SELECT * FROM skills WHERE id = 1").get() }, { id: 1, name: "已有内容", use_cases: "", example_input: "", example_output: "" });
    assert.equal(db.prepare("SELECT count(*) AS count FROM skill_screenshots").get().count, 0);
  } finally { db.close(); }
});

test("new posts require all three fields; legacy posts permit only an entirely empty showcase", () => {
  assert.deepEqual(validateShowcase(complete, false), {});
  assert.equal(Object.keys(validateShowcase(empty, false)).length, 3);
  assert.deepEqual(validateShowcase(empty, true), {});
  assert.deepEqual(Object.keys(validateShowcase({ ...empty, useCases: complete.useCases }, true)), ["exampleInput", "exampleOutput"]);
  assert.deepEqual(Object.keys(validateShowcase({ ...complete, useCases: "x".repeat(2001), exampleOutput: "x".repeat(10001) }, false)), ["useCases", "exampleOutput"]);
});

test("rejects forged image bytes and mismatched MIME types", async () => {
  const broken = new FormData();
  broken.append("screenshots", new File(["not an image"], "fake.png", { type: "image/png" }));
  await assert.rejects(prepareScreenshots(broken, []), ScreenshotError);
  const valid = await imageForm();
  const mismatched = new FormData();
  mismatched.append("screenshots", new File([await valid.get("screenshots").arrayBuffer()], "wrong.jpg", { type: "image/jpeg" }));
  await assert.rejects(prepareScreenshots(mismatched, []), ScreenshotError);
});

test("rejects oversize, empty images, too many images and foreign screenshot ids", async () => {
  for (const bytes of [new Uint8Array(MAX_SCREENSHOT_BYTES + 1), new Uint8Array()]) {
    const form = new FormData();
    form.append("screenshots", new File([bytes], "image.png", { type: "image/png" }));
    await assert.rejects(prepareScreenshots(form, []), ScreenshotError);
  }
  const form = await imageForm();
  const file = form.get("screenshots");
  for (let i = 0; i < 3; i++) form.append("screenshots", file);
  await assert.rejects(prepareScreenshots(form, []), /最多添加 3 张/);
  const forged = new FormData();
  forged.append("screenshotIds", "999");
  await assert.rejects(prepareScreenshots(forged, []), ScreenshotError);
  const duplicate = new FormData();
  duplicate.append("screenshotIds", "1"); duplicate.append("screenshotIds", "1");
  await assert.rejects(prepareScreenshots(duplicate, [{ id: 1, filename: "test.png", content_type: "image/png", position: 0 }]), ScreenshotError);
});

test("screenshot lifecycle persists, retains, removes and cascades records without leaking files", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "atelier-showcase-test-"));
  const originalPath = process.env.DATABASE_PATH;
  process.env.DATABASE_PATH = path.join(directory, "test.db");
  const db = database();
  try {
    migrateShowcase(db);
    const plan = await prepareScreenshots(await imageForm(), []);
    assert.match(plan.uploads[0].filename, /^[a-f0-9-]+\.png$/);
    writeScreenshotFiles(plan.uploads);
    saveScreenshotRecords(db, 1, plan);
    let rows = listScreenshots(db, 1);
    const filename = path.join(screenshotDirectory(), rows[0].filename);
    assert.equal(existsSync(filename), true);
    assert.equal(rows.length, 1);
    const keptForm = new FormData(); keptForm.append("screenshotIds", String(rows[0].id));
    const keep = await prepareScreenshots(keptForm, rows);
    assert.equal(keep.kept.length, 1);
    assert.equal(keep.removed.length, 0);
    const remove = await prepareScreenshots(new FormData(), rows);
    saveScreenshotRecords(db, 1, remove);
    removeScreenshotFiles(remove.removed);
    assert.equal(existsSync(filename), false);
    assert.equal(listScreenshots(db, 1).length, 0);
    const again = await prepareScreenshots(await imageForm(), []);
    writeScreenshotFiles(again.uploads); saveScreenshotRecords(db, 1, again);
    rows = listScreenshots(db, 1);
    db.prepare("DELETE FROM skills WHERE id = 1").run();
    removeScreenshotFiles(rows);
    assert.equal(listScreenshots(db, 1).length, 0);
    assert.equal(existsSync(path.join(screenshotDirectory(), rows[0].filename)), false);
  } finally {
    db.close();
    if (originalPath === undefined) delete process.env.DATABASE_PATH; else process.env.DATABASE_PATH = originalPath;
    rmSync(directory, { recursive: true, force: true });
  }
});
