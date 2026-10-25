import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getDb } from "@/lib/db";
import { findPublicVideo, listPublicVideos } from "@/lib/gallery/model";
import { formatCount, formatDuration } from "@/lib/gallery/shared";
import { requireMember } from "@/lib/gallery/server";
import { consultSettings, GalleryShell } from "@/components/gallery/shell";
import { ConsultCard } from "@/components/gallery/consult";
import { VideoCard } from "@/components/gallery/video-wall";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const video = findPublicVideo(getDb(), (await params).slug);
  return video ? { title: video.title, description: video.summary || undefined } : { title: "视频不存在" };
}

const productionTime = (minutes: number) => minutes < 60 ? `约 ${minutes} 分钟` : minutes % 60 === 0 ? `约 ${minutes / 60} 小时` : `约 ${(minutes / 60).toFixed(1)} 小时`;

export default async function VideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireMember(`/v/${slug}`);
  const video = findPublicVideo(getDb(), slug);
  if (!video) notFound();
  const metrics = ([["播放", video.plays], ["点赞", video.likes], ["评论", video.comments], ["分享", video.shares]] as const).filter(([, value]) => value !== null);
  const facts = [
    video.duration_seconds !== null && ["成片时长", formatDuration(video.duration_seconds)],
    video.production_minutes !== null && ["制作时长", productionTime(video.production_minutes)],
    video.scenarios && ["适用场景", video.scenarios],
    video.conditions && ["制作条件", video.conditions],
  ].filter(Boolean) as [string, string][];
  const related = listPublicVideos(getDb()).filter(item => item.id !== video.id && item.category === video.category).slice(0, 6);
  const portrait = video.aspect_ratio === "9:16" || video.aspect_ratio === "3:4";
  return <GalleryShell>
    <div className="shell py-8 sm:py-10">
      <Link href="/" className="mb-6 inline-flex min-h-10 items-center gap-2 text-xs text-muted hover:text-accent"><ArrowLeft size={15} />全部案例</Link>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
        <div className="lg:sticky lg:top-28">
          <video src={`/api/gallery/${video.id}/film`} poster={video.has_poster ? `/api/gallery/${video.id}/poster` : undefined} controls playsInline preload="metadata"
            className={`w-full rounded-xl border border-line bg-black object-contain ${portrait ? "mx-auto max-h-[78vh] max-w-[440px]" : ""}`}
            style={{ aspectRatio: video.aspect_ratio.replace(":", "/") }} aria-label={video.title} />
        </div>

        <div className="space-y-7">
          <header>
            <p className="font-mono text-xs text-faint">{video.code}{video.category && ` · ${video.category}`}</p>
            <h1 className="mt-2 text-2xl font-medium leading-snug tracking-tight">{video.title}</h1>
            {video.summary && <p className="mt-3 text-sm leading-relaxed text-muted">{video.summary}</p>}
          </header>

          {(video.method_tags.length > 0 || video.technique_hint) && <section aria-label="实现方式">
            <h2 className="text-sm font-medium">实现方式</h2>
            {video.method_tags.length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{video.method_tags.map(tag => <li key={tag} className="rounded-full border border-accent/40 bg-accent-soft/40 px-3 py-1 text-xs text-accent">{tag}</li>)}</ul>}
            {video.technique_hint && <p className="mt-3 text-sm leading-relaxed text-muted">{video.technique_hint}</p>}
          </section>}

          {facts.length > 0 && <section aria-label="制作信息">
            <h2 className="text-sm font-medium">制作信息</h2>
            <dl className="mt-3 divide-y divide-line rounded-xl border border-line">
              {facts.map(([label, value]) => <div key={label} className="grid grid-cols-[5.5rem_1fr] gap-3 px-4 py-3 text-sm"><dt className="text-faint">{label}</dt><dd className="leading-relaxed text-ink">{value}</dd></div>)}
            </dl>
          </section>}

          {metrics.length > 0 && <section aria-label="抖音数据" className="rounded-xl border border-line bg-raised p-5">
            <div className="flex items-baseline justify-between gap-3"><h2 className="text-sm font-medium">在抖音的表现</h2>{video.metrics_as_of && <span className="text-[11px] text-faint">截至 {video.metrics_as_of}</span>}</div>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {metrics.map(([label, value]) => <div key={label}><dt className="text-[11px] text-faint">{label}</dt><dd className="mt-1 text-xl font-medium tracking-tight text-ink">{formatCount(value)}</dd></div>)}
            </dl>
            {video.douyin_url && <a href={video.douyin_url} target="_blank" rel="noreferrer nofollow" className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-xs text-muted hover:text-accent">去抖音看原视频<ExternalLink size={12} /></a>}
          </section>}

          <ConsultCard settings={consultSettings()} video={{ id: video.id, code: video.code }} />

          {video.credit_name && <p className="text-xs leading-relaxed text-faint">
            作品来自 {video.credit_url ? <a href={video.credit_url} target="_blank" rel="noreferrer" className="text-muted underline underline-offset-4 hover:text-accent">{video.credit_name}</a> : video.credit_name}
            {video.license && <> · {video.license}</>}
            {video.credits_url && <> · <a href={video.credits_url} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-accent">素材来源</a></>}
          </p>}
        </div>
      </div>

      {related.length > 0 && <section className="mt-16 border-t border-line pt-10" aria-label="同类案例">
        <h2 className="mb-6 text-lg font-medium">同类案例</h2>
        <div className="columns-1 gap-5 min-[480px]:columns-2 lg:columns-3">{related.map(item => <VideoCard key={item.id} video={item} />)}</div>
      </section>}
    </div>
  </GalleryShell>;
}
