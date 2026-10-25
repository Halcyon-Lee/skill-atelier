import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Plus, Settings } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listAdminVideos, publishProblem } from "@/lib/gallery/model";
import { formatCount } from "@/lib/gallery/shared";

export const metadata: Metadata = { title: "视频管理" };
const STATUS = { draft: ["草稿", "text-faint"], published: ["已发布", "text-accent"], hidden: ["已隐藏", "text-muted"] } as const;

export default async function GalleryAdminPage() {
  await requireAdmin();
  const videos = listAdminVideos(getDb());
  return <div className="shell py-10">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow text-accent">SHOWCASE</p><h1 className="mt-2 text-3xl font-medium">视频管理</h1><p className="mt-2 text-sm text-muted">会员能看到的视频、抖音数据，以及每条视频的二维码曝光次数。</p></div>
      <div className="flex gap-2"><Link href="/admin/gallery/settings" className="btn btn-outline btn-sm"><Settings size={14} />咨询设置</Link><Link href="/admin/gallery/new" className="btn btn-primary btn-sm"><Plus size={14} />新建视频</Link></div>
    </div>
    {videos.length ? <div className="mt-8 overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-line bg-raised text-xs text-faint"><tr>{["编号", "标题", "状态", "播放", "二维码曝光", ""].map(h => <th key={h} className="px-4 py-3 font-normal">{h}</th>)}</tr></thead>
        <tbody>{videos.map(video => {
          const [label, tone] = STATUS[video.status], blocker = video.status !== "published" ? publishProblem(video) : null;
          return <tr key={video.id} className="border-b border-line last:border-0">
            <td className="px-4 py-3 font-mono text-xs text-faint">{video.code}</td>
            <td className="px-4 py-3"><Link href={`/admin/gallery/${video.id}`} className="text-ink hover:text-accent">{video.title}</Link>{blocker && <p className="mt-1 text-[11px] text-faint">{blocker}</p>}</td>
            <td className={`px-4 py-3 text-xs ${tone}`}>{label}{video.featured && " · 精选"}</td>
            <td className="px-4 py-3">{formatCount(video.plays)}</td>
            <td className="px-4 py-3">{video.consult_clicks}</td>
            <td className="px-4 py-3 text-right">{video.status === "published" && <Link href={`/v/${video.slug}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent">查看<ExternalLink size={12} /></Link>}</td>
          </tr>;
        })}</tbody>
      </table>
    </div> : <div className="mt-8 rounded-xl border border-dashed border-line px-5 py-20 text-center text-sm text-muted">还没有视频。<Link href="/admin/gallery/new" className="ml-1 text-accent underline underline-offset-4">新建第一条</Link></div>}
  </div>;
}
