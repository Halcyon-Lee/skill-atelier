import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { SparkMark } from "@/components/brand";
import { SkillCard } from "@/components/library/skill-card";
import { requireUser } from "@/lib/auth";
import { getBookmarkedSkills } from "@/lib/skills";

export const metadata: Metadata = {
  title: "收藏夹",
};

export default async function SavedPage() {
  const user = await requireUser();
  const skills = getBookmarkedSkills(user.id);

  return (
    <div className="shell">
      <div className="flex h-[58px] items-center justify-between border-b border-line">
        <Link
          href="/library"
          className="flex items-center gap-1.5 text-[12px] text-faint transition-colors hover:text-ink"
        >
          <ArrowLeft size={12} />
          返回档案馆
        </Link>
        <span className="eyebrow text-faint">Private shortlist</span>
      </div>

      <header className="flex flex-col gap-8 border-b border-line py-12 sm:flex-row sm:items-end sm:justify-between lg:py-14">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-accent" />
            <span className="eyebrow text-muted">Saved · 你的收藏</span>
          </div>
          <h1 className="display-cn mt-5 text-[clamp(48px,6.2vw,80px)] leading-[0.98]">
            留给以后<span className="text-accent">。</span>
          </h1>
          <p className="mt-5 max-w-[500px] text-[14px] leading-[1.9] text-muted">
            被你亲手留下的工具，会在这里安静地排队。等下一次需要它们的时候再来翻阅。
          </p>
        </div>

        <div className="flex items-end gap-8">
          <div>
            <p className="font-display text-[52px] leading-none text-ink">
              {String(skills.length).padStart(2, "0")}
            </p>
            <p className="mt-2 eyebrow text-faint">份收藏</p>
          </div>
          <Link href="/library" className="btn btn-outline btn-sm mb-1">
            继续浏览
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </header>

      <section className="py-10">
        {skills.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden border border-dashed border-line-strong bg-raised/35 px-6 py-20 text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-ink/[0.025]"
            >
              <SparkMark className="size-[320px]" />
            </div>
            <div className="relative">
              <SparkMark className="mx-auto size-7 text-accent/50" />
              <h2 className="display-cn mt-5 text-[32px] text-ink">你的收藏夹还是空的。</h2>
              <p className="mx-auto mt-3 max-w-[340px] text-[14px] leading-[1.8] text-muted">
                在档案页点击「收藏」，把那些值得留在手边的工具放到这里。
              </p>
              <Link href="/library" className="btn btn-primary btn-sm mt-7">
                去档案馆逛逛
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
