// Client-safe constants and helpers; model.ts holds the server-only database code.
export const VIDEO_STATUSES = ["draft", "published", "hidden"] as const;
export type VideoStatus = (typeof VIDEO_STATUSES)[number];
export const ASPECT_RATIOS = ["9:16", "16:9", "1:1", "3:4"] as const;

export const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;

/** 1234 → "1234", 12345 → "1.2万", 123456789 → "1.2亿" */
export function formatCount(value: number | null): string {
  if (value === null) return "—";
  if (value >= 1e8) return `${trim(value / 1e8)}亿`;
  if (value >= 1e4) return `${trim(value / 1e4)}万`;
  return String(value);
}
function trim(n: number) { return (Math.floor(n * 10) / 10).toFixed(1).replace(/\.0$/, ""); }
