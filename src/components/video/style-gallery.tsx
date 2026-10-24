"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowUpRight, Bookmark, Play, Search, Check } from "lucide-react";
import type { VideoStyle } from "@/lib/video/types";
function duration(seconds:number) { return `${Math.floor(seconds/60)}:${String(Math.round(seconds%60)).padStart(2,"0")}`; }
export function FavoriteButton({slug,initial=false,loggedIn=false}:{slug:string;initial?:boolean;loggedIn?:boolean}) {
  const router=useRouter();
  const [favorite,setFavorite]=useState(initial),[busy,setBusy]=useState(false),[error,setError]=useState("");
  async function toggle() {
    if(!loggedIn) { router.push(`/login?next=${encodeURIComponent(`/styles/${slug}`)}`); return; }
    setBusy(true);setError("");
    try { const response=await fetch("/api/video-favorites",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug,favorite:!favorite})});const data=await response.json();if(!response.ok) throw new Error(data.error);setFavorite(data.favorite); }
    catch { setError("收藏失败，请重试"); } finally { setBusy(false); }
  }
  return <span className="relative"><button type="button" onClick={toggle} disabled={busy} aria-label={favorite?"取消收藏":"收藏这个风格"} aria-pressed={favorite} className={`flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/60 backdrop-blur ${favorite?"text-accent":"text-white"}`}>{favorite?<Check size={17}/>:<Bookmark size={16}/>}</button>{error && <span role="alert" className="absolute right-0 top-full z-10 mt-2 w-36 rounded bg-raised p-2 text-xs text-danger">{error}</span>}</span>;
}
export function StyleCard({style,index=0,favorite=false,loggedIn=false}:{style:VideoStyle;index?:number;favorite?:boolean;loggedIn?:boolean}) {
  const video=useRef<HTMLVideoElement>(null),[preview,setPreview]=useState(false);
  const motion=()=>!window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function start() { if(motion()){setPreview(true);} }
  function stop() { video.current?.pause();setPreview(false); }
  return <article className="group min-w-0">
    <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-raised">
      <Link href={`/styles/${style.slug}`} aria-label={`查看${style.name}风格`} className="absolute inset-0" onMouseEnter={start} onMouseLeave={stop} onFocus={start} onBlur={stop}>
        <Image src={style.poster} alt={`${style.name}样片：${style.film}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" priority={index<2} className="object-cover transition-transform duration-500 group-hover:scale-[1.025]"/>
        <video ref={video} src={preview?`/api/video-previews/${style.slug}`:undefined} muted loop playsInline preload="none" aria-hidden="true" className={`absolute inset-0 h-full w-full object-cover transition-opacity ${preview?"opacity-100":"opacity-0"}`} onLoadedData={()=>{if(preview)video.current?.play().catch(()=>setPreview(false));}}/>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-4 pt-14"><span className="flex items-center gap-2 text-xs text-white"><Play size={13} fill="currentColor"/>风格样片</span><span className="font-mono text-xs text-white">{duration(style.sampleDuration)}</span></div>
      </Link>
      <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[11px] text-white backdrop-blur">{style.category}</div>
      <div className="absolute right-3 top-3"><FavoriteButton slug={style.slug} initial={favorite} loggedIn={loggedIn}/></div>
    </div>
    <div className="px-0.5 pb-4 pt-4"><Link href={`/styles/${style.slug}`} className="flex items-center justify-between gap-3"><h3 className="text-xl font-medium tracking-tight text-ink group-hover:text-accent">{style.name}</h3><ArrowUpRight size={19} className="text-faint group-hover:text-accent"/></Link>
    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">{style.english}</p>
    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{style.description}</p>
    <div className="mt-4 flex flex-wrap gap-2">{style.uses.map(use=><span key={use} className="rounded border border-line px-2 py-0.5 text-[11px] text-faint">{use}</span>)}</div>
    <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11px] text-faint"><span>由 {style.collectedBy} 精选</span><span>样片 · {style.credit}</span></div></div>
  </article>;
}
export function StyleGallery({styles,favorites=[],loggedIn=false}:{styles:VideoStyle[];favorites?:string[];loggedIn?:boolean}) {
  const [category,setCategory]=useState("全部风格"),[query,setQuery]=useState("");
  const categories=["全部风格",...new Set(styles.map(s=>s.category))];
  const visible=styles.filter(style=>(category==="全部风格"||style.category===category)&&`${style.name} ${style.english} ${style.uses.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <div className="mb-8 flex flex-wrap items-center justify-between gap-5 border-b border-line pb-6">
      <div className="flex max-w-full gap-2 overflow-x-auto pb-1" role="group" aria-label="风格分类">{categories.map(item=><button key={item} type="button" aria-pressed={category===item} onClick={()=>setCategory(item)} className={`min-h-10 shrink-0 rounded-full border px-4 text-xs transition-colors ${category===item?"border-accent bg-accent text-on-accent":"border-line text-muted hover:border-line-strong"}`}>{item}</button>)}</div>
      <label className="flex h-11 w-full items-center gap-2 rounded-lg border border-line bg-raised px-3 sm:w-60"><Search size={16} className="text-faint"/><span className="sr-only">搜索风格或用途</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="搜索风格、灵感、用途" className="min-w-0 flex-1 bg-transparent text-xs outline-none"/></label>
    </div>
    <div aria-live="polite" className="sr-only">找到 {visible.length} 种风格</div>
    {visible.length?<div className="grid gap-x-6 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">{visible.map((style,index)=><StyleCard key={style.slug} style={style} index={index} favorite={favorites.includes(style.slug)} loggedIn={loggedIn}/>)}</div>:<div className="rounded-xl border border-dashed border-line py-16 text-center text-muted">暂时没有匹配的风格，试试其他关键词。</div>}
  </>;
}
