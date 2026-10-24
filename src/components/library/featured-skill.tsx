"use client";

import Link from "next/link";
import { useId, useState, type KeyboardEvent } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeaturedSkillItem = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  useCases: string;
  categoryLabel: string;
  categoryColor: string;
  tags: string[];
};

export function FeaturedSkills({ skills }: { skills: FeaturedSkillItem[] }) {
  const [index, setIndex] = useState(0);
  const slideId = useId();
  if (skills.length === 0) return null;

  const activeIndex = index % skills.length;
  const skill = skills[activeIndex];
  const canSwitch = skills.length > 1;

  function move(direction: number) {
    setIndex((current) => (current + direction + skills.length) % skills.length);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!canSwitch || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    }
  }

  return (
    <section aria-label="社区精选" aria-roledescription="轮播" onKeyDown={handleKeyDown}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow flex items-center gap-2 text-accent">
          <Sparkles size={14} aria-hidden="true" />COMMUNITY PICKS / 社区精选
        </p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-faint" aria-hidden="true">
            {String(activeIndex + 1).padStart(2, "0")} / {String(skills.length).padStart(2, "0")}
          </span>
          {canSwitch && <>
            <button type="button" onClick={() => move(-1)} aria-label="上一个精选 Skill" aria-controls={slideId}
              className="flex size-11 items-center justify-center rounded-lg border border-line-strong text-muted transition-colors hover:border-accent hover:text-accent">
              <ChevronLeft size={19} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => move(1)} aria-label="下一个精选 Skill" aria-controls={slideId}
              className="flex size-11 items-center justify-center rounded-lg border border-line-strong text-muted transition-colors hover:border-accent hover:text-accent">
              <ChevronRight size={19} aria-hidden="true" />
            </button>
          </>}
        </div>
      </div>

      <div id={slideId} role="group" aria-roledescription="幻灯片" aria-label={`${activeIndex + 1} / ${skills.length} · ${skill.categoryLabel}`}>
        <Link href={`/skills/${skill.slug}`} aria-label={`查看精选技能：${skill.name}`}
          className="group grid min-h-[290px] min-w-0 overflow-hidden rounded-xl border border-accent/25 bg-raised transition-colors hover:border-accent lg:grid-cols-[1.2fr_0.8fr]">
          <div className="min-w-0 p-6 sm:p-7">
            <p className="flex items-center gap-2 text-sm text-muted">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: skill.categoryColor }} aria-hidden="true" />
              {skill.categoryLabel}
            </p>
            <h2 className="mt-4 break-words text-[26px] font-medium leading-tight tracking-tight text-ink sm:text-[32px]">{skill.name}</h2>
            <p className="mt-3 max-w-[640px] text-base leading-relaxed text-muted">{skill.tagline}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {skill.tags.map((tag) => <span key={tag} className="tag-pill">{tag}</span>)}
            </div>
          </div>
          <div className="flex min-w-0 flex-col justify-between gap-6 border-t border-line bg-accent-soft/20 p-6 sm:p-7 lg:border-l lg:border-t-0">
            <div>
              <p className="text-xs font-medium text-accent">使用场景</p>
              <p className="mt-3 line-clamp-3 whitespace-pre-line text-base leading-relaxed text-muted">
                {skill.useCases.replace(/[#*`>]/g, "").trim() || "查看完整说明，了解这份 Skill 是否适合你的任务。"}
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
              <span className="text-sm text-ink">查看详情与实际案例</span>
              <span className="flex size-10 flex-none items-center justify-center rounded-lg border border-line-strong text-accent transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent">
                <ArrowUpRight size={18} aria-hidden="true" />
              </span>
            </div>
          </div>
        </Link>
      </div>

      {canSwitch && <div className="mt-2 flex flex-wrap justify-center" role="group" aria-label="选择精选领域">
        {skills.map((item, itemIndex) => <button key={item.id} type="button" onClick={() => setIndex(itemIndex)}
          aria-label={`第 ${itemIndex + 1} 项，${item.categoryLabel}：${item.name}`}
          aria-current={itemIndex === activeIndex ? "true" : undefined} aria-controls={slideId}
          title={item.categoryLabel} className="flex size-11 items-center justify-center rounded-lg">
          <span aria-hidden="true" className={cn("h-1.5 rounded-full transition-colors", itemIndex === activeIndex ? "w-5 bg-accent" : "w-1.5 bg-faint")} />
        </button>)}
      </div>}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        精选 {activeIndex + 1} / {skills.length}，{skill.categoryLabel}，{skill.name}
      </p>
    </section>
  );
}
