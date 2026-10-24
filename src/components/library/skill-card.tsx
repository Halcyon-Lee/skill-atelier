import Link from "next/link";
import { ArrowUpRight, Bookmark } from "lucide-react";
import { Avatar } from "@/components/brand";
import type { Skill } from "@/lib/skills";

export function SkillCard({ skill }: { skill: Skill }) {
  const visibleTags = skill.tags.slice(0, 3);
  const remaining = skill.tags.length - visibleTags.length;

  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="paper-card group relative flex min-h-[286px] flex-col overflow-hidden p-6"
    >
      <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-accent transition-[width] duration-300 ease-out group-hover:w-full" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="size-[6px] flex-none rounded-full"
            style={{ backgroundColor: skill.categoryColor }}
          />
          <span className="eyebrow truncate text-muted">{skill.categoryEnglish}</span>
        </div>
        <span className="flex-none font-mono text-[8.5px] tracking-[0.08em] text-faint">
          № {String(skill.id).padStart(3, "0")}
        </span>
      </div>

      <h3 className="display-cn mt-7 text-[28px] leading-[1.12] text-ink transition-colors duration-200 group-hover:text-accent-deep">
        {skill.name}
      </h3>
      <p className="mt-3 line-clamp-3 text-[12.5px] leading-[1.8] text-muted text-pretty">
        {skill.tagline}
      </p>

      <div className="mt-auto pt-6">
        <div className="flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <span key={tag} className="tag-pill !h-[22px] !px-2 !text-[9px]">
              {tag}
            </span>
          ))}
          {remaining > 0 && (
            <span className="tag-pill !h-[22px] !border-transparent !px-1 !text-[9px]">
              +{remaining}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-3.5">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar name={skill.author.name} color={skill.author.color} size="sm" />
            <span className="truncate text-[10.5px] text-muted">{skill.author.name}</span>
          </div>
          <div className="flex flex-none items-center gap-3">
            <span className="flex items-center gap-1 font-mono text-[9px] text-faint">
              <Bookmark size={10} strokeWidth={1.8} />
              {skill.bookmarkCount}
            </span>
            <span className="flex size-7 items-center justify-center rounded-full border border-line text-muted transition-all duration-200 group-hover:border-ink group-hover:bg-ink group-hover:text-cream">
              <ArrowUpRight size={12} strokeWidth={1.8} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
