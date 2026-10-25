import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { findAdminVideo, GalleryError, setVideoFile } from "@/lib/gallery/model";
import { MAX_FILM_BYTES, removeGalleryFile, saveFilm } from "@/lib/gallery/files";
import { isAdmin } from "@/lib/gallery/server";
import { sameOrigin } from "@/lib/video/server";

// Films are too large for a server action, so the admin page streams the raw MP4 here.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response(null, { status: 404 });
  if (!sameOrigin(request)) return Response.json({ error: "请求来源无效。" }, { status: 403 });
  const { id } = await params;
  const video = findAdminVideo(getDb(), id);
  if (!video) return Response.json({ error: "找不到这条视频。" }, { status: 404 });
  if (Number(request.headers.get("content-length")) > MAX_FILM_BYTES) return Response.json({ error: "成片不能超过 500 MiB。" }, { status: 413 });
  if (!request.body) return Response.json({ error: "没有收到视频文件。" }, { status: 400 });
  const duration = Number(request.headers.get("x-video-duration"));
  try {
    const { relative, bytes } = await saveFilm(request.body, id);
    setVideoFile(getDb(), id, "film_path", relative, Number.isFinite(duration) && duration > 0 ? { duration_seconds: Math.round(duration * 10) / 10 } : {});
    removeGalleryFile(video.film_path);
    revalidatePath("/");
    revalidatePath(`/v/${video.slug}`);
    return Response.json({ bytes });
  } catch (error) {
    if (error instanceof GalleryError) return Response.json({ error: error.message }, { status: 400 });
    console.error("Film upload failed", error);
    return Response.json({ error: "上传失败，请重试。" }, { status: 500 });
  }
}
