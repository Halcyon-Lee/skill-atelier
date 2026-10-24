"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, LoaderCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function BookmarkButton({
  slug,
  initialSaved,
  initialCount,
}: {
  slug: string;
  initialSaved: boolean;
  initialCount: number;
}) {
  const { toast } = useToast();
  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);
    const previousSaved = saved;
    const previousCount = count;

    setSaved(!previousSaved);
    setCount(Math.max(0, previousCount + (previousSaved ? -1 : 1)));

    try {
      const response = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      if (!response.ok) throw new Error("Could not save bookmark");
      const data = (await response.json()) as { saved: boolean; count: number };
      setSaved(Boolean(data.saved));
      setCount(Number(data.count));
      toast(data.saved ? "已收入你的收藏夹。" : "已从收藏夹移除。");
    } catch {
      setSaved(previousSaved);
      setCount(previousCount);
      toast("操作没有完成，请稍后再试。", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      className={cn(
        "flex h-11 w-full items-center justify-center gap-2 rounded-[2px] border text-[12px] font-medium transition-colors",
        saved
          ? "border-ink bg-ink text-cream hover:bg-accent hover:border-accent"
          : "border-line-strong bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-cream",
      )}
    >
      {pending ? (
        <LoaderCircle size={14} className="animate-spin" />
      ) : saved ? (
        <BookmarkCheck size={14} strokeWidth={1.9} />
      ) : (
        <Bookmark size={14} strokeWidth={1.9} />
      )}
      {saved ? "已收藏" : "收藏这份档案"}
      <span className={cn("font-mono text-[9px]", saved ? "text-cream/45" : "text-faint")}>
        {count}
      </span>
    </button>
  );
}
