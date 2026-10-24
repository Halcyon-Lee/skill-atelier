"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { MAX_SCREENSHOTS, MAX_SCREENSHOT_BYTES, SCREENSHOT_TYPES, type SkillScreenshot } from "@/lib/showcase-rules";

export type ScreenshotUpload = { file: File; preview: string; key: string };

export function ScreenshotPicker({ existing, onExistingChange, uploads, onUploadsChange, error, disabled }: {
  existing: SkillScreenshot[];
  onExistingChange: (images: SkillScreenshot[]) => void;
  uploads: ScreenshotUpload[];
  onUploadsChange: (images: ScreenshotUpload[]) => void;
  error?: string;
  disabled: boolean;
}) {
  const [localError, setLocalError] = useState("");
  const urls = useRef(new Set<string>());
  useEffect(() => {
    const allocated = urls.current;
    return () => { for (const url of allocated) URL.revokeObjectURL(url); };
  }, []);
  const total = existing.length + uploads.length;
  return (
    <div>
      <label htmlFor="skill-screenshots" className="field-label">
        <span>效果截图 · 可选</span><span>{total}/{MAX_SCREENSHOTS}</span>
      </label>
      {existing.map((image) => <input key={image.id} type="hidden" name="screenshotIds" value={image.id} />)}
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          ...existing.map((image) => ({ key: String(image.id), url: image.url, remove: () => onExistingChange(existing.filter((item) => item.id !== image.id)) })),
          ...uploads.map((image) => ({ key: image.key, url: image.preview, remove: () => {
            URL.revokeObjectURL(image.preview);
            urls.current.delete(image.preview);
            onUploadsChange(uploads.filter((item) => item.key !== image.key));
          } })),
        ].map((image, index) => (
          <div key={image.key} className="relative overflow-hidden border border-line bg-sunken/30">
            <Image unoptimized src={image.url} alt={`效果截图 ${index + 1} 预览`} width={400} height={280} className="aspect-[10/7] w-full object-contain" />
            <button type="button" disabled={disabled} onClick={() => { image.remove(); setLocalError(""); }} aria-label={`移除截图 ${index + 1}`} className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full border border-line bg-paper text-ink disabled:opacity-50">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 border border-dashed border-line-strong p-4">
        <ImagePlus size={20} className="flex-none text-faint" />
        <input id="skill-screenshots" type="file" multiple accept={SCREENSHOT_TYPES.join(",")} disabled={disabled || total >= MAX_SCREENSHOTS}
          aria-describedby="screenshots-hint screenshots-error" aria-invalid={Boolean(localError || error) || undefined}
          className="min-w-0 w-full text-[12px] text-muted file:mr-3 file:border-0 file:bg-sunken file:px-3 file:py-2 file:text-ink disabled:opacity-50"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (total + files.length > MAX_SCREENSHOTS) { setLocalError("最多添加 3 张截图，请减少选择数量。"); return; }
            if (files.some((file) => !SCREENSHOT_TYPES.includes(file.type) || !file.size || file.size > MAX_SCREENSHOT_BYTES)) {
              setLocalError("请选择不超过 5 MiB 的 PNG、JPEG 或 WebP 图片。"); return;
            }
            const selected = files.map((file) => {
              const preview = URL.createObjectURL(file);
              urls.current.add(preview);
              return { file, preview, key: crypto.randomUUID() };
            });
            onUploadsChange([...uploads, ...selected]);
            setLocalError("");
          }} />
      </div>
      <p id="screenshots-hint" className="field-hint">最多 3 张，每张不超过 5 MiB。支持 PNG、JPEG、WebP；可展示生成结果或使用前后的变化。</p>
      <p id="screenshots-error" role={localError || error ? "alert" : undefined} className="field-error">{localError || error}</p>
    </div>
  );
}
