"use client";
import Link from "next/link";
import { useState } from "react";
import { Heart, Play } from "lucide-react";
import { formatCount, formatDuration } from "@/lib/gallery/shared";
import type { PublicVideo } from "@/lib/gallery/model";

const ALL = "全部";

export function VideoCard({ video }: { video: PublicVideo }) {
  const hasMetrics = video.plays !== null || video.likes !== null;
  return <Link href={`/v/${video.slug}`} className="group mb-8 block break-inside-avoid">
    <div className="relative overflow-hidden rounded-xl border border-line bg-raised" style={{ aspectRatio: video.aspect_ratio.replace(":", "/") }}>
      {video.has_poster
        // eslint-disable-next-line @next/next/no-img-element -- posters are already resized WebP from our own route
        ? <img src={`/api/gallery/${video.id}/poster`} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        : <div className="size-full bg-sunken" />}
      <span className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white/90 backdrop-blur">{video.code}</span>
      {video.duration_seconds !== null && <span className="absolute right-2.5 top-2.5 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white/90 backdrop-blur">{formatDuration(video.duration_seconds)}</span>}
      {hasMetrics && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-3 pt-12 text-white">
        <div className="flex items-center gap-3 text-sm font-medium">
          {video.plays !== null && <span className="flex items-center gap-1"><Play size={13} fill="currentColor" />{formatCount(video.plays)}</span>}
          {video.likes !== null && <span className="flex items-center gap-1 text-white/80"><Heart size={13} />{formatCount(video.likes)}</span>}
        </div>
      </div>}
    </div>
    <h3 className="mt-3 line-clamp-2 text-sm leading-snug text-ink group-hover:text-accent">{video.title}</h3>
    {(video.method_tags.length > 0 || video.category) && <p className="mt-1.5 line-clamp-1 text-[11px] text-faint">{[video.category, ...video.method_tags.slice(0, 2)].filter(Boolean).join(" · ")}</p>}
  </Link>;
}

export function VideoWall({ videos }: { videos: PublicVideo[] }) {
  const counts = new Map<string, number>();
  for (const video of videos) if (video.category) counts.set(video.category, (counts.get(video.category) ?? 0) + 1);
  const categories = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const [category, setCategory] = useState(ALL);
  const visible = category === ALL ? videos : videos.filter(v => v.category === category);
  if (!videos.length) return <div className="rounded-2xl border border-dashed border-line px-5 py-24 text-center text-sm text-muted">视频正在整理中，稍后再来看看。</div>;
  const chips: [string, number][] = [[ALL, videos.length], ...categories];
  return <>
    {categories.length > 1 && <div className="mb-8 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="按分类筛选">
      {chips.map(([name, count]) => <button key={name} type="button" aria-pressed={category === name} onClick={() => setCategory(name)}
        className={`min-h-10 shrink-0 rounded-full border px-4 text-xs transition-colors ${category === name ? "border-accent bg-accent text-on-accent" : "border-line text-muted hover:border-line-strong"}`}>
        {name}<span className={`ml-1.5 ${category === name ? "opacity-70" : "text-faint"}`}>{count}</span>
      </button>)}
    </div>}
    {/* Columns rather than a grid, so landscape films and vertical clips can sit side by side. */}
    <div className="columns-1 gap-5 min-[480px]:columns-2 lg:columns-3 2xl:columns-4">
      {visible.map(video => <VideoCard key={video.id} video={video} />)}
    </div>
  </>;
}
