import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  Layers3,
  PencilLine,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { toggleFeaturedAction } from "@/actions/admin";
import { InviteCopy } from "@/components/admin/invite-copy";
import { InviteManager } from "@/components/admin/invite-manager";
import { RevokeInviteButton } from "@/components/admin/revoke-invite-button";
import { Avatar, SparkMark } from "@/components/brand";
import { DeleteSkillDialog } from "@/components/library/delete-skill-dialog";
import { requireAdmin } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import { getDb } from "@/lib/db";
import {
  getInviteStatus,
  type InviteRow,
} from "@/lib/invites";
import { formatDate, formatRelative } from "@/lib/utils";

export const metadata: Metadata = {
  title: "馆务台",
};

type AdminInvite = InviteRow & { creator_name: string };

type AdminMember = {
  id: number;
  name: string;
  email: string;
  role: "member" | "admin";
  avatar_color: string;
  created_at: string;
  skill_count: number;
  bookmark_count: number;
};

type AdminSkill = {
  id: number;
  slug: string;
  name: string;
  category: string;
  featured: number;
  view_count: number;
  created_at: string;
  author_name: string;
  bookmark_count: number;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const user = await requireAdmin();
  const { notice } = await searchParams;
  const db = getDb();

  const invitations = db
    .prepare(
      `SELECT i.*, u.name AS creator_name
       FROM invites i JOIN users u ON u.id = i.created_by
       ORDER BY i.created_at DESC`,
    )
    .all() as unknown as AdminInvite[];

  const members = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.avatar_color, u.created_at,
        (SELECT COUNT(*) FROM skills s WHERE s.author_id = u.id) AS skill_count,
        (SELECT COUNT(*) FROM bookmarks b WHERE b.user_id = u.id) AS bookmark_count
       FROM users u ORDER BY u.created_at ASC`,
    )
    .all() as unknown as AdminMember[];

  const skills = db
    .prepare(
      `SELECT s.id, s.slug, s.name, s.category, s.featured, s.view_count, s.created_at,
        u.name AS author_name,
        (SELECT COUNT(*) FROM bookmarks b WHERE b.skill_id = s.id) AS bookmark_count
       FROM skills s JOIN users u ON u.id = s.author_id
       ORDER BY s.created_at DESC`,
    )
    .all() as unknown as AdminSkill[];

  const activeInvites = invitations.filter((invite) => getInviteStatus(invite).tone === "active").length;
  const bookmarkTotal = db.prepare("SELECT COUNT(*) AS count FROM bookmarks").get() as {
    count: number;
  };

  const noticeMessage =
    notice === "invite-revoked"
      ? "邀请函已收回，新的成员将无法再使用它。"
      : notice === "featured"
        ? "精选状态已更新，档案库会立即反映这次改动。"
        : "";

  const stats = [
    { value: members.length, label: "成员", english: "Members", icon: Users },
    { value: skills.length, label: "馆藏", english: "Skills", icon: Layers3 },
    { value: activeInvites, label: "可用邀请", english: "Live invites", icon: Ticket },
    { value: Number(bookmarkTotal.count), label: "收藏", english: "Bookmarks", icon: Bookmark },
  ];

  return (
    <div>
      <div className="shell">
        <div className="flex h-[58px] items-center justify-between border-b border-line">
          <Link
            href="/library"
            className="flex items-center gap-1.5 text-[12px] text-faint transition-colors hover:text-ink"
          >
            <ArrowLeft size={12} />
            返回档案馆
          </Link>
          <span className=" flex items-center gap-2 eyebrow text-faint">
            <span className="size-1.5 rounded-full bg-accent" />
            Curator access only
          </span>
        </div>

        {noticeMessage && (
          <div className="animate-rise mt-6 flex items-center justify-between gap-4 border-l-2 border-moss bg-moss/[0.065] px-4 py-3">
            <p className="flex items-center gap-2 text-[14px] leading-relaxed text-muted">
              <CheckCircle2 size={14} className="flex-none text-moss" />
              {noticeMessage}
            </p>
            <Link
              href="/admin"
              aria-label="关闭提示"
              className="flex size-7 flex-none items-center justify-center text-faint transition-colors hover:text-ink"
            >
              <X size={13} />
            </Link>
          </div>
        )}

        <header className="py-11 lg:py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-accent" />
                <span className="eyebrow text-muted">
                  Curator&apos;s desk · {new Intl.DateTimeFormat("zh-CN", { month: "long", year: "numeric" }).format(new Date())}
                </span>
              </div>
              <h1 className="display-cn mt-5 text-[clamp(48px,6.4vw,82px)] leading-[0.98]">
                馆务台<span className="text-accent">.</span>
              </h1>
              <p className="mt-5 max-w-[560px] text-[14px] leading-[1.9] text-muted">
                掌管邀请与馆藏的地方。签发邀请函、查看成员名录，并确保每一份被收录的技能都仍然值得留在这里。
              </p>
            </div>

            <div className="hidden w-[270px] border border-line bg-raised p-4 lg:block">
              <div className="flex items-center justify-between">
                <span className="eyebrow text-faint">Curator</span>
                <ShieldCheck size={14} className="text-accent" />
              </div>
              <div className="mt-4 flex items-center gap-2.5 border-t border-line pt-3.5">
                <Avatar name={user.name} color={user.avatarColor} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-[12px] text-ink">{user.name}</p>
                  <p className="mt-0.5 truncate text-[12px] text-faint">{user.email}</p>
                </div>
              </div>
              <p className="mt-3 text-[12px] leading-[1.7] text-faint">
                邀请、精选与删除操作仅对馆员开放。
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-px border-y border-line bg-line lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.english} className="bg-paper px-5 py-5">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-[34px] leading-none text-ink">
                      {String(stat.value).padStart(2, "0")}
                    </p>
                    <Icon size={13} className="text-faint" strokeWidth={1.6} />
                  </div>
                  <p className="mt-3 text-[12px] text-muted">{stat.label}</p>
                  <p className="mt-0.5 eyebrow text-[12px] text-faint">{stat.english}</p>
                </div>
              );
            })}
          </div>
        </header>
      </div>

      <nav aria-label="馆务台导航" className="sticky top-[76px] z-30 border-y border-line bg-paper/95 backdrop-blur-md">
        <div className="shell flex h-12 items-center justify-between">
          <div className="flex items-center gap-5">
            <a href="#invites" className="text-[12px] text-muted transition-colors hover:text-ink">
              邀请函
            </a>
            <a href="#members" className="text-[12px] text-muted transition-colors hover:text-ink">
              成员
            </a>
            <a href="#skills" className="text-[12px] text-muted transition-colors hover:text-ink">
              馆藏
            </a>
          </div>
          <span className="hidden items-center gap-1.5 font-mono text-[12px] text-faint sm:flex">
            <ShieldCheck size={10} />
            ADMIN / INVITE-ONLY
          </span>
        </div>
      </nav>

      <div className="shell">
        <section id="invites" className="scroll-mt-[140px] border-b border-line py-12">
          <SectionHeading
            index="01"
            title="邀请函"
            english="Access control"
            description="每一位新成员都必须持有效邀请函进入。设置独立席位与有效期，并可随时撤回。"
          />

          <div className="mt-7 grid items-start gap-5 xl:grid-cols-[370px_minmax(0,1fr)]">
            <div className="border border-line bg-raised p-5">
              <InviteManager />
            </div>

            <div className="border border-line bg-raised">
              <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3">
                <span className="eyebrow text-faint">All invitations</span>
                <span className="font-mono text-[12px] text-faint">
                  {String(invitations.length).padStart(2, "0")} ISSUED
                </span>
              </div>

              <div className="divide-y divide-line">
                {invitations.map((invite) => {
                  const status = getInviteStatus(invite);
                  const percentage = Math.min(
                    100,
                    Math.round((invite.used_count / Math.max(invite.max_uses, 1)) * 100),
                  );

                  return (
                    <div
                      key={invite.id}
                      className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1.4fr)_100px_100px_auto] sm:items-center sm:gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="font-mono text-[12px] tracking-[0.04em] text-ink">
                            {invite.code}
                          </code>
                          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                        </div>
                        <p className="mt-1.5 truncate text-[12px] text-faint">
                          {invite.note} · 由 {invite.creator_name} 签发
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[12px] text-faint">
                          <span>席位</span>
                          <span className="font-mono">
                            {invite.used_count}/{invite.max_uses === 0 ? "不限" : invite.max_uses}
                          </span>
                        </div>
                        {invite.max_uses > 0 && (
                          <div className="mt-1.5 h-[3px] w-full bg-sunken">
                            <div
                              className={`h-full ${status.tone === "active" ? "bg-moss" : "bg-line-strong"}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="eyebrow text-[12px] text-faint">Expires</p>
                        <p className="mt-1 text-[12px] text-muted">
                          {invite.expires_at ? formatDate(invite.expires_at) : "永不"}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        {status.tone === "active" && (
                          <InviteCopy
                            code={invite.code}
                            label="链接"
                            className="!text-[12px] text-muted hover:text-ink"
                          />
                        )}
                        {!invite.revoked_at && (
                          <RevokeInviteButton id={invite.id} code={invite.code} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="members" className="scroll-mt-[140px] border-b border-line py-12">
          <SectionHeading
            index="02"
            title="成员名录"
            english="The members"
            description="邀请制意味着每一位成员都值得被记住。这里记录他们的加入时间与贡献。"
            action={
              <a href="#invites" className="flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink">
                签发邀请
                <ArrowUpRight size={12} />
              </a>
            }
          />

          <div className="mt-7 border border-line bg-raised">
            <div className="hidden grid-cols-[minmax(0,1.5fr)_110px_110px_90px] gap-4 border-b border-line px-4 py-2.5 sm:grid">
              <span className="eyebrow text-[12px] text-faint">Member</span>
              <span className="eyebrow text-[12px] text-faint">Role</span>
              <span className="eyebrow text-[12px] text-faint">Joined</span>
              <span className="eyebrow text-right text-[12px] text-faint">Contributed</span>
            </div>

            <div className="divide-y divide-line">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1.5fr)_110px_110px_90px] sm:items-center sm:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={member.name} color={member.avatar_color} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[12px] text-ink">{member.name}</p>
                        <span className="font-mono text-[12px] text-faint">
                          #{String(member.id).padStart(3, "0")}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-faint">{member.email}</p>
                    </div>
                  </div>

                  <div>
                    {member.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent-soft/35 px-2 py-1 font-mono text-[12px] tracking-[0.05em] text-accent-deep uppercase">
                        <ShieldCheck size={9} />
                        Curator
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-line px-2 py-1 font-mono text-[12px] tracking-[0.05em] text-muted uppercase">
                        Member
                      </span>
                    )}
                  </div>

                  <p className="text-[12px] text-muted">{formatDate(member.created_at)}</p>

                  <div className="flex items-center justify-between sm:justify-end">
                    <span className="font-mono text-[12px] text-muted sm:hidden">收录 / 收藏</span>
                    <p className="font-mono text-[12px] text-ink">
                      {member.skill_count} / {member.bookmark_count}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="skills" className="scroll-mt-[140px] py-12">
          <SectionHeading
            index="03"
            title="馆藏管理"
            english="The collection"
            description="保持馆藏的密度而不是数量。精选会出现在技能库的首页；删除则会永久移除档案。"
            action={
              <Link href="/submit" className="flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink">
                收录新技能
                <ArrowUpRight size={12} />
              </Link>
            }
          />

          <div className="mt-7 overflow-x-auto border border-line bg-raised">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-4 py-3 eyebrow text-[12px] font-medium text-faint">Archive</th>
                  <th className="px-3 py-3 eyebrow text-[12px] font-medium text-faint">Category</th>
                  <th className="px-3 py-3 eyebrow text-[12px] font-medium text-faint">Author</th>
                  <th className="px-3 py-3 eyebrow text-[12px] font-medium text-faint">Signals</th>
                  <th className="px-3 py-3 eyebrow text-[12px] font-medium text-faint">Featured</th>
                  <th className="px-4 py-3 text-right eyebrow text-[12px] font-medium text-faint">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {skills.map((skill) => {
                  const category = getCategory(skill.category);
                  return (
                    <tr key={skill.id} className="transition-colors hover:bg-paper/45">
                      <td className="max-w-[320px] px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[12px] text-faint">
                            №{String(skill.id).padStart(3, "0")}
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/skills/${skill.slug}`}
                              className="block truncate text-[12px] text-ink transition-colors hover:text-accent-deep"
                            >
                              {skill.name}
                            </Link>
                            <p className="mt-0.5 truncate font-mono text-[12px] text-faint">
                              /{skill.slug} · {formatRelative(skill.created_at)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="flex items-center gap-2 text-[12px] text-muted">
                          <span
                            className="size-[5px] rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.label}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-[12px] text-muted">{skill.author_name}</td>
                      <td className="px-3 py-3.5">
                        <span className="font-mono text-[12px] text-faint">
                          {skill.view_count.toLocaleString("en-US")} views · {skill.bookmark_count} saves
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <form action={toggleFeaturedAction}>
                          <input type="hidden" name="id" value={skill.id} />
                          <button
                            type="submit"
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[12px] tracking-[0.04em] uppercase transition-colors ${
                              skill.featured
                                ? "border-accent/30 bg-accent-soft/40 text-accent-deep hover:bg-accent-soft/70"
                                : "border-line text-faint hover:border-line-strong hover:text-ink"
                            }`}
                          >
                            <Sparkles size={9} />
                            {skill.featured ? "Featured" : "Feature"}
                          </button>
                        </form>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/skills/${skill.slug}/edit`}
                            aria-label={`编辑 ${skill.name}`}
                            className="text-faint transition-colors hover:text-ink"
                          >
                            <PencilLine size={12} />
                          </Link>
                          <DeleteSkillDialog
                            slug={skill.slug}
                            name={skill.name}
                            className="!text-[12px]"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 text-[12px] text-faint sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2">
              <SparkMark className="size-2.5 text-accent/60" />
              精选会同步出现在成员首页；同一时间可以有多份精选。
            </p>
            <Link href="/library" className="flex items-center gap-1.5 transition-colors hover:text-ink">
              检查成员视角
              <ArrowUpRight size={11} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeading({
  index,
  title,
  english,
  description,
  action,
}: {
  index: string;
  title: string;
  english: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-start gap-4">
        <span className="mt-1.5 font-mono text-[12px] tracking-[0.1em] text-accent">{index}</span>
        <div>
          <div className="flex items-baseline gap-3">
            <h2 className="display-cn text-[32px] leading-none text-ink">{title}</h2>
            <span className="eyebrow text-faint">{english}</span>
          </div>
          <p className="mt-2.5 max-w-[580px] text-[12px] leading-[1.75] text-muted">
            {description}
          </p>
        </div>
      </div>
      {action}
    </div>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: "active" | "muted" | "closed";
  children: React.ReactNode;
}) {
  const styles = {
    active: "border-moss/20 bg-moss/[0.08] text-moss",
    muted: "border-line bg-sunken/50 text-faint",
    closed: "border-accent/20 bg-accent-soft/35 text-accent-deep",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[12px] tracking-[0.04em] uppercase ${styles[tone]}`}
    >
      <span
        className={`size-1 rounded-full ${
          tone === "active" ? "bg-moss" : tone === "closed" ? "bg-accent" : "bg-faint"
        }`}
      />
      {children}
    </span>
  );
}
