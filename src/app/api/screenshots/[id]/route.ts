import fs from "node:fs/promises";
import path from "node:path";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { screenshotDirectory } from "@/lib/screenshots";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return new Response("请先登录。", { status: 401 });
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return new Response("未找到截图。", { status: 404 });
  const image = getDb().prepare("SELECT filename, content_type FROM skill_screenshots WHERE id = ?")
    .get(id) as { filename: string; content_type: string } | undefined;
  if (!image) return new Response("未找到截图。", { status: 404 });
  try {
    const bytes = await fs.readFile(path.join(screenshotDirectory(), image.filename));
    return new Response(new Uint8Array(bytes), { headers: {
      "Content-Type": image.content_type,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return new Response("未找到截图。", { status: 404 });
  }
}
