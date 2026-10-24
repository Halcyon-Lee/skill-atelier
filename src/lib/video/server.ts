import "server-only";
import { getDb } from "@/lib/db";
import { runtimeStatus } from "./jobs";
import type { VideoJob } from "./types";
import { jobOptions } from "./options";
export function getVideoRuntime() { return runtimeStatus(getDb()); }
export function getVideoJobs(userId: number) {
  return getDb().prepare("SELECT * FROM video_jobs WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 50").all(userId) as VideoJob[];
}
export function getFavoriteStyles(userId?: number) {
  if(!userId) return [];
  return (getDb().prepare("SELECT style_slug FROM video_favorites WHERE user_id=? ORDER BY created_at DESC").all(userId) as {style_slug:string}[]).map(row=>row.style_slug);
}
export function sameOrigin(request: Request) {
  const origin=request.headers.get("origin");
  if (!origin) return false;
  try {
    const incoming = new URL(origin), internal = new URL(request.url);
    // Next may normalize the internal URL hostname; browsers send the actual Host header.
    return incoming.host === (request.headers.get("host") || internal.host) && incoming.protocol === internal.protocol;
  } catch { return false; }
}
export function publicJob(job: VideoJob) {
  const { id,style_slug,title,status,script,created_at,started_at,finished_at,output_bytes,error,retry_of }=job;
  return { id,style_slug,title,status,script,created_at,started_at,finished_at,output_bytes,error,retry_of,options:jobOptions(job) };
}
