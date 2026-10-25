import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { VideoForm } from "@/components/gallery/admin-forms";

export const metadata: Metadata = { title: "新建视频" };

export default async function NewGalleryVideoPage() {
  await requireAdmin();
  return <div className="shell max-w-3xl py-10">
    <Link href="/admin/gallery" className="inline-flex min-h-10 items-center gap-2 text-xs text-muted hover:text-accent"><ArrowLeft size={15} />视频管理</Link>
    <h1 className="mb-2 mt-4 text-2xl font-medium">新建视频</h1>
    <p className="mb-8 text-sm text-muted">先保存为草稿，系统会分配编号；然后上传成片，再发布。</p>
    <VideoForm />
  </div>;
}
