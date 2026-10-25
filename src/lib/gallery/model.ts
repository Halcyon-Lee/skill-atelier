import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { z } from "zod";

// Showcase videos: the public gallery of AI + skill generated films with their Douyin results.
// `skills_used` and the metrics proof are internal; public reads go through PUBLIC_COLUMNS only.

import { ASPECT_RATIOS, VIDEO_STATUSES, type VideoStatus } from "./shared.ts";
export { ASPECT_RATIOS, VIDEO_STATUSES, formatCount, type VideoStatus } from "./shared.ts";

export type PublicVideo = {
  id: string; code: string; slug: string; title: string; summary: string; category: string; tags: string[];
  aspect_ratio: string; duration_seconds: number | null; has_film: boolean; has_poster: boolean;
  douyin_url: string | null; plays: number | null; likes: number | null; comments: number | null; shares: number | null;
  metrics_as_of: string | null; skill_count: number; production_minutes: number | null; technique_hint: string;
  featured: boolean; published_at: string | null;
  /** How it was made: method tags (e.g. 代码生成), scenarios it suits, and what a client needs to provide. */
  method_tags: string[]; scenarios: string; conditions: string;
  /** Attribution for films made by others (e.g. LemoLab, CC BY 4.0); empty for the team's own work. */
  credit_name: string; credit_url: string | null; license: string; credits_url: string | null;
};
export type AdminVideo = Omit<PublicVideo, "tags" | "featured" | "has_film" | "has_poster"> & {
  tags: string[]; featured: boolean; film_path: string | null; poster_path: string | null; metrics_proof_path: string | null;
  skills_used: string; status: VideoStatus; display_authorized: boolean; sort_order: number; consult_clicks: number;
  source_key: string | null; created_at: string; updated_at: string;
};

const PUBLIC_COLUMNS = `id, code, slug, title, summary, category, tags, aspect_ratio, duration_seconds,
  film_path IS NOT NULL AS has_film, poster_path IS NOT NULL AS has_poster, douyin_url, plays, likes, comments, shares,
  metrics_as_of, skill_count, production_minutes, technique_hint, method_tags, scenarios, conditions, featured, published_at, credit_name, credit_url, license, credits_url`;

export function migrateGallery(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS showcase_videos (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      film_path TEXT, poster_path TEXT, metrics_proof_path TEXT,
      aspect_ratio TEXT NOT NULL DEFAULT '9:16',
      duration_seconds REAL,
      douyin_url TEXT,
      plays INTEGER, likes INTEGER, comments INTEGER, shares INTEGER,
      metrics_as_of TEXT,
      skill_count INTEGER NOT NULL DEFAULT 0,
      production_minutes INTEGER,
      technique_hint TEXT NOT NULL DEFAULT '',
      skills_used TEXT NOT NULL DEFAULT '',
      display_authorized INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','hidden')),
      featured INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      consult_clicks INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, published_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_showcase_videos_public ON showcase_videos(status, featured, sort_order);
    CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  const columns = new Set((db.prepare("PRAGMA table_info(showcase_videos)").all() as { name: string }[]).map(c => c.name));
  for (const [name, type] of [["credit_name", "TEXT NOT NULL DEFAULT ''"], ["credit_url", "TEXT"], ["license", "TEXT NOT NULL DEFAULT ''"], ["credits_url", "TEXT"], ["source_key", "TEXT"],
    ["method_tags", "TEXT NOT NULL DEFAULT '[]'"], ["scenarios", "TEXT NOT NULL DEFAULT ''"], ["conditions", "TEXT NOT NULL DEFAULT ''"]]) {
    if (!columns.has(name)) db.exec(`ALTER TABLE showcase_videos ADD COLUMN ${name} ${type}`);
  }
  // Imports (e.g. the LemoLab catalog) upsert by source_key so they can be re-run.
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_showcase_videos_source ON showcase_videos(source_key) WHERE source_key IS NOT NULL");
}

type Row = Record<string, unknown>;
function toPublic(row: Row): PublicVideo {
  return { ...(row as unknown as PublicVideo), tags: JSON.parse(String(row.tags)), method_tags: JSON.parse(String(row.method_tags)), featured: Boolean(row.featured), has_film: Boolean(row.has_film), has_poster: Boolean(row.has_poster) };
}
function toAdmin(row: Row): AdminVideo {
  return { ...(row as unknown as AdminVideo), tags: JSON.parse(String(row.tags)), method_tags: JSON.parse(String(row.method_tags)), featured: Boolean(row.featured), display_authorized: Boolean(row.display_authorized) };
}

export function listPublicVideos(db: DatabaseSync): PublicVideo[] {
  return (db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM showcase_videos WHERE status='published'
    ORDER BY featured DESC, sort_order DESC, COALESCE(plays,0) DESC, published_at DESC`).all() as Row[]).map(toPublic);
}
export function findPublicVideo(db: DatabaseSync, slug: string): PublicVideo | null {
  const row = db.prepare(`SELECT ${PUBLIC_COLUMNS} FROM showcase_videos WHERE slug=? AND status='published'`).get(slug) as Row | undefined;
  return row ? toPublic(row) : null;
}
/** File locations for the public file routes; never includes the metrics proof. */
export function findPublicFiles(db: DatabaseSync, id: string) {
  return (db.prepare("SELECT film_path, poster_path FROM showcase_videos WHERE id=? AND status='published'").get(id) as { film_path: string | null; poster_path: string | null } | undefined) ?? null;
}
export function listAdminVideos(db: DatabaseSync): AdminVideo[] {
  return (db.prepare("SELECT * FROM showcase_videos ORDER BY created_at DESC").all() as Row[]).map(toAdmin);
}
export function findAdminVideo(db: DatabaseSync, id: string): AdminVideo | null {
  const row = db.prepare("SELECT * FROM showcase_videos WHERE id=?").get(id) as Row | undefined;
  return row ? toAdmin(row) : null;
}

const optionalCount = z.preprocess(v => (v === "" || v == null ? null : Number(String(v).replace(/[,\s，]/g, ""))),
  z.number({ error: "请输入数字。" }).int("请输入整数。").min(0, "不能为负数。").max(1e12).nullable());
const text = (max: number, label: string) => z.string().trim().max(max, `${label}最多 ${max} 字。`);

export const videoInputSchema = z.object({
  title: text(60, "标题").min(2, "请填写标题。"),
  slug: z.string().trim().toLowerCase().max(60).regex(/^$|^[a-z0-9][a-z0-9-]*$/, "链接名只能用小写字母、数字和连字符。"),
  summary: text(300, "简介"),
  category: text(20, "分类"),
  tags: z.string().transform(v => [...new Set(v.split(/[,，\n]/).map(t => t.trim()).filter(Boolean))].slice(0, 8)),
  aspect_ratio: z.enum(ASPECT_RATIOS, { error: "请选择画幅。" }),
  duration_seconds: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().min(0).max(36000).nullable()),
  douyin_url: z.string().trim().refine(v => v === "" || /^https:\/\/([a-z0-9-]+\.)*(douyin\.com|iesdouyin\.com)\//i.test(v), "请填写抖音视频链接（https://www.douyin.com/... 或 v.douyin.com 短链）。")
    .transform(v => v || null),
  plays: optionalCount, likes: optionalCount, comments: optionalCount, shares: optionalCount,
  metrics_as_of: z.string().trim().refine(v => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "请选择数据截止日期。").transform(v => v || null),
  skill_count: z.preprocess(v => (v === "" || v == null ? 0 : Number(v)), z.number().int().min(0).max(50)),
  production_minutes: z.preprocess(v => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).max(100000).nullable()),
  technique_hint: text(300, "实现方式说明"),
  method_tags: z.string().transform(v => [...new Set(v.split(/[,，\n]/).map(t => t.trim()).filter(Boolean))].slice(0, 6)),
  scenarios: text(300, "适用场景"),
  conditions: text(500, "制作条件"),
  credit_name: text(60, "原作者"),
  credit_url: z.string().trim().refine(v => v === "" || /^https:\/\//.test(v), "原作链接需以 https:// 开头。").transform(v => v || null),
  license: text(40, "授权"),
  credits_url: z.string().trim().refine(v => v === "" || /^https:\/\//.test(v), "素材来源链接需以 https:// 开头。").transform(v => v || null),
  skills_used: text(4000, "Skill 清单"),
  display_authorized: z.preprocess(v => v === "on" || v === true, z.boolean()),
  status: z.enum(VIDEO_STATUSES),
  featured: z.preprocess(v => v === "on" || v === true, z.boolean()),
  sort_order: z.preprocess(v => (v === "" || v == null ? 0 : Number(v)), z.number().int().min(-1000).max(1000)),
});
export type VideoInput = z.infer<typeof videoInputSchema>;

export class GalleryError extends Error {}

export function parseVideoInput(raw: Record<string, unknown>): VideoInput {
  // Attribution is optional: the team's own films leave it blank.
  const result = videoInputSchema.safeParse({ credit_name: "", credit_url: "", license: "", credits_url: "", method_tags: "", scenarios: "", conditions: "", ...raw });
  if (!result.success) throw new GalleryError(result.error.issues[0]?.message ?? "填写内容有误。");
  const input = result.data;
  const hasMetrics = [input.plays, input.likes, input.comments, input.shares].some(v => v !== null);
  if (hasMetrics && !input.metrics_as_of) throw new GalleryError("填写了抖音数据，请同时填写数据截止日期。");
  return input;
}

/** Publishing rules: a public video needs its film, cover and display authorization. */
export function publishProblem(video: Pick<AdminVideo, "film_path" | "poster_path" | "display_authorized">): string | null {
  if (!video.film_path) return "发布前请先上传成片。";
  if (!video.poster_path) return "发布前请先上传封面。";
  if (!video.display_authorized) return "发布前请确认已获得展示授权。";
  return null;
}

function nextCode(db: DatabaseSync) {
  const row = db.prepare("SELECT MAX(CAST(SUBSTR(code,2) AS INTEGER)) n FROM showcase_videos WHERE code GLOB 'V[0-9]*'").get() as { n: number | null };
  return `V${String((row.n ?? 0) + 1).padStart(3, "0")}`;
}

function assertSlugFree(db: DatabaseSync, slug: string, id: string) {
  if (db.prepare("SELECT 1 FROM showcase_videos WHERE slug=? AND id<>?").get(slug, id)) throw new GalleryError("这个链接名已被使用，请换一个。");
}

export function createVideo(db: DatabaseSync, input: VideoInput, now = new Date().toISOString()): AdminVideo {
  if (input.status === "published") throw new GalleryError("新建的视频需要先上传成片和封面，保存后再发布。");
  db.exec("BEGIN IMMEDIATE");
  try {
    const id = randomUUID(), code = nextCode(db), slug = input.slug || code.toLowerCase();
    assertSlugFree(db, slug, id);
    db.prepare(`INSERT INTO showcase_videos(id,code,slug,title,summary,category,tags,aspect_ratio,duration_seconds,douyin_url,plays,likes,comments,shares,
      metrics_as_of,skill_count,production_minutes,technique_hint,skills_used,display_authorized,status,featured,sort_order,created_at,updated_at,
      credit_name,credit_url,license,credits_url,method_tags,scenarios,conditions)
      VALUES(${Array(32).fill("?").join(",")})`).run(
      id, code, slug, input.title, input.summary, input.category, JSON.stringify(input.tags), input.aspect_ratio, input.duration_seconds,
      input.douyin_url, input.plays, input.likes, input.comments, input.shares, input.metrics_as_of, input.skill_count,
      input.production_minutes, input.technique_hint, input.skills_used, input.display_authorized ? 1 : 0, input.status,
      input.featured ? 1 : 0, input.sort_order, now, now, input.credit_name, input.credit_url, input.license, input.credits_url,
      JSON.stringify(input.method_tags), input.scenarios, input.conditions);
    db.exec("COMMIT");
    return findAdminVideo(db, id)!;
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

export function updateVideo(db: DatabaseSync, id: string, input: VideoInput, now = new Date().toISOString()): AdminVideo {
  const current = findAdminVideo(db, id);
  if (!current) throw new GalleryError("找不到这条视频。");
  const slug = input.slug || current.code.toLowerCase();
  assertSlugFree(db, slug, id);
  if (input.status === "published") {
    const problem = publishProblem({ ...current, display_authorized: input.display_authorized });
    if (problem) throw new GalleryError(problem);
  }
  const publishedAt = input.status === "published" ? current.published_at ?? now : current.published_at;
  db.prepare(`UPDATE showcase_videos SET slug=?,title=?,summary=?,category=?,tags=?,aspect_ratio=?,duration_seconds=?,douyin_url=?,plays=?,likes=?,comments=?,shares=?,
    metrics_as_of=?,skill_count=?,production_minutes=?,technique_hint=?,skills_used=?,display_authorized=?,status=?,featured=?,sort_order=?,updated_at=?,published_at=?,
    credit_name=?,credit_url=?,license=?,credits_url=?,method_tags=?,scenarios=?,conditions=? WHERE id=?`).run(
    slug, input.title, input.summary, input.category, JSON.stringify(input.tags), input.aspect_ratio, input.duration_seconds, input.douyin_url,
    input.plays, input.likes, input.comments, input.shares, input.metrics_as_of, input.skill_count, input.production_minutes,
    input.technique_hint, input.skills_used, input.display_authorized ? 1 : 0, input.status, input.featured ? 1 : 0, input.sort_order, now, publishedAt,
    input.credit_name, input.credit_url, input.license, input.credits_url, JSON.stringify(input.method_tags), input.scenarios, input.conditions, id);
  return findAdminVideo(db, id)!;
}

export type VideoFileField = "film_path" | "poster_path" | "metrics_proof_path";
export function setVideoFile(db: DatabaseSync, id: string, field: VideoFileField, value: string | null, extra: { duration_seconds?: number } = {}) {
  const columns = { film_path: "film_path", poster_path: "poster_path", metrics_proof_path: "metrics_proof_path" } as const;
  db.prepare(`UPDATE showcase_videos SET ${columns[field]}=?, updated_at=? WHERE id=?`).run(value, new Date().toISOString(), id);
  if (field === "film_path" && extra.duration_seconds !== undefined) {
    db.prepare("UPDATE showcase_videos SET duration_seconds=COALESCE(duration_seconds, ?) WHERE id=?").run(extra.duration_seconds, id);
  }
}

export function setSourceKey(db: DatabaseSync, id: string, key: string) {
  db.prepare("UPDATE showcase_videos SET source_key=? WHERE id=?").run(key, id);
}
export function findBySourceKey(db: DatabaseSync, key: string): AdminVideo | null {
  const row = db.prepare("SELECT * FROM showcase_videos WHERE source_key=?").get(key) as Row | undefined;
  return row ? toAdmin(row) : null;
}

export function deleteVideo(db: DatabaseSync, id: string) {
  db.prepare("DELETE FROM showcase_videos WHERE id=?").run(id);
}

export function recordConsultClick(db: DatabaseSync, id: string) {
  return Number(db.prepare("UPDATE showcase_videos SET consult_clicks=consult_clicks+1 WHERE id=? AND status='published'").run(id).changes) > 0;
}

export type SiteSettings = { wechat_qr_path: string | null; wechat_id: string; consult_headline: string };
export const DEFAULT_CONSULT_HEADLINE = "联系我们";
export function getSiteSettings(db: DatabaseSync): SiteSettings {
  const rows = db.prepare("SELECT key, value FROM site_settings").all() as { key: string; value: string }[];
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return { wechat_qr_path: map.wechat_qr_path || null, wechat_id: map.wechat_id ?? "", consult_headline: map.consult_headline || DEFAULT_CONSULT_HEADLINE };
}
export function saveSiteSetting(db: DatabaseSync, key: keyof SiteSettings, value: string | null) {
  if (value === null) db.prepare("DELETE FROM site_settings WHERE key=?").run(key);
  else db.prepare("INSERT INTO site_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(key, value);
}
