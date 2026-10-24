import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SkillForm } from "@/components/skill-form";
import { requireUser } from "@/lib/auth";
import { skillToFormInitial } from "@/lib/skill-form";
import { getSkillBySlug } from "@/lib/skills";
import { formatRelative } from "@/lib/utils";

export const metadata: Metadata = {
  title: "编辑技能",
};

export default async function EditSkillPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const skill = getSkillBySlug(slug, user.id);
  if (!skill) notFound();
  if (skill.author.id !== user.id && user.role !== "admin") {
    redirect(`/skills/${slug}`);
  }

  return (
    <div className="shell">
      <div className="flex h-[58px] items-center justify-between border-b border-line">
        <Link
          href={`/skills/${slug}`}
          className="flex items-center gap-1.5 text-[10.5px] text-faint transition-colors hover:text-ink"
        >
          <ArrowLeft size={12} />
          返回档案
        </Link>
        <span className="eyebrow text-faint">Editing / No. {String(skill.id).padStart(3, "0")}</span>
      </div>

      <header className="py-11 lg:py-12">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-accent" />
          <span className="eyebrow text-muted">Revise · 修整档案</span>
        </div>
        <h1 className="display-cn mt-5 max-w-[820px] text-[clamp(42px,5.4vw,68px)] leading-[1.03]">
          修整「{skill.name}」<span className="text-accent">。</span>
        </h1>
        <p className="mt-4 flex items-center gap-2 text-[11px] text-faint">
          上次更新于 {formatRelative(skill.updatedAt)}
          <span className="size-[3px] rounded-full bg-line-strong" />
          {skill.bookmarkCount} 位成员收藏了这份档案
        </p>
      </header>

      <div className="border-t border-line pt-9 pb-4">
        <SkillForm mode="edit" slug={skill.slug} initial={skillToFormInitial(skill)} />
      </div>
    </div>
  );
}
