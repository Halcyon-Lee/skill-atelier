import Link from "next/link";
import { ArrowUpRight, Bookmark, Layers3 } from "lucide-react";
import { Avatar } from "@/components/brand";
import type { Skill } from "@/lib/skills";

export function SkillCard({ skill }: { skill: Skill }) {
  const visibleTags = skill.tags.slice(0, 3);
  const remaining = skill.tags.length - visibleTags.length;
  return (
    <Link href={`/skills/${skill.slug}`} className="paper-card group flex min-w-0 flex-col p-6">
      <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs font-medium text-muted"><span className="size-1.5 rounded-full" style={{ backgroundColor: skill.categoryColor }} />{skill.categoryLabel}<span className="text-faint">/ {skill.categoryEnglish}</span></span><Layers3 size={17} className="flex-none text-faint" /></div>
      <h3 className="mt-6 break-words text-[25px] font-medium leading-[1.25] tracking-tight text-ink transition-colors group-hover:text-accent">{skill.name}</h3>
      <p className="mt-3 line-clamp-3 text-base leading-[1.75] text-muted">{skill.tagline}</p>
      <div className="mt-5 border-l-2 border-accent/40 pl-3"><p className="text-xs font-medium text-accent">适用场景</p><p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{skill.useCases ? skill.useCases.replace(/[#*`>]/g, "") : "作者尚未补充，查看完整说明了解更多。"}</p></div>
      <div className="mt-auto pt-6">
        <div className="flex flex-wrap gap-2">{visibleTags.map((tag) => <span key={tag} className="tag-pill">{tag}</span>)}{remaining > 0 && <span className="tag-pill" title={skill.tags.slice(3).join("、")}>另有 {remaining} 个<span className="sr-only">标签：{skill.tags.slice(3).join("、")}，打开详情查看</span></span>}</div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4"><div className="flex min-w-0 items-center gap-2"><Avatar name={skill.author.name} color={skill.author.color} size="sm" /><span className="truncate text-xs text-muted">{skill.author.name}</span></div><div className="flex items-center gap-4"><span className="flex items-center gap-1.5 text-xs text-faint"><Bookmark size={13} />{skill.bookmarkCount}</span><ArrowUpRight size={19} className="text-faint transition-colors group-hover:text-accent" /></div></div>
      </div>
    </Link>
  );
}
