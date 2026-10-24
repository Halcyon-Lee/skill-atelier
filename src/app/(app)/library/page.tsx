import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { SparkMark } from "@/components/brand";
import { FeaturedSkills } from "@/components/library/featured-skill";
import { SkillCard } from "@/components/library/skill-card";
import { requireUser } from "@/lib/auth";
import { CATEGORIES, getCategory, isCategory, type CategorySlug } from "@/lib/categories";
import {
  getCategoryCounts,
  getFeaturedSkills,
  getMembersCount,
  getSkillsCount,
  listSkills,
  type SkillSort,
} from "@/lib/skills";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "发现 Skills",
};

type SearchParams = Record<string, string | string[] | undefined>;

const SORT_OPTIONS: Array<{ value: SkillSort; label: string }> = [
  { value: "newest", label: "最新" },
  { value: "popular", label: "最热" },
  { value: "title", label: "名称" },
];

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const q = first(params.q).trim().slice(0, 80);
  const categoryParam = first(params.category);
  const category: CategorySlug | undefined = isCategory(categoryParam) ? categoryParam : undefined;
  const rawSort = first(params.sort);
  const sort: SkillSort =
    rawSort === "popular" || rawSort === "title" ? rawSort : "newest";
  const rawPage = Number.parseInt(first(params.page), 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const notice = first(params.welcome) ? "welcome" : first(params.deleted) ? "deleted" : "";
  const hasFilters = Boolean(q || category);

  const totalSkills = getSkillsCount();
  const memberCount = getMembersCount();
  const categoryCounts = getCategoryCounts();
  const featured = !hasFilters && page === 1 ? getFeaturedSkills(user.id) : [];
  const result = listSkills(user.id, { q, category, sort, page, pageSize: 9 });

  function makeHref(overrides: {
    q?: string | null;
    category?: CategorySlug | null;
    sort?: SkillSort;
    page?: number;
  }): string {
    const nextQ = overrides.q === undefined ? q : overrides.q;
    const nextCategory = overrides.category === undefined ? category : overrides.category;
    const nextSort = overrides.sort ?? sort;
    const nextPage = overrides.page ?? 1;
    const search = new URLSearchParams();

    if (nextQ) search.set("q", nextQ);
    if (nextCategory) search.set("category", nextCategory);
    if (nextSort !== "newest") search.set("sort", nextSort);
    if (nextPage > 1) search.set("page", String(nextPage));

    const query = search.toString();
    return `/library${query ? `?${query}` : ""}`;
  }

  const noticeContent =
    notice === "welcome"
      ? { title: "欢迎加入。", text: `${user.name}，档案馆已为你打开，所有收录现在都可以阅读与收藏。` }
      : notice === "deleted"
        ? { title: "档案已移出。", text: "这份技能已经从档案馆中删除。" }
        : null;

  return (
    <div>
      {noticeContent && (
        <div className="shell pt-6">
          <div className="animate-rise flex items-center justify-between gap-4 border-l-2 border-moss bg-moss/[0.065] px-4 py-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <CheckCircle2 size={15} className="mt-0.5 flex-none text-moss" />
              <p className="text-[14px] leading-relaxed text-muted">
                <span className="font-medium text-ink">{noticeContent.title}</span>{" "}
                {noticeContent.text}
              </p>
            </div>
            <Link
              href={makeHref({})}
              aria-label="关闭提示"
              className="flex size-7 flex-none items-center justify-center text-faint transition-colors hover:text-ink"
            >
              <X size={13} />
            </Link>
          </div>
        </div>
      )}

      <section className="community-hero border-b border-line">
        <div className="shell py-10 sm:py-12">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div><p className="eyebrow text-accent">EXPLORE. CREATE. SHARE.</p>
              <h1 className="display-cn mt-4 text-[clamp(36px,4.4vw,60px)] leading-[1.15]">让好技能，<span className="text-accent">为你所用。</span></h1>
              <p className="mt-4 max-w-[620px] text-base leading-relaxed text-muted">发现优秀 AI Skills，从使用场景到实际效果，找到适合你下一项任务的工具。</p>
            </div>
            <Link href="/submit" className="btn btn-outline">分享一个 Skill<ArrowUpRight size={16} /></Link>
          </div>
          <form action="/library" method="get" className="mt-7 flex max-w-[760px] flex-col gap-3 sm:flex-row">
            {category && <input type="hidden" name="category" value={category} />}
            {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
            <div className="relative min-w-0 flex-1"><Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
              <input key={q} type="search" name="q" defaultValue={q} maxLength={80} placeholder="搜索技能、使用场景，或你想解决的问题…" aria-label="搜索技能和使用场景" className="field !min-h-[56px] !pl-12 !text-base" />
            </div>
            <button type="submit" className="btn btn-primary !min-h-[56px] !px-7">搜索 Skills<ArrowUpRight size={16} /></button>
          </form>
          <p className="mt-4 text-sm text-faint">{totalSkills} 份技能 · {memberCount} 位成员 · {CATEGORIES.length} 个领域</p>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="shell py-7">
          <FeaturedSkills skills={featured.map((skill) => ({
            id: skill.id,
            slug: skill.slug,
            name: skill.name,
            tagline: skill.tagline,
            useCases: skill.useCases,
            categoryLabel: skill.categoryLabel,
            categoryColor: skill.categoryColor,
            tags: skill.tags.slice(0, 3),
          }))} />
        </section>
      )}

      <section
        aria-label="筛选技能"
        className="z-40 border-y border-line bg-paper/95 backdrop-blur-md"
      >
        <div className="shell flex flex-col gap-3 py-3.5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Link
              href={makeHref({ category: null })}
              aria-current={!category ? "page" : undefined}
              className={cn(
                "flex min-h-11 flex-none items-center gap-2 rounded-lg px-3 text-[12px] transition-colors",
                !category
                  ? "bg-accent text-on-accent"
                  : "text-muted hover:bg-raised hover:text-ink",
              )}
            >
              全部
              <span className={cn("font-mono text-[12px]", !category ? "text-on-accent" : "text-faint")}>
                {totalSkills}
              </span>
            </Link>
            {CATEGORIES.map((item) => {
              const active = category === item.slug;
              return (
                <Link
                  key={item.slug}
                  href={makeHref({ category: item.slug })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 flex-none items-center gap-2 rounded-lg px-3 text-[12px] transition-colors",
                    active
                      ? "bg-accent text-on-accent"
                      : "text-muted hover:bg-raised hover:text-ink",
                  )}
                >
                  <span
                    className="size-[5px] flex-none rounded-full"
                    style={{ backgroundColor: active ? "var(--color-on-accent)" : item.color }}
                  />
                  {item.label}
                  <span
                    className={cn(
                      "font-mono text-[12px]",
                      active ? "text-on-accent" : "text-faint",
                    )}
                  >
                    {categoryCounts[item.slug] ?? 0}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-0.5" aria-label="排序方式">
              {SORT_OPTIONS.map((option) => {
                const active = sort === option.value;
                return (
                  <Link
                    key={option.value}
                    href={makeHref({ sort: option.value })}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center px-3 py-2 text-sm transition-colors",
                      active
                        ? "text-ink underline decoration-accent decoration-1 underline-offset-4"
                        : "text-faint hover:text-ink",
                    )}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-9">
        <div className="mb-6 flex items-end justify-between gap-5 border-b border-line pb-3.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="display-cn text-[25px] leading-none text-ink">
                {hasFilters ? "检索结果" : "全部 Skills"}
              </h2>
              <span className="eyebrow text-faint">
                {hasFilters
                  ? q
                    ? `Search / ${q}`
                    : category
                      ? `Category / ${getCategory(category).english}`
                      : "Filtered"
                  : "Full collection"}
              </span>
            </div>
            {hasFilters && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-muted">
                <span>
                  找到 <span className="font-mono text-ink">{result.total}</span> 份档案
                </span>
                <span className="text-line-strong">·</span>
                <Link
                  href="/library"
                  className="link-underline text-muted hover:text-ink"
                >
                  清除所有筛选
                </Link>
              </p>
            )}
          </div>
          <p className="flex-none font-mono text-[12px] tracking-[0.1em] text-faint">
            {result.total.toString().padStart(2, "0")} ENTRIES
            {result.pageCount > 1 && ` · ${String(result.page).padStart(2, "0")} / ${String(result.pageCount).padStart(2, "0")}`}
          </p>
        </div>

        {result.skills.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {result.skills.map((skill) => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        ) : (
          <div className="relative overflow-hidden border border-dashed border-line-strong bg-raised/35 px-6 py-20 text-center">
            <SparkMark className="mx-auto size-7 text-accent/50" />
            <h3 className="display-cn mt-5 text-[30px] text-ink">没有找到这份档案。</h3>
            <p className="mx-auto mt-3 max-w-[320px] text-[14px] leading-[1.8] text-muted">
              试着换一个关键词，或者清空筛选条件。也有可能，这份技能正等着被你收录。
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
              <Link href="/library" className="btn btn-outline btn-sm">
                查看全部收录
              </Link>
              <Link href="/submit" className="btn btn-primary btn-sm">
                收录一份技能
              </Link>
            </div>
          </div>
        )}

        {result.pageCount > 1 && (
          <nav aria-label="分页" className="mt-10 flex items-center justify-between border-t border-line pt-5">
            {result.page > 1 ? (
              <Link
                href={makeHref({ page: result.page - 1 })}
                className="group flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink"
              >
                <ChevronLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
                上一页
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-[12px] text-line-strong">
                <ChevronLeft size={13} />
                上一页
              </span>
            )}

            <div className="flex items-center gap-1">
              {Array.from({ length: result.pageCount }, (_, index) => index + 1).map((pageNumber) => (
                <Link
                  key={pageNumber}
                  href={makeHref({ page: pageNumber })}
                  aria-current={pageNumber === result.page ? "page" : undefined}
                  className={cn(
                    "flex size-7 items-center justify-center font-mono text-[12px] transition-colors",
                    pageNumber === result.page
                      ? "bg-accent text-on-accent"
                      : "text-faint hover:bg-raised hover:text-ink",
                  )}
                >
                  {String(pageNumber).padStart(2, "0")}
                </Link>
              ))}
            </div>

            {result.page < result.pageCount ? (
              <Link
                href={makeHref({ page: result.page + 1 })}
                className="group flex items-center gap-1.5 text-[12px] text-muted transition-colors hover:text-ink"
              >
                下一页
                <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-[12px] text-line-strong">
                下一页
                <ChevronRight size={13} />
              </span>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
