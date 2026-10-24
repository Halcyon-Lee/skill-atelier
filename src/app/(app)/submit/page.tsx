import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar, SparkMark } from "@/components/brand";
import { SkillForm } from "@/components/skill-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "分享 Skill",
};

export default async function SubmitPage() {
  const user = await requireUser();

  return (
    <div className="shell">
      <div className="flex h-[58px] items-center justify-between border-b border-line">
        <Link
          href="/library"
          className="flex items-center gap-1.5 text-[12px] text-faint transition-colors hover:text-ink"
        >
          <ArrowLeft size={12} />
          返回技能库
        </Link>
        <span className="eyebrow text-faint">New entry / Vol. 01</span>
      </div>

      <header className="grid gap-8 pt-12 pb-11 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-accent" />
            <span className="eyebrow text-muted">Contribute · 分享新技能</span>
          </div>
          <h1 className="display-cn mt-6 max-w-[720px] text-[clamp(44px,5.6vw,72px)] leading-[1.02] text-balance">
            留下一件
            <br />
            真正好用的工具<span className="text-accent">。</span>
          </h1>
          <p className="mt-6 max-w-[560px] text-[14px] leading-[1.9] text-muted text-pretty">
            分享你用过的好技能。写清楚它能解决什么问题、适合哪些场景，再用实际案例展示效果。
          </p>
        </div>

        <div className="hidden border-l border-line pl-7 lg:block">
          <SparkMark className="size-6 text-accent/70" />
          <p className="mt-6 font-display text-[22px] leading-[1.35] text-ink italic">
            “A collection is only as good as what you leave out.”
          </p>
          <div className="mt-6 flex items-center gap-2.5 border-t border-line pt-4">
            <Avatar name={user.name} color={user.avatarColor} size="sm" />
            <div>
              <p className="text-[12px] text-muted">
                将以 <span className="text-ink">{user.name}</span> 的名义收录
              </p>
              <p className="mt-0.5 text-[12px] text-faint">收录后仍可随时编辑</p>
            </div>
          </div>
        </div>
      </header>

      <div className="border-t border-line pt-9 pb-4">
        <SkillForm mode="create" />
      </div>
    </div>
  );
}
