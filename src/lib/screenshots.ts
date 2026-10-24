import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import sharp from "sharp";
import { MAX_SCREENSHOTS, MAX_SCREENSHOT_BYTES } from "./showcase-rules.ts";

export type ScreenshotRow = {
  id: number;
  filename: string;
  content_type: string;
  position: number;
};
type PreparedImage = { filename: string; contentType: string; bytes: Buffer };

export class ScreenshotError extends Error {}

export function screenshotDirectory() {
  return path.join(path.dirname(process.env.DATABASE_PATH || path.join(process.cwd(), "data", "atelier.db")), "screenshots");
}

export function listScreenshots(db: DatabaseSync, skillId: number): ScreenshotRow[] {
  return db.prepare("SELECT id, filename, content_type, position FROM skill_screenshots WHERE skill_id = ? ORDER BY position, id")
    .all(skillId) as ScreenshotRow[];
}

export async function prepareScreenshots(form: FormData, existing: ScreenshotRow[]) {
  const ids = form.getAll("screenshotIds").map(String);
  if (new Set(ids).size !== ids.length || ids.some((id) => !existing.some((image) => String(image.id) === id))) {
    throw new ScreenshotError("截图信息已变化，请刷新页面后重试。");
  }
  const kept = ids.map((id) => existing.find((image) => String(image.id) === id)!);
  const files = form.getAll("screenshots").filter((value) => !(value instanceof File && !value.name && value.size === 0));
  if (kept.length + files.length > MAX_SCREENSHOTS) throw new ScreenshotError("最多添加 3 张截图。");

  const uploads: PreparedImage[] = [];
  for (const file of files) {
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_SCREENSHOT_BYTES) {
      throw new ScreenshotError("每张截图须为非空图片，且不能超过 5 MiB。");
    }
    try {
      const input = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 20_000_000, failOn: "warning" });
      const metadata = await input.metadata();
      const format = metadata.format;
      if (format !== "png" && format !== "jpeg" && format !== "webp") {
        throw new ScreenshotError("截图仅支持 PNG、JPEG 或 WebP 格式。");
      }
      const contentType = `image/${format}`;
      if (file.type !== contentType || (metadata.pages ?? 1) > 1) {
        throw new ScreenshotError("请选择格式正确的 PNG、JPEG 或 WebP 静态图片。");
      }
      // Decode and re-encode to reject broken images and strip private metadata.
      const bytes = await input.rotate().toFormat(format).toBuffer();
      if (bytes.length > MAX_SCREENSHOT_BYTES) throw new ScreenshotError("处理后的截图超过 5 MiB，请缩小图片后重试。");
      uploads.push({ filename: `${randomUUID()}.${format}`, contentType, bytes });
    } catch (error) {
      if (error instanceof ScreenshotError) throw error;
      throw new ScreenshotError("无法读取截图，请上传完整的 PNG、JPEG 或 WebP 图片（不超过 2000 万像素）。");
    }
  }
  return { kept, uploads, removed: existing.filter((image) => !kept.includes(image)) };
}

export function removeScreenshotFiles(images: { filename: string }[]) {
  for (const image of images) {
    try {
      fs.rmSync(path.join(screenshotDirectory(), image.filename), { force: true });
    } catch (error) {
      console.error("Screenshot cleanup failed", image.filename, error);
    }
  }
}

export function writeScreenshotFiles(images: PreparedImage[]) {
  if (!images.length) return;
  fs.mkdirSync(screenshotDirectory(), { recursive: true });
  const written: PreparedImage[] = [];
  try {
    for (const image of images) {
      fs.writeFileSync(path.join(screenshotDirectory(), image.filename), image.bytes, { flag: "wx", mode: 0o600 });
      written.push(image);
    }
  } catch (error) {
    removeScreenshotFiles(written);
    throw error;
  }
}

export function saveScreenshotRecords(db: DatabaseSync, skillId: number, plan: Awaited<ReturnType<typeof prepareScreenshots>>) {
  for (const image of plan.removed) db.prepare("DELETE FROM skill_screenshots WHERE id = ? AND skill_id = ?").run(image.id, skillId);
  plan.kept.forEach((image, position) => db.prepare("UPDATE skill_screenshots SET position = ? WHERE id = ? AND skill_id = ?").run(position, image.id, skillId));
  plan.uploads.forEach((image, index) => db.prepare("INSERT INTO skill_screenshots (skill_id, filename, content_type, position) VALUES (?, ?, ?, ?)")
    .run(skillId, image.filename, image.contentType, plan.kept.length + index));
}
