import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getSiteSettings } from "@/lib/gallery/model";
import { SettingsForm } from "@/components/gallery/admin-forms";

export const metadata: Metadata = { title: "咨询设置" };

export default async function GallerySettingsPage() {
  await requireAdmin();
  return <div className="shell max-w-3xl py-10">
    <Link href="/admin/gallery" className="inline-flex min-h-10 items-center gap-2 text-xs text-muted hover:text-accent"><ArrowLeft size={15} />视频管理</Link>
    <h1 className="mb-8 mt-4 text-2xl font-medium">咨询设置</h1>
    <SettingsForm settings={getSiteSettings(getDb())} />
  </div>;
}
