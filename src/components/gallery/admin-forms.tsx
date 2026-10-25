"use client";
import { startTransition, useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, Trash2, Upload } from "lucide-react";
import { saveSettingsAction, saveVideoAction, type GalleryActionState } from "@/actions/gallery";
import { ASPECT_RATIOS, VIDEO_STATUSES } from "@/lib/gallery/shared";
import type { AdminVideo, SiteSettings } from "@/lib/gallery/model";

const STATUS_LABELS: Record<(typeof VIDEO_STATUSES)[number], string> = { draft: "草稿", published: "已发布", hidden: "已隐藏" };

function Field({ label, hint, children, wide }: { label: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`block ${wide ? "sm:col-span-2" : ""}`}><span className="field-label">{label}</span>{children}{hint && <span className="field-hint mt-1.5 block">{hint}</span>}</label>;
}
function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return <fieldset className="rounded-xl border border-line bg-raised p-5 sm:p-6"><legend className="px-1 text-sm font-medium">{title}</legend>{note && <p className="mb-4 text-xs leading-relaxed text-faint">{note}</p>}<div className="grid gap-4 sm:grid-cols-2">{children}</div></fieldset>;
}
// Submit manually: a plain form action would reset every field, losing input when validation fails.
function submitWith(action: (form: FormData) => void) {
  return (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); startTransition(() => action(form)); };
}
const METHOD_PRESETS = ["代码生成", "ComfyUI + 视频模型", "视频模型直出", "图生视频", "数字人口播", "素材剪辑合成"];
/** Method tags: click the common ones or type your own, separated by commas. */
function MethodPicker({ defaultValue }: { defaultValue: string[] }) {
  const [value, setValue] = useState(defaultValue.join("，"));
  const current = value.split(/[,，]/).map(t => t.trim()).filter(Boolean);
  const toggle = (tag: string) => setValue((current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag]).join("，"));
  return <div className="sm:col-span-2">
    <span className="field-label">实现方式标签</span>
    <div className="mb-2 flex flex-wrap gap-2">{METHOD_PRESETS.map(tag => <button key={tag} type="button" aria-pressed={current.includes(tag)} onClick={() => toggle(tag)}
      className={`min-h-9 rounded-full border px-3 text-xs transition-colors ${current.includes(tag) ? "border-accent bg-accent text-on-accent" : "border-line text-muted hover:border-line-strong"}`}>{tag}</button>)}</div>
    <input name="method_tags" value={value} onChange={event => setValue(event.target.value)} className="field" placeholder="也可以自己输入，用逗号分隔" />
  </div>;
}
function Status({ state }: { state: GalleryActionState }) {
  if (state.error) return <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{state.error}</p>;
  if (state.saved) return <p role="status" className="flex items-center gap-2 text-sm text-accent"><CheckCircle2 size={15} />已保存</p>;
  return null;
}

export function VideoForm({ video }: { video?: AdminVideo }) {
  const [state, action, pending] = useActionState(saveVideoAction, {});
  const v = video;
  return <form onSubmit={submitWith(action)} className="space-y-6">
    {v && <input type="hidden" name="id" value={v.id} />}
    <Section title="基本信息">
      <Field label="标题" wide><input name="title" required maxLength={60} defaultValue={v?.title} className="field" /></Field>
      <Field label="简介" hint="一两句话：为谁做的、解决了什么。" wide><textarea name="summary" maxLength={300} rows={3} defaultValue={v?.summary} className="field !h-auto py-3" /></Field>
      <Field label="分类" hint="行业或用途，如本地生活、知识口播。"><input name="category" maxLength={20} defaultValue={v?.category} className="field" /></Field>
      <Field label="标签" hint="用逗号分隔，最多 8 个。"><input name="tags" defaultValue={v?.tags.join("，")} className="field" /></Field>
      <Field label="画幅"><select name="aspect_ratio" defaultValue={v?.aspect_ratio ?? "9:16"} className="field">{ASPECT_RATIOS.map(r => <option key={r}>{r}</option>)}</select></Field>
      <Field label="链接名" hint={v ? `访问地址 /v/${v.slug}` : "留空则使用编号，如 v012。"}><input name="slug" maxLength={60} defaultValue={v?.slug} pattern="[a-z0-9][a-z0-9\-]*" className="field" /></Field>
      <Field label="封面" hint={v?.poster_path ? "已上传；选择新图片会替换。" : "PNG / JPEG / WebP，发布前必须上传。"}><input key={`poster-${state.saved}`} type="file" name="poster" accept="image/png,image/jpeg,image/webp" className="field pt-2.5" /></Field>
      <Field label="时长（秒）" hint="上传成片时会自动读取。"><input name="duration_seconds" type="number" min={0} step="0.1" defaultValue={v?.duration_seconds ?? ""} className="field" /></Field>
    </Section>

    <Section title="抖音数据" note="只填抖音后台能查到的真实数字，查不到的留空，不要填 0。填写任一数据都必须注明截止日期。">
      <Field label="抖音视频链接" wide><input name="douyin_url" type="url" defaultValue={v?.douyin_url ?? ""} placeholder="https://www.douyin.com/video/..." className="field" /></Field>
      <Field label="播放"><input name="plays" inputMode="numeric" defaultValue={v?.plays ?? ""} className="field" /></Field>
      <Field label="点赞"><input name="likes" inputMode="numeric" defaultValue={v?.likes ?? ""} className="field" /></Field>
      <Field label="评论"><input name="comments" inputMode="numeric" defaultValue={v?.comments ?? ""} className="field" /></Field>
      <Field label="分享"><input name="shares" inputMode="numeric" defaultValue={v?.shares ?? ""} className="field" /></Field>
      <Field label="数据截止日期"><input name="metrics_as_of" type="date" defaultValue={v?.metrics_as_of ?? ""} className="field" /></Field>
      <Field label="数据截图（仅内部留存）" hint={v?.metrics_proof_path ? "已上传；选择新图片会替换。" : "抖音后台截图，不会公开。"}><input key={`proof-${state.saved}`} type="file" name="proof" accept="image/png,image/jpeg,image/webp" className="field pt-2.5" /></Field>
      {v?.metrics_proof_path && <a href={`/api/gallery/${v.id}/proof`} target="_blank" rel="noreferrer" className="text-xs text-muted underline underline-offset-4 hover:text-accent">查看已上传的数据截图</a>}
    </Section>

    <Section title="实现方式（会员可见）" note="详情页右侧展示给访客：这条视频是怎么做出来的、做一条要多久、需要客户准备什么。">
      <MethodPicker defaultValue={v?.method_tags ?? []} />
      <Field label="实现方式说明" hint="用平实的话写，例如「AI 编写代码逐帧绘制画面，再合成配乐」。" wide><textarea name="technique_hint" maxLength={300} rows={3} defaultValue={v?.technique_hint} className="field !h-auto py-3" /></Field>
      <Field label="制作时长（分钟）" hint="做出这条视频实际花的时间。"><input name="production_minutes" type="number" min={0} defaultValue={v?.production_minutes ?? ""} className="field" /></Field>
      <Field label="适用场景"><input name="scenarios" maxLength={300} defaultValue={v?.scenarios} placeholder="如：产品发布、品牌短片" className="field" /></Field>
      <Field label="制作条件" hint="需要客户提供什么、大概的周期等。" wide><textarea name="conditions" maxLength={500} rows={3} defaultValue={v?.conditions} className="field !h-auto py-3" /></Field>
    </Section>

    <Section title="署名（转载作品必填）" note="团队自己做的视频留空。转载他人作品时按原授权署名，例如 CC BY 4.0 要求写明作者、链接原作，并说明是否改动过。">
      <Field label="原作者"><input name="credit_name" maxLength={60} defaultValue={v?.credit_name} className="field" /></Field>
      <Field label="授权"><input name="license" maxLength={40} defaultValue={v?.license} placeholder="CC BY 4.0" className="field" /></Field>
      <Field label="原作链接" wide><input name="credit_url" type="url" defaultValue={v?.credit_url ?? ""} className="field" /></Field>
      <Field label="素材来源链接" hint="第三方素材的授权说明，如原作的 CREDITS 文件。" wide><input name="credits_url" type="url" defaultValue={v?.credits_url ?? ""} className="field" /></Field>
    </Section>

    <Section title="内部记录（不会公开）" note="真实用到的 skill，咨询时用。这里的内容不会出现在任何页面或接口里。">
      <Field label="用了几个 skill"><input name="skill_count" type="number" min={0} max={50} defaultValue={v?.skill_count ?? 0} className="field" /></Field>
      <Field label="用到的 skill 及说明" wide><textarea name="skills_used" maxLength={4000} rows={5} defaultValue={v?.skills_used} className="field !h-auto py-3 font-mono text-xs" /></Field>
    </Section>

    <Section title="发布">
      <Field label="状态"><select name="status" defaultValue={v?.status ?? "draft"} className="field">{VIDEO_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></Field>
      <Field label="排序权重" hint="数字越大越靠前；精选始终在最前。"><input name="sort_order" type="number" min={-1000} max={1000} defaultValue={v?.sort_order ?? 0} className="field" /></Field>
      <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" name="featured" defaultChecked={v?.featured} className="size-4 accent-[var(--color-accent)]" />精选</label>
      <label className="flex items-start gap-2.5 text-sm sm:col-span-2"><input type="checkbox" name="display_authorized" defaultChecked={v?.display_authorized} className="mt-0.5 size-4 accent-[var(--color-accent)]" /><span>已获得展示授权<span className="mt-1 block text-xs text-faint">视频里的客户品牌、真人出镜都已同意在本站公开展示。未勾选不能发布。</span></span></label>
    </Section>

    <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-4 border-t border-line bg-paper/95 px-1 py-4 backdrop-blur">
      <button disabled={pending} className="btn btn-primary">{pending && <LoaderCircle size={15} className="animate-spin" />}{v ? "保存" : "创建草稿"}</button>
      <Status state={state} />
    </div>
  </form>;
}

/** Streams the MP4 to the admin upload route with progress; the duration is read in the browser. */
export function FilmUploader({ id, hasFilm }: { id: string; hasFilm: boolean }) {
  const router = useRouter(), input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null), [error, setError] = useState(""), [done, setDone] = useState(false);
  async function readDuration(file: File) {
    return new Promise<number>(resolve => {
      const url = URL.createObjectURL(file), probe = document.createElement("video");
      probe.preload = "metadata";
      probe.onloadedmetadata = () => { resolve(probe.duration); URL.revokeObjectURL(url); };
      probe.onerror = () => { resolve(NaN); URL.revokeObjectURL(url); };
      probe.src = url;
    });
  }
  async function upload(file: File) {
    setError(""); setDone(false); setProgress(0);
    const duration = await readDuration(file);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/api/admin/gallery/${id}/film`);
    xhr.setRequestHeader("Content-Type", "video/mp4");
    if (Number.isFinite(duration)) xhr.setRequestHeader("X-Video-Duration", String(duration));
    xhr.upload.onprogress = event => { if (event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => {
      setProgress(null);
      if (xhr.status >= 200 && xhr.status < 300) { setDone(true); router.refresh(); }
      else { try { setError(JSON.parse(xhr.responseText).error); } catch { setError("上传失败，请重试。"); } }
    };
    xhr.onerror = () => { setProgress(null); setError("网络中断，上传没有完成。"); };
    xhr.send(file);
  }
  return <div className="rounded-xl border border-line bg-raised p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-sm font-medium">成片</h2><p className="mt-1 text-xs text-faint">{hasFilm ? "已上传；重新上传会替换。" : "MP4，不超过 500 MiB。发布前必须上传。"}</p></div>
      <input ref={input} type="file" accept="video/mp4" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) upload(file); event.target.value = ""; }} />
      <button type="button" disabled={progress !== null} onClick={() => input.current?.click()} className="btn btn-outline btn-sm">
        {progress !== null ? <><LoaderCircle size={14} className="animate-spin" />{progress}%</> : <><Upload size={14} />{hasFilm ? "替换成片" : "上传成片"}</>}
      </button>
    </div>
    {progress !== null && <div className="mt-4 h-1 overflow-hidden rounded-full bg-sunken"><div className="h-full bg-accent transition-[width]" style={{ width: `${progress}%` }} /></div>}
    {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
    {done && <p role="status" className="mt-3 flex items-center gap-2 text-sm text-accent"><CheckCircle2 size={15} />上传完成</p>}
  </div>;
}

export function DeleteVideoButton() {
  return <button onClick={event => { if (!confirm("删除后成片、封面和数据截图都会一并删除，不能恢复。确定删除吗？")) event.preventDefault(); }} className="btn btn-danger btn-sm"><Trash2 size={14} />删除这条视频</button>;
}

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState(saveSettingsAction, {});
  return <form onSubmit={submitWith(action)} className="space-y-6">
    <Section title="咨询入口" note="全站共用一个微信二维码：显示在每条视频详情页的右侧，页头的「联系我们」也会弹出它。">
      <Field label="微信二维码" hint={settings.wechat_qr_path ? "已上传；选择新图片会替换。" : "PNG / JPEG / WebP。"} wide><input key={`qr-${state.saved}`} type="file" name="wechat_qr" accept="image/png,image/jpeg,image/webp" className="field pt-2.5" /></Field>
      {settings.wechat_qr_path && <div className="flex items-center gap-4 sm:col-span-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of our own upload */}
        <img src={`/api/gallery/qr?v=${settings.wechat_qr_path.replace(/\W/g, "").slice(-8)}`} alt="当前二维码" className="size-28 rounded-lg bg-white object-contain p-1.5" />
        <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" name="remove_qr" className="size-4" />移除二维码</label>
      </div>}
      <Field label="微信号" hint="电脑端访客可以直接复制。"><input name="wechat_id" maxLength={40} defaultValue={settings.wechat_id} className="field" /></Field>
      <Field label="弹窗标题"><input name="consult_headline" maxLength={40} defaultValue={settings.consult_headline} className="field" /></Field>
    </Section>
    <div className="flex items-center gap-4"><button disabled={pending} className="btn btn-primary">{pending && <LoaderCircle size={15} className="animate-spin" />}保存设置</button><Status state={state} /></div>
  </form>;
}
