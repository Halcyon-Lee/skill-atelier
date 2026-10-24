import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { VideoJob, VideoStyle, VideoRuntime } from "./types.ts";
import { validateScript } from "./types.ts";
import { jobOptions, parseVideoOptions } from "./options.ts";
export const LEASE_MS = 30_000;
export const JOB_TIMEOUT_MS = 90 * 60_000;
export function runtimeStatus(db: DatabaseSync, now = Date.now()): VideoRuntime {
  const row = db.prepare("SELECT * FROM video_worker WHERE id=1").get() as { heartbeat_at: number; ready: number; message: string; renderers: string } | undefined;
  if (!row || row.heartbeat_at < now - LEASE_MS) return { ready: false, message: "制作服务正在连接，请稍后再试。脚本会保存在当前浏览器。", renderers: [] };
  return { ready: Boolean(row.ready), message: row.message, renderers: JSON.parse(row.renderers) };
}
export function findJob(db: DatabaseSync, id: string): VideoJob | undefined {
  return db.prepare("SELECT * FROM video_jobs WHERE id=?").get(id) as VideoJob | undefined;
}
export function enqueueJob(db: DatabaseSync, userId: number, style: VideoStyle, rawScript: unknown, key: string, retryOf: string | null = null, rawOptions?: unknown) {
  const script = validateScript(rawScript);
  const options = parseVideoOptions(rawOptions), optionsJson = JSON.stringify(options);
  if (!/^[0-9a-f-]{36}$/i.test(key)) throw new Error("提交标识无效，请刷新后重试。");
  if (!style.renderer) throw new Error("这个风格正在准备中，可以先收藏。");
  db.exec("BEGIN IMMEDIATE");
  try {
    const existing = db.prepare("SELECT * FROM video_jobs WHERE user_id=? AND idempotency_key=?").get(userId, key) as VideoJob | undefined;
    if (existing) {
      if (existing.script !== script || existing.style_slug !== style.slug || existing.retry_of !== retryOf || JSON.stringify(jobOptions(existing)) !== optionsJson) throw new Error("重复提交的内容不一致，请重新提交。");
      db.exec("COMMIT"); return existing;
    }
    const active = db.prepare("SELECT id FROM video_jobs WHERE user_id=? AND status IN ('queued','planning','rendering','compositing')").get(userId) as { id: string } | undefined;
    if (active) throw new Error("你已有一项正在制作的任务，请先到「我的作品」查看。");
    if (retryOf) {
      const prior = findJob(db, retryOf);
      if (!prior || prior.user_id !== userId || prior.status !== "failed" || prior.script !== script || prior.style_slug !== style.slug || JSON.stringify(jobOptions(prior)) !== optionsJson) throw new Error("只能重试自己制作失败的任务。");
    }
    const id = randomUUID();
    db.prepare(`INSERT INTO video_jobs(id,user_id,style_slug,style_version,renderer,script,title,idempotency_key,retry_of,created_at,options_json)
      VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(id,userId,style.slug,style.sourceCommit,style.renderer,script,Array.from(script.split(/\n/)[0]).slice(0,30).join(""),key,retryOf,new Date().toISOString(),optionsJson);
    db.exec("COMMIT"); return findJob(db,id)!;
  } catch(error) { db.exec("ROLLBACK"); throw error; }
}
export function failAbandonedJobs(db: DatabaseSync, now = Date.now()) {
  return db.prepare(`UPDATE video_jobs SET status='failed',error='制作进程已中断，请重试。',finished_at=?,worker_token=NULL
    WHERE status IN ('planning','rendering','compositing') AND (heartbeat_at IS NULL OR heartbeat_at < ? OR started_at < ?)`)
    .run(new Date(now).toISOString(),now-LEASE_MS,new Date(now-JOB_TIMEOUT_MS).toISOString());
}
export function acquireWorker(db: DatabaseSync, token: string, now = Date.now()) {
  const result = db.prepare(`INSERT INTO video_worker(id,token,heartbeat_at) VALUES(1,?,?)
    ON CONFLICT(id) DO UPDATE SET token=excluded.token,heartbeat_at=excluded.heartbeat_at,ready=0,message='制作服务启动中',renderers='[]'
    WHERE video_worker.heartbeat_at < ? OR video_worker.token=excluded.token`).run(token,now,now-LEASE_MS);
  return Number(result.changes) === 1;
}
export function claimJob(db: DatabaseSync, token: string, now = Date.now()): VideoJob | undefined {
  db.exec("BEGIN IMMEDIATE");
  try {
    const worker = db.prepare("SELECT token,heartbeat_at FROM video_worker WHERE id=1").get() as { token: string; heartbeat_at: number } | undefined;
    if (!worker || worker.token !== token || worker.heartbeat_at < now-LEASE_MS) { db.exec("COMMIT"); return; }
    failAbandonedJobs(db,now);
    const busy = db.prepare("SELECT 1 FROM video_jobs WHERE status IN ('planning','rendering','compositing')").get();
    if (busy) { db.exec("COMMIT"); return; }
    const job = db.prepare("SELECT * FROM video_jobs WHERE status='queued' ORDER BY created_at,id LIMIT 1").get() as VideoJob | undefined;
    if (job) db.prepare("UPDATE video_jobs SET status='planning',worker_token=?,heartbeat_at=?,started_at=? WHERE id=? AND status='queued'").run(token,now,new Date(now).toISOString(),job.id);
    db.exec("COMMIT"); return job ? findJob(db,job.id) : undefined;
  } catch(error) { db.exec("ROLLBACK"); throw error; }
}
export function transitionJob(db: DatabaseSync, id: string, token: string, status: string, values: { title?: string; bytes?: number; error?: string } = {}) {
  const transitions: Record<string,string[]> = { rendering:["planning"],compositing:["rendering"],succeeded:["compositing"],failed:["planning","rendering","compositing"] };
  const allowed = transitions[status];
  if (!allowed) throw new Error("Invalid job transition");
  const terminal = status === "succeeded" || status === "failed";
  const result=db.prepare(`UPDATE video_jobs SET status=?,title=COALESCE(?,title),output_bytes=COALESCE(?,output_bytes),error=?,finished_at=?,heartbeat_at=?
    WHERE id=? AND worker_token=? AND status IN (${allowed.map(()=>"?").join(",")})`).run(status,values.title??null,values.bytes??null,values.error??null,terminal?new Date().toISOString():null,Date.now(),id,token,...allowed);
  if (Number(result.changes)!==1) throw new Error("Job lease lost or stage changed");
}
