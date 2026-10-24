import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  LayoutDashboard,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Avatar, SparkMark } from "@/components/brand";
import { PasswordSettings, ProfileSettings } from "@/components/profile/profile-settings";
import { requireUser } from "@/lib/auth";
import { getBookmarkedSkills, getSkillsByAuthor } from "@/lib/skills";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "我的档案",
};

export default async function ProfilePage() {
  const user = await requireUser();
  const mySkills = getSkillsByAuthor(user.id, user.id);
  const saved = getBookmarkedSkills(user.id);
  const totalViews = mySkills.reduce((sum, skill) => sum + skill.viewCount, 0);
  const joined = new Date(user.createdAt);
  const memberNumber = `ATL-${joined.getFullYear()}-${String(user.id).padStart(4, "0")}`;
  const memberSince = `${joined.getFullYear()}.${String(joined.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="shell">
      <div className="flex h-[58px] items-center justify-between border-b border-line">
        <Link
          href="/library"
          className="text-[12px] text-faint transition-colors hover:text-ink"
        >
          ← 档案馆
        </Link>
        <span className="eyebrow text-faint">Member file / Private</span>
      </div>

      <header className="border-b border-line py-11 lg:py-14">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-accent" />
              <span className="eyebrow text-muted">Member profile · 成员档案</span>
            </div>
            <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
              <Avatar name={user.name} color={user.avatarColor} size="xl" />
              <div>
                <h1 className="display-cn text-[clamp(42px,5.6vw,68px)] leading-none text-ink">
                  {user.name}
                  <span className="text-accent">.</span>
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-faint">
                  <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[12px] tracking-[0.08em] text-muted uppercase">
                    {user.role === "admin" ? "Curator · 馆员" : "Member · 成员"}
                  </span>
                  <span>{user.email}</span>
                  <span className="size-[3px] rounded-full bg-line-strong" />
                  <span>加入于 {formatDate(user.createdAt, "long")}</span>
                </div>
                <p className="mt-4 max-w-[520px] text-[14px] leading-[1.85] text-muted">
                  {user.bio || "还没有写下自我介绍。可以在下方补充一两句话。"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/saved" className="btn btn-outline btn-sm">
              <Bookmark size={13} />
              收藏夹 · {saved.length}
            </Link>
            <Link href="/submit" className="btn btn-primary btn-sm">
              <Plus size={13} />
              收录技能
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-12 py-11 lg:grid-cols-[minmax(0,1fr)_336px] lg:gap-16 lg:py-14">
        <div className="min-w-0">
          <section aria-labelledby="my-skills">
            <div className="flex items-end justify-between border-b border-line pb-4">
              <div>
                <h2 id="my-skills" className="display-cn text-[30px] leading-none text-ink">
                  我的收录
                </h2>
                <p className="mt-2 eyebrow text-faint">Contributed · {mySkills.length}</p>
              </div>
              <Link
                href="/submit"
                className="flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink"
              >
                收录新技能
                <Plus size={12} />
              </Link>
            </div>

            {mySkills.length > 0 ? (
              <div>
                {mySkills.map((skill) => (
                  <Link
                    key={skill.id}
                    href={`/skills/${skill.slug}`}
                    className="group flex items-start justify-between gap-5 border-b border-line py-5 transition-colors hover:border-line-strong"
                  >
                    <div className="flex min-w-0 gap-4">
                      <span className="mt-1.5 hidden font-mono text-[12px] tracking-[0.08em] text-faint sm:block">
                        №{String(skill.id).padStart(3, "0")}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="display-cn text-[23px] leading-none text-ink transition-colors group-hover:text-accent-deep">
                            {skill.name}
                          </h3>
                          <span
                            className="size-[5px] rounded-full"
                            style={{ backgroundColor: skill.categoryColor }}
                          />
                          <span className="eyebrow text-[12px] text-faint">
                            {skill.categoryEnglish}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-1 text-[12px] text-muted">{skill.tagline}</p>
                        <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[12px] text-faint">
                          <span>v{skill.version}</span>
                          <span className="size-[2px] rounded-full bg-line-strong" />
                          <span>{formatDate(skill.updatedAt)} 更新</span>
                          <span className="size-[2px] rounded-full bg-line-strong" />
                          <span>{skill.bookmarkCount} 收藏</span>
                          <span className="size-[2px] rounded-full bg-line-strong" />
                          <span>{skill.viewCount.toLocaleString("en-US")} 次翻阅</span>
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight
                      size={14}
                      className="mt-1 flex-none text-faint transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="border-b border-line py-12">
                <SparkMark className="size-6 text-accent/45" />
                <p className="display-cn mt-4 text-[26px] text-ink">还没有收录任何技能。</p>
                <p className="mt-2 max-w-[340px] text-[12px] leading-[1.8] text-muted">
                  你第一时间想到的那个好用工具，也许正值得被放进这座档案馆。
                </p>
                <Link href="/submit" className="btn btn-primary btn-sm mt-5">
                  收录第一份技能
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            )}
          </section>

          <section aria-labelledby="account-settings" className="mt-14 border-t border-line pt-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="account-settings" className="display-cn text-[30px] leading-none text-ink">
                  账户资料
                </h2>
                <p className="mt-2 eyebrow text-faint">Account settings</p>
              </div>
              <span className="flex items-center gap-1.5 font-mono text-[12px] text-faint">
                <ShieldCheck size={11} />
                Private
              </span>
            </div>
            <div className="mt-7">
              <ProfileSettings name={user.name} bio={user.bio} email={user.email} />
            </div>
          </section>

          <section aria-labelledby="password-settings" className="mt-12 border-t border-line pt-8">
            <h2 id="password-settings" className="display-cn text-[30px] leading-none text-ink">
              更新密码
            </h2>
            <p className="mt-2 eyebrow text-faint">Security</p>
            <div className="mt-7 max-w-[620px]">
              <PasswordSettings />
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-[100px] lg:self-start">
          <div className="relative overflow-hidden rounded-lg bg-dark p-6 text-cream">
            <div aria-hidden="true" className="rule-grid absolute inset-0 opacity-[0.05]" />
            <SparkMark className="absolute -right-8 -bottom-10 size-44 text-cream/[0.045]" />

            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <SparkMark className="size-4 text-accent" />
                  <span className="font-display text-[17px] tracking-[0.1em] text-cream">
                    ATELIER
                  </span>
                </div>
                <span className="eyebrow text-muted">Membership</span>
              </div>

              <p className="display mt-12 text-[34px] leading-none text-cream">{user.name}</p>
              <p className="mt-2 font-mono text-[12px] tracking-[0.14em] text-muted uppercase">
                {user.role === "admin" ? "Curator / 馆员" : "Member / 成员"}
              </p>

              <div className="mt-9 grid grid-cols-2 gap-4 border-t border-cream/15 pt-4">
                <div>
                  <p className="eyebrow text-muted">Member no.</p>
                  <p className="mt-1.5 font-mono text-[12px] tracking-[0.05em] text-cream/70">
                    {memberNumber}
                  </p>
                </div>
                <div>
                  <p className="eyebrow text-muted">Since</p>
                  <p className="mt-1.5 font-mono text-[12px] tracking-[0.05em] text-cream/70">
                    {memberSince}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-cream/15 pt-4">
                <span className="flex items-center gap-1.5 font-mono text-[12px] text-muted">
                  <span className="size-1.5 animate-pulse-soft rounded-full bg-accent" />
                  ACTIVE MEMBER
                </span>
                <span className="eyebrow text-muted">MMXXVI</span>
              </div>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-3 border border-line bg-raised">
            <div className="border-r border-line px-3 py-4 text-center">
              <dd className="font-display text-[25px] leading-none text-ink">{mySkills.length}</dd>
              <dt className="mt-1.5 eyebrow text-[12px] text-faint">收录</dt>
            </div>
            <div className="border-r border-line px-3 py-4 text-center">
              <dd className="font-display text-[25px] leading-none text-ink">{saved.length}</dd>
              <dt className="mt-1.5 eyebrow text-[12px] text-faint">收藏</dt>
            </div>
            <div className="px-3 py-4 text-center">
              <dd className="font-display text-[25px] leading-none text-ink">
                {totalViews > 999 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews}
              </dd>
              <dt className="mt-1.5 eyebrow text-[12px] text-faint">翻阅</dt>
            </div>
          </dl>

          <nav aria-label="快捷入口" className="mt-4 border border-line bg-raised">
            <Link
              href="/saved"
              className="flex items-center justify-between border-b border-line px-4 py-3.5 text-[12px] text-muted transition-colors hover:bg-sunken/35 hover:text-ink"
            >
              <span className="flex items-center gap-2">
                <Bookmark size={13} />
                我的收藏
              </span>
              <span className="font-mono text-[12px] text-faint">{saved.length}</span>
            </Link>
            <Link
              href="/submit"
              className="flex items-center justify-between px-4 py-3.5 text-[12px] text-muted transition-colors hover:bg-sunken/35 hover:text-ink"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={13} />
                收录一份新技能
              </span>
              <ArrowUpRight size={12} className="text-faint" />
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center justify-between border-t border-line px-4 py-3.5 text-[12px] text-muted transition-colors hover:bg-accent-soft/30 hover:text-ink"
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard size={13} className="text-accent" />
                  馆务台
                </span>
                <span className="size-1.5 rounded-full bg-accent" />
              </Link>
            )}
          </nav>

          <p className="mt-4 px-1 text-[12px] leading-[1.7] text-faint">
            你的档案仅对馆内成员可见。成员编号由邀请顺序生成，不可更改。
          </p>
        </aside>
      </div>
    </div>
  );
}
