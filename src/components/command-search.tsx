"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CornerDownLeft,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";

type SearchResult = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
};

export function CommandSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setSelected(0);
  }, []);

  const goToSkill = useCallback(
    (slug: string) => {
      close();
      router.push(`/skills/${slug}`);
    },
    [close, router],
  );

  const goToSearch = useCallback(() => {
    const value = query.trim();
    close();
    router.push(value ? `/library?q=${encodeURIComponent(value)}` : "/library");
  }, [close, query, router]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }

      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if (event.key === "/" && !typing && !open) {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 30);

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();

    if (!trimmed) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search failed");
        const data = (await response.json()) as { results?: SearchResult[] };
        setResults(Array.isArray(data.results) ? data.results : []);
        setSelected(0);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, 170);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const isSearchInput = event.target === inputRef.current;

    if (isSearchInput && event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
    } else if (isSearchInput && event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((current) => Math.max(current - 1, 0));
    } else if (isSearchInput && event.key === "Enter") {
      event.preventDefault();
      if (results[selected]) goToSkill(results[selected].slug);
      else goToSearch();
    } else if (event.key === "Tab") {
      const focusable = overlayRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="搜索技能档案"
        className="group flex h-9 items-center gap-2 rounded-[2px] border border-line bg-raised/40 px-2.5 text-muted transition-colors hover:border-line-strong hover:text-ink sm:px-3"
      >
        <Search size={14} strokeWidth={1.8} />
        <span className="hidden text-[11.5px] sm:inline">搜索</span>
        <kbd className="ml-1 hidden items-center gap-0.5 rounded-[2px] border border-line bg-paper px-1.5 py-0.5 font-mono text-[8.5px] text-faint md:inline-flex">
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>

      {open && (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="搜索技能档案"
          onKeyDown={handleKeyDown}
          className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-dark/45 px-4 pt-[12vh] backdrop-blur-[3px] animate-fade sm:pt-[16vh]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="animate-rise w-full max-w-[600px] overflow-hidden rounded-[3px] border border-line bg-raised shadow-[0_40px_100px_-30px_rgba(18,15,10,0.55)]">
            <div className="flex items-center gap-3 border-b border-line px-5">
              <Search size={17} className="flex-none text-faint" strokeWidth={1.8} />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuery(value);
                  setSelected(0);
                  if (!value.trim()) {
                    setResults([]);
                    setLoading(false);
                  }
                }}
                placeholder="搜索技能、标签或一句话介绍…"
                aria-label="搜索关键词"
                className="h-[58px] min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
              />
              {loading && <LoaderCircle size={14} className="animate-spin text-faint" />}
              <button
                type="button"
                onClick={close}
                aria-label="关闭搜索"
                className="flex size-7 flex-none items-center justify-center rounded-[2px] border border-line text-faint transition-colors hover:text-ink"
              >
                <X size={12} />
              </button>
            </div>

            <div className="max-h-[min(58vh,430px)] overflow-y-auto">
              {query.trim() ? (
                <div className="p-2.5">
                  {results.length > 0 ? (
                    <>
                      <p className="px-2.5 py-2 eyebrow text-faint">搜索结果</p>
                      {results.map((result, index) => (
                        <button
                          key={result.slug}
                          type="button"
                          onClick={() => goToSkill(result.slug)}
                          onMouseEnter={() => setSelected(index)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-[2px] px-2.5 py-3 text-left transition-colors",
                            index === selected ? "bg-sunken/70" : "hover:bg-sunken/50",
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[13.5px] font-medium text-ink">{result.name}</span>
                              <span className="tag-pill !h-[20px] !px-2 !text-[8.5px]">
                                {result.category}
                              </span>
                            </div>
                            <p className="mt-1 line-clamp-1 text-[11.5px] text-muted">
                              {result.tagline}
                            </p>
                          </div>
                          <ArrowUpRight size={14} className="flex-none text-faint" />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={goToSearch}
                        className="mt-1 flex w-full items-center justify-between border-t border-line px-2.5 pt-3 pb-2 text-[11px] text-muted transition-colors hover:text-ink"
                      >
                        查看全部结果
                        <span className="flex items-center gap-1 font-mono text-[9px] text-faint">
                          回车 <CornerDownLeft size={11} />
                        </span>
                      </button>
                    </>
                  ) : (
                    <div className="px-3 py-10 text-center">
                      {loading ? (
                        <p className="text-[12px] text-faint">正在档案中翻找…</p>
                      ) : (
                        <>
                          <p className="font-display text-[24px] text-ink">没有找到这份档案。</p>
                          <p className="mt-2 text-[11.5px] text-muted">
                            换个关键词，或按回车浏览全部收录。
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-5">
                  <p className="eyebrow px-1.5 text-faint">按分类浏览</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {CATEGORIES.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/library?category=${category.slug}`}
                        onClick={close}
                        className="inline-flex items-center gap-2 rounded-[2px] border border-line px-2.5 py-2 text-[11px] text-muted transition-colors hover:border-ink/30 hover:text-ink"
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.label}
                        <span className="font-mono text-[8.5px] text-faint">
                          {category.english}
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-4">
                    <Link
                      href="/library"
                      onClick={close}
                      className="group flex items-center justify-between rounded-[2px] px-2 py-2 text-[11.5px] text-muted transition-colors hover:bg-sunken/50 hover:text-ink"
                    >
                      浏览全部档案
                      <ArrowRight size={12} />
                    </Link>
                    <Link
                      href="/submit"
                      onClick={close}
                      className="group flex items-center justify-between rounded-[2px] px-2 py-2 text-[11.5px] text-muted transition-colors hover:bg-sunken/50 hover:text-ink"
                    >
                      收录一份技能
                      <ArrowRight size={12} />
                    </Link>
                  </div>

                  <p className="mt-4 flex items-center gap-2 px-2 text-[9.5px] text-faint">
                    <span className="flex items-center gap-0.5">
                      <kbd className="rounded-[2px] border border-line px-1 font-mono">↑</kbd>
                      <kbd className="rounded-[2px] border border-line px-1 font-mono">↓</kbd>
                    </span>
                    选择
                    <kbd className="rounded-[2px] border border-line px-1 font-mono">↵</kbd>
                    打开
                    <kbd className="rounded-[2px] border border-line px-1 font-mono">esc</kbd>
                    关闭
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
