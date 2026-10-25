"use client";
import { useEffect, useRef } from "react";
import { MessageCircle, X } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

export type ConsultSettings = { hasQr: boolean; qrVersion: string; wechatId: string; headline: string };

function Qr({ settings, size }: { settings: ConsultSettings; size: number }) {
  return settings.hasQr
    // eslint-disable-next-line @next/next/no-img-element -- served from our own route, no optimization needed
    ? <img src={`/api/gallery/qr?v=${settings.qrVersion}`} alt="微信二维码" width={size} height={size} className="rounded-xl bg-white object-contain p-2" style={{ width: size, height: size }} />
    : <div className="flex items-center justify-center rounded-xl border border-dashed border-line text-xs text-faint" style={{ width: size, height: size }}>二维码即将上线</div>;
}

function WechatId({ id }: { id: string }) {
  if (!id) return null;
  return <div className="flex items-center gap-2 text-xs text-muted">微信号 <span className="font-mono text-ink">{id}</span><CopyButton text={id} label="复制" toastMessage="微信号已复制。" /></div>;
}

/** Header button: opens the WeChat QR in a dialog. */
export function ConsultButton({ settings, label = "联系我们", className }: { settings: ConsultSettings; label?: string; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" onClick={() => dialog.current?.showModal()} className={cn("btn btn-primary", className)}><MessageCircle size={16} />{label}</button>
    <dialog ref={dialog} onClick={event => { if (event.target === dialog.current) dialog.current?.close(); }}
      className="m-auto w-[min(92vw,380px)] rounded-2xl border border-line bg-raised p-0 text-ink backdrop:bg-black/70 backdrop:backdrop-blur-sm" aria-labelledby="consult-title">
      <div className="relative flex flex-col items-center px-6 pb-7 pt-8 text-center">
        <button type="button" onClick={() => dialog.current?.close()} aria-label="关闭" className="absolute right-3 top-3 flex size-10 items-center justify-center text-faint hover:text-ink"><X size={18} /></button>
        <h2 id="consult-title" className="text-lg font-medium">{settings.headline}</h2>
        <p className="mt-2 text-sm text-muted">扫码添加微信，说说你想做什么样的视频。</p>
        <div className="mt-6"><Qr settings={settings} size={220} /></div>
        <div className="mt-4"><WechatId id={settings.wechatId} /></div>
      </div>
    </dialog>
  </>;
}

/** Block on a video page: shows the QR in place and counts the view so the team can see which videos bring in enquiries. */
export function ConsultCard({ settings, video }: { settings: ConsultSettings; video: { id: string; code: string } }) {
  const card = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = card.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      fetch(`/api/gallery/${video.id}/consult`, { method: "POST" }).catch(() => {});
    }, { threshold: 0.6 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [video.id]);
  return <section ref={card} aria-label="咨询" className="rounded-xl border border-line bg-raised p-5">
    <h2 className="text-sm font-medium">想了解更多，或者做同类视频？</h2>
    <p className="mt-1.5 text-xs leading-relaxed text-muted">扫码添加微信，我们会告诉你具体怎么做、费用和周期。</p>
    <div className="mt-4 flex flex-wrap items-center gap-5">
      <Qr settings={settings} size={148} />
      <div className="min-w-0 flex-1 space-y-3 text-xs leading-relaxed text-muted">
        <p>添加时请告知编号 <strong className="rounded bg-accent-soft px-1.5 py-0.5 font-mono text-sm text-accent">{video.code}</strong>，方便我们直接聊这条视频。</p>
        <WechatId id={settings.wechatId} />
      </div>
    </div>
  </section>;
}
