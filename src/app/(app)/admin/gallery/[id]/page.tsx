import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { deleteVideoAction } from "@/actions/gallery";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { findAdminVideo } from "@/lib/gallery/model";
import { DeleteVideoButton, FilmUploader, VideoForm } from "@/components/gallery/admin-forms";

export const metadata: Metadata = { title: "编辑视频" };

export default async function EditGalleryVideoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  await requireAdmin();
  const video = findAdminVideo(getDb(), (await params).id);
  if (!video) notFound();
  const created = (await searchParams).created === "1";
  return <div className="shell max-w-3xl py-10">
    <Link href="/admin/gallery" className="inline-flex min-h-10 items-center gap-2 text-xs text-muted hover:text-accent"><ArrowLeft size={15} />视频管理</Link>
    <div className="mb-8 mt-4 flex flex-wrap items-end justify-between gap-4">
      <div><p className="font-mono text-xs text-faint">{video.code} · 二维码曝光 {video.consult_clicks}</p><h1 className="mt-2 text-2xl font-medium">{video.title}</h1></div>
      {video.status === "published" && <Link href={`/v/${video.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-accent">查看公开页面<ExternalLink size={12} /></Link>}
    </div>
    {created && <p role="status" className="mb-6 rounded-lg border border-accent/30 bg-accent-soft/40 p-4 text-sm">草稿已创建，编号 <strong className="font-mono text-accent">{video.code}</strong>。接下来上传成片和封面，勾选展示授权后就可以发布。</p>}
    <div className="space-y-6">
      <FilmUploader id={video.id} hasFilm={!!video.film_path} />
      {video.film_path && <video src={`/api/gallery/${video.id}/film`} controls preload="metadata" className="max-h-[60vh] w-full rounded-xl border border-line bg-black object-contain" />}
      <VideoForm video={video} />
      <form action={deleteVideoAction} className="flex justify-end border-t border-line pt-6">
        <input type="hidden" name="id" value={video.id} />
        <DeleteVideoButton />
      </form>
    </div>
  </div>;
}
