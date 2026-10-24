"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function CopyButton({
  text,
  getText,
  label = "复制",
  copiedLabel = "已复制",
  toastMessage = "已复制到剪贴板。",
  className,
  iconOnly = false,
}: {
  text?: string;
  getText?: () => string;
  label?: string;
  copiedLabel?: string;
  toastMessage?: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function handleCopy() {
    try {
      const value = getText ? getText() : text;
      if (!value) throw new Error("Nothing to copy");
      await copyToClipboard(value);
      setCopied(true);
      toast(toastMessage);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      toast("复制失败，请手动选择文本复制。", "error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? copiedLabel : label}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 text-[11px] transition-colors",
        className,
      )}
    >
      {copied ? <Check size={12} strokeWidth={2.2} /> : <Copy size={12} strokeWidth={1.8} />}
      {!iconOnly && <span>{copied ? copiedLabel : label}</span>}
    </button>
  );
}
