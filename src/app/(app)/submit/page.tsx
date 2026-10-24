import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar, SparkMark } from "@/components/brand";
import { SkillForm } from "@/components/skill-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "收录技能",
};

export default async function SubmitPage() {
  const user = await requireUser();

  return (
    <div className="shell">
      <div className="flex h-[58px] items-center justify-between border-b border-line">
        <Link
          href="/library"
          className="flex items-center gap-1.5 text-[10.5px] text-faint transition-colors hover:text-ink"
        >
          <ArrowLeft size={12} />
          返回档案馆
        </Link>
        <span className="eyebrow text-faint">New entry / Vol. 01</span>
      </div>

      <header className="grid gap-8 pt-12 pb-11 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-accent" />
            <span className="eyebrow text-muted">Contribute · 收录新技能</span>
          </div>
          <h1 className="display-cn mt-6 max-w-[720px] text-[clamp(44px,5.6vw,72px)] leading-[1.02] text-balance">
            留下一件
            <br />
            真正好用的工具<span className="text-accent">。</span>
          </h1>
          <p className="mt-6 max-w-[560px] text-[13px] leading-[1.9] text-muted text-pretty">
            收录不是发布，而是把一件经得起反复使用的技能，放进成员共同维护的工具箱。写清楚它解决什么，以及什么时候不该用它。
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
              <p className="text-[10.5px] text-muted">
                将以 <span className="text-ink">{user.name}</span> 的名义收录
              </p>
              <p className="mt-0.5 text-[9.5px] text-faint">收录后仍可随时编辑</p>
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
