import Link from "next/link";
import { ArrowUpRight, Bookmark } from "lucide-react";
import { Avatar, SparkMark } from "@/components/brand";
import type { Skill } from "@/lib/skills";

export function FeaturedSkill({ skill }: { skill: Skill }) {
  return (
    <Link
      href={`/skills/${skill.slug}`}
      aria-label={`查看精选技能：${skill.name}`}
      className="group relative block overflow-hidden rounded-[3px] bg-dark text-cream transition-shadow duration-300 hover:shadow-[0_35px_80px_-45px_rgba(24,21,16,0.8)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-36 -right-24 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(223,74,40,0.16),transparent_65%)]"
      />
      <div aria-hidden="true" className="rule-grid absolute inset-0 opacity-[0.045]" />
      <SparkMark className="pointer-events-none absolute right-[25%] bottom-[-90px] size-[290px] rotate-12 text-cream/[0.035] transition-transform duration-700 group-hover:rotate-[18deg]" />

      <div className="relative grid gap-8 p-7 sm:p-9 lg:grid-cols-[1.42fr_0.58fr] lg:gap-0 lg:p-11">
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="size-[5px] rounded-full bg-accent" />
              <span className="eyebrow text-accent-soft/85">Featured entry · 本期精选</span>
            </div>
            <span className="font-mono text-[8.5px] tracking-[0.1em] text-cream/30">
              № {String(skill.id).padStart(3, "0")}
            </span>
          </div>

          <div className="mt-9 flex items-center gap-2.5">
            <span
              className="size-[6px] rounded-full"
              style={{ backgroundColor: skill.categoryColor }}
            />
            <span className="eyebrow text-cream/45">
              {skill.categoryEnglish} / {skill.categoryLabel}
            </span>
          </div>

          <h2 className="display-cn mt-3 max-w-[580px] text-[clamp(40px,5vw,62px)] leading-[1.02] text-cream">
            {skill.name}
            <span className="text-accent">.</span>
          </h2>
          <p className="mt-4 max-w-[510px] text-[13px] leading-[1.85] text-cream/55 text-pretty">
            {skill.tagline}
          </p>

          <div className="mt-7 flex flex-wrap gap-1.5">
            {skill.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="tag-pill !h-[23px] !border-cream/15 !px-2.5 !text-[9px] !text-cream/45"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between gap-4 pt-8">
            <div className="flex items-center gap-2.5">
              <Avatar name={skill.author.name} color={skill.author.color} size="sm" />
              <span className="text-[10.5px] text-cream/50">
                由 <span className="text-cream/80">{skill.author.name}</span> 收录
              </span>
            </div>
            <span className="flex items-center gap-1.5 font-mono text-[9px] text-cream/35">
              <Bookmark size={10} strokeWidth={1.8} />
              {skill.bookmarkCount}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between border-t border-cream/15 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-9">
          <div>
            <div className="flex items-center justify-between">
              <span className="eyebrow text-cream/30">Install</span>
              <span className="eyebrow text-cream/30">{skill.version}</span>
            </div>
            <div className="mt-4 border border-cream/12 bg-black/20 px-3.5 py-3">
              <p className="font-mono text-[9.5px] leading-[1.7] break-all text-cream/55">
                <span className="mr-1.5 text-accent">$</span>
                {skill.installCommand ?? "在详情页查看安装方式"}
              </p>
            </div>
            <p className="mt-3 text-[10px] leading-[1.7] text-cream/30">
              完整说明、使用场景与来源，都保存在这份档案里。
            </p>
          </div>

          <div className="mt-7 flex items-center justify-between border-t border-cream/15 pt-4">
            <span className="text-[11px] text-cream/65">翻阅完整档案</span>
            <span className="flex size-9 items-center justify-center rounded-full border border-cream/25 text-cream transition-all duration-200 group-hover:border-accent group-hover:bg-accent group-hover:text-white">
              <ArrowUpRight size={15} strokeWidth={1.7} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
