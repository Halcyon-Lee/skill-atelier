import data from "../../../catalog/video/styles.json";
import type { VideoStyle } from "./types";
export const VIDEO_STYLES = data as VideoStyle[];
export function getVideoStyle(slug: string) { return VIDEO_STYLES.find(style => style.slug === slug); }
