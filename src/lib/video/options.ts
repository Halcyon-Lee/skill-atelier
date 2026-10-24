export const ASPECT_OPTIONS = [
  { value: "16:9", label: "16:9 横屏" },
  { value: "9:16", label: "9:16 竖屏" },
  { value: "1:1", label: "1:1 方形" },
] as const;
export const RESOLUTION_OPTIONS = [
  { value: "720p", label: "720p · 高清" },
  { value: "1080p", label: "1080p · 全高清" },
] as const;
export const MIN_VIDEO_DURATION = 1;
export const MAX_VIDEO_DURATION = 600;
export const PACE_OPTIONS = [
  { value: "calm", label: "舒缓" },
  { value: "normal", label: "标准" },
  { value: "fast", label: "明快" },
] as const;
export type VideoOptions = {
  aspectRatio: typeof ASPECT_OPTIONS[number]["value"];
  resolution: typeof RESOLUTION_OPTIONS[number]["value"];
  duration: number;
  pace: typeof PACE_OPTIONS[number]["value"];
};
export const DEFAULT_VIDEO_OPTIONS: VideoOptions = {
  aspectRatio: "16:9", resolution: "1080p", duration: 30, pace: "normal",
};
const GROUPS = {
  aspectRatio: { label: "画幅尺寸", choices: ASPECT_OPTIONS },
  resolution: { label: "分辨率", choices: RESOLUTION_OPTIONS },
  pace: { label: "视频节奏", choices: PACE_OPTIONS },
};
export function parseVideoOptions(value?: unknown): VideoOptions {
  if (value === undefined) return { ...DEFAULT_VIDEO_OPTIONS };
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("生成参数格式无效。");
  const input = value as Record<string, unknown>;
  // Old saved drafts and task snapshots may contain music; discard that retired option.
  if (Object.keys(input).some(key => !Object.hasOwn(DEFAULT_VIDEO_OPTIONS, key) && key !== "music")) throw new Error("包含不支持的生成参数。");
  if (Object.hasOwn(input, "music") && input.music !== "style" && input.music !== "none") throw new Error("生成参数格式无效。");
  const result = { ...DEFAULT_VIDEO_OPTIONS };
  for (const key of Object.keys(GROUPS) as (keyof typeof GROUPS)[]) {
    if (!Object.hasOwn(input, key)) continue;
    const group = GROUPS[key];
    if (!group.choices.some(choice => choice.value === input[key])) throw new Error(`请选择有效的${group.label}。`);
    Object.assign(result, { [key]: input[key] });
  }
  if (Object.hasOwn(input, "duration")) {
    if (typeof input.duration !== "number" || !Number.isInteger(input.duration) || input.duration < MIN_VIDEO_DURATION || input.duration > MAX_VIDEO_DURATION) {
      throw new Error(`时长请输入 ${MIN_VIDEO_DURATION}–${MAX_VIDEO_DURATION} 秒的整数。`);
    }
    result.duration = input.duration;
  }
  return result;
}
export function jobOptions(job: { options_json?: string }): VideoOptions {
  return parseVideoOptions(job.options_json ? JSON.parse(job.options_json) : undefined);
}
export function videoDimensions(options: VideoOptions) {
  const short = options.resolution === "720p" ? 720 : 1080;
  if (options.aspectRatio === "9:16") return { width: short, height: short * 16 / 9 };
  if (options.aspectRatio === "1:1") return { width: short, height: short };
  return { width: short * 16 / 9, height: short };
}
export function sceneCount(options: VideoOptions) { return Math.max(1, Math.round(options.duration / 6)); }
export function optionLabel<K extends keyof typeof GROUPS>(key: K, options: VideoOptions) {
  return GROUPS[key].choices.find(choice => choice.value === options[key])?.label ?? String(options[key]);
}
