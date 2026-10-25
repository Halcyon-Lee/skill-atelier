import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import sharp from "sharp";
import { GalleryError } from "./model.ts";

export const MAX_FILM_BYTES = 500 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function galleryRoot() {
  return path.join(path.dirname(process.env.DATABASE_PATH || path.join(process.cwd(), "data", "atelier.db")), "showcase");
}
/** Stored paths are relative to galleryRoot() so the data directory can move. */
export function resolveGalleryPath(relative: string) {
  const full = path.resolve(galleryRoot(), relative);
  if (!full.startsWith(galleryRoot() + path.sep)) throw new Error("Invalid gallery path");
  return full;
}
function videoFolder(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id) && id !== "site") throw new Error("Invalid gallery id");
  return id;
}

/** Re-encode an uploaded image as WebP: rejects non-images and strips metadata. */
export async function saveImage(file: File, owner: string, name: string, maxWidth = 1600): Promise<string> {
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) throw new GalleryError("图片不能为空，且不能超过 8 MiB。");
  let bytes: Buffer;
  try {
    const input = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40_000_000, failOn: "warning" });
    const meta = await input.metadata();
    if (!["png", "jpeg", "webp"].includes(meta.format ?? "") || (meta.pages ?? 1) > 1) throw new GalleryError("图片仅支持 PNG、JPEG 或 WebP 静态图片。");
    bytes = await input.rotate().resize({ width: maxWidth, withoutEnlargement: true }).webp({ quality: 86 }).toBuffer();
  } catch (error) {
    if (error instanceof GalleryError) throw error;
    throw new GalleryError("无法读取图片，请上传完整的 PNG、JPEG 或 WebP 文件。");
  }
  const relative = path.join(videoFolder(owner), `${name}-${randomUUID().slice(0, 8)}.webp`);
  fs.mkdirSync(path.dirname(resolveGalleryPath(relative)), { recursive: true });
  fs.writeFileSync(resolveGalleryPath(relative), bytes, { mode: 0o600 });
  return relative;
}

/** Stream an MP4 upload to disk, enforcing the size limit and the ISO-BMFF `ftyp` signature. */
export async function saveFilm(body: ReadableStream<Uint8Array>, owner: string): Promise<{ relative: string; bytes: number }> {
  const relative = path.join(videoFolder(owner), `film-${randomUUID().slice(0, 8)}.mp4`);
  const target = resolveGalleryPath(relative), temp = `${target}.part`;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  let bytes = 0, head = Buffer.alloc(0);
  try {
    await pipeline(Readable.fromWeb(body as import("node:stream/web").ReadableStream<Uint8Array>), async function* (source) {
      for await (const chunk of source as AsyncIterable<Buffer>) {
        bytes += chunk.length;
        if (bytes > MAX_FILM_BYTES) throw new GalleryError("成片不能超过 500 MiB。");
        if (head.length < 12) head = Buffer.concat([head, chunk.subarray(0, 12 - head.length)]);
        yield chunk;
      }
    }, fs.createWriteStream(temp, { mode: 0o600 }));
    if (bytes === 0) throw new GalleryError("没有收到视频文件。");
    if (head.subarray(4, 8).toString("latin1") !== "ftyp") throw new GalleryError("请上传 MP4 格式的视频。");
    fs.renameSync(temp, target);
    return { relative, bytes };
  } catch (error) {
    fs.rmSync(temp, { force: true });
    throw error;
  }
}

export function removeGalleryFile(relative: string | null) {
  if (!relative) return;
  try { fs.rmSync(resolveGalleryPath(relative), { force: true }); } catch (error) { console.error("Gallery file cleanup failed", relative, error); }
}
export function removeVideoFolder(id: string) {
  try { fs.rmSync(resolveGalleryPath(videoFolder(id)), { recursive: true, force: true }); } catch (error) { console.error("Gallery folder cleanup failed", id, error); }
}

export function imageResponse(relative: string | null, cache: "public" | "private") {
  if (!relative) return new Response(null, { status: 404 });
  let bytes: Buffer;
  try { bytes = fs.readFileSync(resolveGalleryPath(relative)); } catch { return new Response(null, { status: 404 }); }
  return new Response(new Uint8Array(bytes), { headers: {
    "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff",
    "Cache-Control": cache === "public" ? "public, max-age=300" : "private, no-store",
  } });
}
