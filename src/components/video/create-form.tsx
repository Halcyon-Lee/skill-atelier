"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, ChevronDown, LoaderCircle, LockKeyhole, Sparkles, Wand2 } from "lucide-react";
import type { VideoRuntime,VideoStyle } from "@/lib/video/types";
import type { ActiveJob } from "@/lib/video/server";
import { useVideoDraft } from "./use-draft";
import { GenerationOptions } from "./generation-options";
import { DEFAULT_VIDEO_OPTIONS, optionLabel, parseVideoOptions } from "@/lib/video/options";
import { getStyleExamples, type StyleExample } from "@/lib/video/examples";
export function CreateVideoForm({style,loggedIn,initialRuntime,initialActiveJob}:{style:VideoStyle;loggedIn:boolean;initialRuntime:VideoRuntime;initialActiveJob:ActiveJob|null}) {
  const router=useRouter(),[pending,setPending]=useState(false),[error,setError]=useState("");
  const [script,setScript]=useVideoDraft(`atelier-video-draft:${style.slug}`);
  const [storedOptions,saveOptions]=useVideoDraft(`atelier-video-options:${style.slug}`);
  const options=useMemo(()=>{
    try { return parseVideoOptions(storedOptions?JSON.parse(storedOptions):undefined); }
    catch { return {...DEFAULT_VIDEO_OPTIONS}; }
  },[storedOptions]);
  const [runtime,setRuntime]=useState(initialRuntime),[activeJob,setActiveJob]=useState(initialActiveJob),key=useRef("");
  function refresh(signal?:AbortSignal){return fetch("/api/video-jobs",{signal}).then(response=>response.json()).then(data=>{if(data.runtime)setRuntime(data.runtime);if("activeJob" in data)setActiveJob(data.activeJob);}).catch(()=>{});}
  useEffect(()=>{if(!loggedIn || !style.renderer)return;const controller=new AbortController();const timer=setInterval(()=>refresh(controller.signal),10000);return()=>{clearInterval(timer);controller.abort();};},[loggedIn,style.renderer]);
  const examples=getStyleExamples(style.slug);
  function applyExample(example:StyleExample){setScript(example.script);saveOptions(JSON.stringify({...options,...example.options}));key.current=crypto.randomUUID();}
  const available=!!style.renderer && runtime.ready && runtime.renderers.includes(style.renderer);
  async function submit(event:React.FormEvent) {
    event.preventDefault();if(!loggedIn){router.push(`/login?next=${encodeURIComponent(`/styles/${style.slug}`)}`);return;}
    setPending(true);setError("");
    try {const response=await fetch("/api/video-jobs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({styleSlug:style.slug,script,options,idempotencyKey:(key.current ||= crypto.randomUUID())})});const data=await response.json();if(!response.ok)throw new Error(data.error||"暂时无法提交，请稍后重试。");router.push(`/works/${data.job.id}`);}
    catch(error){setError(error instanceof Error?error.message:"提交失败，请稍后重试。");setPending(false);refresh();}
  }
  return <form onSubmit={submit} className="rounded-2xl border border-line bg-raised p-5 sm:p-7">
    <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-medium"><Sparkles size={18} className="text-accent"/>写下你的故事</h2><span className="rounded-full border border-line px-2 py-1 text-[10px] text-faint">{style.renderer?"首批创作风格":"风格预览"}</span></div>
    <p className="mt-3 text-sm leading-relaxed text-muted">描述你想讲的内容、重要画面和结尾，内容会按设置的时长编排。</p>
    {examples.length>0&&<div className="mt-5"><p className="flex items-center gap-1.5 text-xs font-medium text-ink"><Wand2 size={13} className="text-accent"/>做同款：从一个示例开始，再改成你的内容</p><div className="mt-2 grid gap-2">{examples.map(example=><button key={example.title} type="button" onClick={()=>applyExample(example)} aria-pressed={script===example.script} className={`rounded-lg border px-3 py-2.5 text-left transition-colors hover:border-accent ${script===example.script?"border-accent bg-accent/5":"border-line bg-paper"}`}><span className="block text-sm text-ink">{example.title}</span><span className="mt-0.5 block text-[11px] text-faint">{example.hint}</span></button>)}</div></div>}
    <label htmlFor="video-script" className="mt-6 block text-xs font-medium text-ink">视频脚本</label>
    <textarea id="video-script" value={script} onChange={event=>{setScript(event.target.value);key.current=crypto.randomUUID();}} minLength={10} maxLength={2000} required rows={7} placeholder={`例如：介绍一个帮团队整理灵感的工具。开头是散乱的便签，接着想法被逐一归类，最后组成一个清晰的计划。整体采用${style.name}风格，结尾出现「让好想法，各就其位」。`} className="mt-2 w-full resize-y rounded-xl border border-line bg-paper p-4 text-sm leading-[1.9] text-ink placeholder:text-faint/70 focus:border-accent focus:outline-none" aria-describedby="script-help"/>
    <div id="script-help" className="mt-2 flex items-center justify-between gap-3 text-[11px] text-faint"><span>{script?<><Check size={11} className="mr-1 inline"/>脚本与设置保存在此浏览器</>:"10–2000 字"}</span><span>{script.length} / 2000</span></div>
    <details className="group my-6 rounded-xl border border-line bg-paper/40"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs [&::-webkit-details-marker]:hidden"><span className="font-medium text-ink">生成设置</span><span className="flex items-center gap-2 text-faint">{optionLabel("aspectRatio",options)} · {options.resolution} · {options.duration} 秒 · {optionLabel("pace",options)}<ChevronDown size={14} className="transition-transform group-open:rotate-180"/></span></summary><div className="px-4 pb-1"><GenerationOptions value={options} onChange={value=>{saveOptions(JSON.stringify(value));key.current=crypto.randomUUID();}}/></div></details>
    {activeJob&&<p className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs leading-relaxed text-muted">「{activeJob.title}」正在制作，完成后才能提交新的影片。<Link href={`/works/${activeJob.id}`} className="ml-1 text-accent underline underline-offset-4">查看进度</Link></p>}
    {error&&<p role="alert" className="mb-4 rounded-lg bg-danger-soft p-3 text-xs leading-relaxed text-danger">{error}</p>}
    {!available&&<p className="mb-4 text-xs leading-relaxed text-muted">{style.renderer?runtime.message:"这个风格的制作流程正在准备中。可以先看样片、保存脚本，或收藏后再来。"}</p>}
    <button disabled={pending || (loggedIn&&(!available||!!activeJob))} className="btn btn-primary w-full !h-12">{pending?<><LoaderCircle size={16} className="animate-spin"/>正在提交</>:!loggedIn?<><LockKeyhole size={15}/>登录并继续创作</>:available?<>生成我的影片<ArrowUpRight size={17}/></>:"生成接入中"}</button>
    {!loggedIn&&<p className="mt-3 text-center text-[11px] text-faint">登录后将回到这里，脚本会保留。</p>}
    <p className="mt-4 text-center text-[11px] leading-relaxed text-faint">提交后直接打开任务页，在那里查看进度和成片；记得保存任务页的链接。</p>
  </form>;
}
