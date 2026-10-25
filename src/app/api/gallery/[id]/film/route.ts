import { getDb } from "@/lib/db";
import { findAdminVideo, findPublicFiles } from "@/lib/gallery/model";
import { resolveGalleryPath } from "@/lib/gallery/files";
import { isAdmin, isMember } from "@/lib/gallery/server";
import { streamVideo } from "@/lib/video/files";

// Films are only for signed-in members (admins can also preview drafts).
async function handle(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isMember())) return Response.json({ error: "请先登录。" }, { status: 401 });
  const { id } = await params;
  const file = findPublicFiles(getDb(), id)?.film_path ?? ((await isAdmin()) ? findAdminVideo(getDb(), id)?.film_path : null);
  if (!file) return Response.json({ error: "视频不存在。" }, { status: 404 });
  return streamVideo(request, resolveGalleryPath(file));
}
export const GET = handle;
export const HEAD = handle;
