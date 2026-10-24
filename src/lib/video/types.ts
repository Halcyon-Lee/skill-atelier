export type VideoStyle = {
  slug: string; name: string; english: string; category: string; description: string;
  uses: string[]; film: string; sampleDuration: number; poster: string; sampleUrl: string;
  sourceUrl: string; sourceCommit: string; renderer: string | null;
  credit: string; license: string; collectedBy: string;
};
export const JOB_STAGES = ["queued", "planning", "rendering", "compositing", "succeeded"] as const;
export const STAGE_LABELS: Record<string, string> = {
  queued: "等待制作", planning: "编排分镜", rendering: "绘制画面", compositing: "合成成片", succeeded: "制作完成", failed: "制作未完成",
};
export type VideoJob = {
  id: string; user_id: number; style_slug: string; style_version: string; renderer: string;
  script: string; title: string; status: string; created_at: string; started_at: string | null;
  finished_at: string | null; heartbeat_at: number | null; worker_token: string | null;
  options_json: string;
  idempotency_key: string; retry_of: string | null; output_bytes: number | null; error: string | null;
};
export type VideoRuntime = { ready: boolean; message: string; renderers: string[] };
export function validateScript(value: unknown): string {
  if (typeof value !== "string") throw new Error("请输入视频脚本。");
  const script = value.trim();
  const length = Array.from(script).length;
  if (length < 10 || length > 2000) throw new Error("脚本需要 10–2000 个字，请保留最想表达的内容。");
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(script)) throw new Error("脚本包含无法处理的字符。");
  return script;
}
export function safeReturnTo(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return fallback;
  const url = new URL(value, "https://atelier.local");
  return url.origin === "https://atelier.local" ? url.pathname + url.search : fallback;
}
