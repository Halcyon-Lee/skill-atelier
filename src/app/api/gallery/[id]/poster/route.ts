import { getDb } from "@/lib/db";
import { findAdminVideo, findPublicFiles } from "@/lib/gallery/model";
import { imageResponse } from "@/lib/gallery/files";
import { isAdmin, isMember } from "@/lib/gallery/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isMember())) return new Response(null, { status: 401 });
  const { id } = await params;
  const published = findPublicFiles(getDb(), id);
  if (published) return imageResponse(published.poster_path, "private");
  return imageResponse((await isAdmin()) ? findAdminVideo(getDb(), id)?.poster_path ?? null : null, "private");
}
