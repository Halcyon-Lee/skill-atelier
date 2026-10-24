import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getVideoStyle } from "@/lib/video/catalog";
import { getFavoriteStyles,getVideoRuntime } from "@/lib/video/server";
import { CreateVideoForm } from "@/components/video/create-form";
import { FavoriteButton } from "@/components/video/style-gallery";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata> { const style=getVideoStyle((await params).slug);return {title:style?`${style.name} · 视频创作`:"风格不存在"}; }
export default async function StylePage({params}:{params:Promise<{slug:string}>}) {
  const style=getVideoStyle((await params).slug);if(!style)notFound();
  const user=await getSessionUser(),favorites=getFavoriteStyles(user?.id);
  return <div className="shell py-8 sm:py-12"><Link href="/#styles" className="mb-8 inline-flex min-h-10 items-center gap-2 text-xs text-muted hover:text-accent"><ArrowLeft size={15}/>全部风格</Link>
    <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
      <div><div className="mb-5 flex items-center justify-between gap-4"><div><p className="eyebrow text-accent">{style.category}</p><h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">{style.name}</h1><p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{style.english}</p></div><FavoriteButton slug={style.slug} initial={favorites.includes(style.slug)} loggedIn={!!user}/></div>
        <video src={`/api/video-previews/${style.slug}`} poster={style.poster} controls playsInline preload="none" className="aspect-video w-full rounded-xl border border-line bg-black" aria-label={`${style.name}参考样片`}/>
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-[11px] text-faint"><span>参考样片 · {style.film}</span><span>{style.credit} · {style.license}</span></div>
        <p className="mt-7 text-base leading-relaxed text-muted">{style.description}</p><div className="mt-4 flex flex-wrap gap-2">{style.uses.map(use=><span key={use} className="rounded-full border border-line px-3 py-1 text-xs text-muted">{use}</span>)}</div>
        <div className="mt-8 grid grid-cols-3 gap-4 border-y border-line py-6 text-sm"><div><span className="font-mono text-xs text-accent">01</span><p className="mt-2">选一种风格</p></div><div><span className="font-mono text-xs text-accent">02</span><p className="mt-2">写自己的脚本</p></div><div><span className="font-mono text-xs text-accent">03</span><p className="mt-2">收下你的影片</p></div></div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-faint"><span>由 {style.collectedBy} 精选 · 原作 {style.credit}</span><a href={style.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 text-muted hover:text-accent">查看原作与风格说明<ExternalLink size={12}/></a></div>
        <p className="mt-2 text-[11px] leading-relaxed text-faint">样片用于参考画风。新影片会根据你的脚本重新制作，具体构图和节奏随内容变化。</p>
      </div>
      <div className="lg:sticky lg:top-28"><CreateVideoForm style={style} loggedIn={!!user} initialRuntime={getVideoRuntime()}/></div>
    </div>
  </div>;
}
