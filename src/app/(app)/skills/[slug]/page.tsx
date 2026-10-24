import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  PencilLine,
  X,
} from "lucide-react";
import { Avatar, SparkMark } from "@/components/brand";
import { BookmarkButton } from "@/components/library/bookmark-button";
import { DeleteSkillDialog } from "@/components/library/delete-skill-dialog";
import { SkillCard } from "@/components/library/skill-card";
import { ViewPing } from "@/components/library/view-ping";
import { SkillShowcase } from "@/components/library/skill-showcase";
import { Markdown } from "@/components/markdown";
import { CopyButton } from "@/components/ui/copy-button";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getRelatedSkills, getSkillBySlug } from "@/lib/skills";
import { formatDate, formatRelative } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const row = getDb()
    .prepare("SELECT name, tagline FROM skills WHERE slug = ?")
    .get(slug) as { name: string; tagline: string } | undefined;

  if (!row) return { title: "档案未找到" };
  return { title: row.name, description: row.tagline };
}

export default async function SkillDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const user = await requireUser();
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const skill = getSkillBySlug(slug, user.id);
  if (!skill) notFound();

  const related = getRelatedSkills(skill, user.id);
  const canEdit = skill.author.id === user.id || user.role === "admin";
  const notice = query.created ? "created" : query.updated ? "updated" : "";
  const cleanHref = `/skills/${skill.slug}`;

  return (
    <>
      <ViewPing slug={skill.slug} />

      {notice && (
        <div className="shell pt-6">
          <div className="animate-rise flex items-center justify-between gap-4 border-l-2 border-moss bg-moss/[0.065] px-4 py-3">
            <p className="text-[14px] leading-relaxed text-muted">
              <span className="font-medium text-ink">
                {notice === "created" ? "档案已收录。" : "档案已更新。"}
              </span>{" "}
              {notice === "created"
                ? "谢谢你让这座档案馆变得更好。"
                : "改动已经保存，成员会看到最新版本。"}
            </p>
            <Link
              href={cleanHref}
              aria-label="关闭提示"
              className="flex size-7 flex-none items-center justify-center text-faint transition-colors hover:text-ink"
            >
              <X size={13} />
            </Link>
          </div>
        </div>
      )}

      <div className="shell">
        <div className="flex h-[58px] items-center justify-between gap-4 border-b border-line">
          <nav aria-label="面包屑" className="flex min-w-0 items-center gap-2 text-[12px] text-faint">
            <Link href="/library" className="flex items-center gap-1.5 transition-colors hover:text-ink">
              <ArrowLeft size={12} />
              技能库
            </Link>
            <ChevronRight size={10} className="text-line-strong" />
            <Link
              href={`/library?category=${skill.category}`}
              className="hidden transition-colors hover:text-ink sm:inline"
            >
              {skill.categoryEnglish}
            </Link>
            <ChevronRight size={10} className="hidden text-line-strong sm:inline" />
            <span className="truncate text-muted">{skill.name}</span>
          </nav>

          <div className="flex flex-none items-center gap-4">
            {canEdit && (
              <Link
                href={`/skills/${skill.slug}/edit`}
                className="flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink"
              >
                <PencilLine size={11} />
                编辑
              </Link>
            )}
            <span className="eyebrow text-faint">No. {String(skill.id).padStart(3, "0")}</span>
          </div>
        </div>

        <header className="py-11 lg:py-14">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="flex items-center gap-2">
              <span
                className="size-[6px] rounded-full"
                style={{ backgroundColor: skill.categoryColor }}
              />
              <span className="eyebrow text-muted">
                {skill.categoryEnglish} / {skill.categoryLabel}
              </span>
            </span>
            <span className="hidden h-3 w-px bg-line sm:block" />
            <span className="eyebrow text-faint">Updated {formatRelative(skill.updatedAt)}</span>
            <span className="hidden h-3 w-px bg-line sm:block" />
            <span className="flex items-center gap-1.5 font-mono text-[12px] text-faint">
              <Eye size={11} strokeWidth={1.7} />
              {skill.viewCount.toLocaleString("en-US")}
            </span>
          </div>

          <h1 className="display-cn mt-5 max-w-[950px] text-[clamp(36px,5.7vw,72px)] leading-[1.12] text-balance">
            {skill.name}
            <span className="text-accent">.</span>
          </h1>
          <p className="mt-6 max-w-[740px] text-base leading-[1.85] text-muted text-pretty">
            {skill.tagline}
          </p>

          <div className="mt-9 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-5">
            <div className="flex items-center gap-3">
              <Avatar name={skill.author.name} color={skill.author.color} />
              <div>
                <p className="text-[12px] text-ink">
                  由 <span className="font-medium">{skill.author.name}</span> 收录
                </p>
                <p className="mt-0.5 font-mono text-[12px] text-faint">
                  {formatDate(skill.createdAt)} · VERSION {skill.version}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {skill.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/library?q=${encodeURIComponent(tag)}`}
                  className="tag-pill transition-colors hover:border-ink/30 hover:text-ink"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-12 border-t border-line pt-11 lg:grid-cols-[minmax(0,1fr)_334px] lg:gap-16 lg:pt-14">
          <article className="min-w-0">
            <SkillShowcase skill={skill} />
            <Markdown content={skill.description} />

            <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
              <div className="flex items-center gap-3">
                <Avatar name={skill.author.name} color={skill.author.color} size="sm" />
                <div>
                  <p className="text-[12px] text-ink">{skill.author.name}</p>
                  <p className="mt-0.5 max-w-[420px] text-[12px] leading-relaxed text-faint">
                    {skill.author.bio || "ATELIER 成员"}
                  </p>
                </div>
              </div>
              <span className="font-display text-[15px] text-faint italic">
                Kept in the archive.
              </span>
            </div>
          </article>

          <aside className="lg:sticky lg:top-[100px] lg:self-start">
            <div className="overflow-hidden rounded-lg border border-line bg-raised">
              <div className="border-b border-line p-5">
                <div className="flex items-center justify-between">
                  <span className="eyebrow text-faint">Install / 安装</span>
                  <span className="font-mono text-[12px] text-faint">v{skill.version}</span>
                </div>

                {skill.installCommand ? (
                  <>
                    <div className="relative mt-4 bg-dark px-3.5 py-3.5 text-cream">
                      <span className="absolute top-2.5 right-3 font-mono text-[12px] tracking-[0.1em] text-muted">
                        SHELL
                      </span>
                      <code className="block pr-8 font-mono text-[12px] leading-[1.8] break-all text-cream/75">
                        <span className="mr-1.5 text-accent">$</span>
                        {skill.installCommand}
                      </code>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[12px] text-faint">在终端中运行</span>
                      <CopyButton
                        text={skill.installCommand}
                        label="复制命令"
                        copiedLabel="已复制命令"
                        toastMessage="安装命令已复制。"
                        className="text-muted hover:text-ink"
                      />
                    </div>
                  </>
                ) : (
                  <p className="mt-4 text-[12px] leading-relaxed text-muted">
                    作者未提供安装命令，请查看原始来源。
                  </p>
                )}
              </div>

              <div className="p-5">
                <BookmarkButton
                  slug={skill.slug}
                  initialSaved={skill.bookmarked}
                  initialCount={skill.bookmarkCount}
                />
              </div>

              <dl className="border-t border-line">
                <SpecRow label="分类" value={`${skill.categoryLabel} / ${skill.categoryEnglish}`} />
                <SpecRow label="版本" value={skill.version} mono />
                <SpecRow label="许可" value={skill.license} mono />
                <SpecRow label="更新" value={formatDate(skill.updatedAt)} mono />
                <SpecRow label="收藏" value={`${skill.bookmarkCount} 位成员`} mono />
              </dl>

              {skill.sourceUrl && (
                <a
                  href={skill.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex items-center justify-between border-t border-line px-5 py-3.5 text-[12px] text-muted transition-colors hover:bg-sunken/35 hover:text-ink"
                >
                  查看原始来源
                  <ExternalLink
                    size={12}
                    className="text-faint transition-colors group-hover:text-ink"
                  />
                </a>
              )}

              <div className="border-t border-line p-5">
                <span className="eyebrow text-faint">Curated by</span>
                <div className="mt-3.5 flex items-start gap-3">
                  <Avatar name={skill.author.name} color={skill.author.color} size="sm" />
                  <div className="min-w-0">
                    <p className="text-[12px] text-ink">{skill.author.name}</p>
                    <p className="mt-1 line-clamp-3 text-[12px] leading-[1.7] text-faint">
                      {skill.author.bio || "ATELIER 成员"}
                    </p>
                  </div>
                </div>
              </div>

              {canEdit && (
                <div className="flex items-center justify-between border-t border-line bg-paper/35 px-5 py-3">
                  <Link
                    href={`/skills/${skill.slug}/edit`}
                    className="inline-flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink"
                  >
                    <PencilLine size={11} />
                    编辑档案
                  </Link>
                  <DeleteSkillDialog slug={skill.slug} name={skill.name} />
                </div>
              )}
            </div>

            <p className="mt-4 flex items-start gap-2 px-1 text-[12px] leading-[1.7] text-faint">
              <SparkMark className="mt-0.5 size-2.5 flex-none text-accent/60" />
              档案内容由收录者维护。安装前请阅读来源仓库与许可协议。
            </p>
          </aside>
        </div>
      </div>

      {related.length > 0 && (
        <section className="shell mt-20 border-t border-line pt-9">
          <div className="mb-6 flex items-end justify-between">
            <div className="flex items-baseline gap-3">
              <h2 className="display-cn text-[28px] leading-none text-ink">继续翻阅</h2>
              <span className="eyebrow text-faint">Keep reading</span>
            </div>
            <Link
              href={`/library?category=${skill.category}`}
              className="hidden items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink sm:flex"
            >
              {skill.categoryLabel} · 同分类档案
              <ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => (
              <SkillCard key={item.id} skill={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function SpecRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line px-5 py-2.5 last:border-b-0">
      <dt className="text-[12px] text-faint">{label}</dt>
      <dd className={`text-[12px] text-ink ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
