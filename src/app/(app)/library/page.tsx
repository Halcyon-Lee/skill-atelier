import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { SparkMark } from "@/components/brand";
import { FeaturedSkill } from "@/components/library/featured-skill";
import { SkillCard } from "@/components/library/skill-card";
import { requireUser } from "@/lib/auth";
import { CATEGORIES, getCategory, isCategory, type CategorySlug } from "@/lib/categories";
import {
  getCategoryCounts,
  getFeaturedSkill,
  getMembersCount,
  getSkillsCount,
  listSkills,
  type SkillSort,
} from "@/lib/skills";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "技能档案馆",
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
  const featured = !hasFilters ? getFeaturedSkill(user.id) : null;
  const showFeatured = Boolean(featured && page === 1);
  const result = listSkills(
    user.id,
    { q, category, sort, page, pageSize: 9 },
    featured?.id,
  );

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

  const issueDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  })
    .format(new Date())
    .toUpperCase();

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
              <p className="text-[12px] leading-relaxed text-muted">
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

      <section className="shell pt-11 pb-10 lg:pt-16">
        <div className="flex flex-col gap-10 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-[720px]">
            <div className="flex items-center gap-3">
              <span className="h-px w-9 bg-accent" />
              <span className="eyebrow text-muted">
                Private index · Vol. 01 / {issueDate}
              </span>
            </div>
            <h1 className="display-cn mt-6 text-[clamp(54px,7vw,96px)] leading-[0.94] text-balance">
              技能档案馆<span className="text-accent">.</span>
            </h1>
            <div className="mt-3 flex items-center gap-4">
              <p className="font-display text-[24px] leading-none text-muted italic sm:text-[28px]">
                The Skill Archive.
              </p>
              <span className="hidden h-px w-16 bg-line sm:block" />
            </div>
            <p className="mt-6 max-w-[560px] text-[13px] leading-[1.9] text-muted text-pretty">
              由成员共同维护的一份私有索引。我们只收录真正被使用过、反复打磨过的
              skills——以及它们背后那些值得被记住的判断。
            </p>
          </div>

          <div className="grid grid-cols-3 gap-7 border-t border-line pt-5 sm:gap-12 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-9">
            <Stat value={totalSkills} label="Entries" cnLabel="份收录" />
            <Stat value={memberCount} label="Members" cnLabel="位成员" />
            <Stat value={CATEGORIES.length} label="Fields" cnLabel="个领域" />
          </div>
        </div>
      </section>

      {showFeatured && featured && (
        <section className="shell pb-10">
          <FeaturedSkill skill={featured} />
        </section>
      )}

      <section
        aria-label="筛选技能"
        className="z-40 border-y border-line bg-paper/95 backdrop-blur-md lg:sticky lg:top-[76px]"
      >
        <div className="shell flex flex-col gap-3 py-3.5 xl:flex-row xl:items-center xl:justify-between">
          <div className="scrollbar-none -mx-1 flex items-center gap-0.5 overflow-x-auto px-1">
            <Link
              href={makeHref({ category: null })}
              aria-current={!category ? "page" : undefined}
              className={cn(
                "flex h-9 flex-none items-center gap-2 rounded-[2px] px-3 text-[11px] transition-colors",
                !category
                  ? "bg-ink text-cream"
                  : "text-muted hover:bg-raised hover:text-ink",
              )}
            >
              全部
              <span className={cn("font-mono text-[8.5px]", !category ? "text-cream/45" : "text-faint")}>
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
                    "flex h-9 flex-none items-center gap-2 rounded-[2px] px-3 text-[11px] transition-colors",
                    active
                      ? "bg-ink text-cream"
                      : "text-muted hover:bg-raised hover:text-ink",
                  )}
                >
                  <span
                    className="size-[5px] flex-none rounded-full"
                    style={{ backgroundColor: active ? "var(--color-cream)" : item.color }}
                  />
                  {item.label}
                  <span
                    className={cn(
                      "font-mono text-[8.5px]",
                      active ? "text-cream/45" : "text-faint",
                    )}
                  >
                    {categoryCounts[item.slug] ?? 0}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <form action="/library" method="get" className="relative">
              {category && <input type="hidden" name="category" value={category} />}
              {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
              <Search
                size={13}
                strokeWidth={1.8}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
              />
              <input
                key={q}
                type="search"
                name="q"
                defaultValue={q}
                placeholder="在档案中搜索…"
                aria-label="在档案中搜索"
                maxLength={80}
                className="h-9 w-[200px] rounded-[2px] border border-line bg-raised/45 pr-8 pl-8 text-[11.5px] text-ink transition-colors placeholder:text-faint focus:border-ink focus:bg-raised focus:outline-none sm:w-[230px] [&::-webkit-search-cancel-button]:hidden"
              />
              {q && (
                <Link
                  href={makeHref({ q: null })}
                  aria-label="清除搜索"
                  className="absolute top-1/2 right-2 flex size-5 -translate-y-1/2 items-center justify-center text-faint transition-colors hover:text-ink"
                >
                  <X size={11} />
                </Link>
              )}
              <button type="submit" className="sr-only">
                搜索
              </button>
            </form>

            <span className="hidden h-5 w-px bg-line sm:block" />

            <div className="flex items-center gap-0.5" aria-label="排序方式">
              {SORT_OPTIONS.map((option) => {
                const active = sort === option.value;
                return (
                  <Link
                    key={option.value}
                    href={makeHref({ sort: option.value })}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "px-2 py-1.5 text-[10.5px] transition-colors",
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
                {hasFilters ? "检索结果" : showFeatured ? "其余档案" : "全部档案"}
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
              <p className="mt-2 flex flex-wrap items-center gap-2 text-[10.5px] text-muted">
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
          <p className="flex-none font-mono text-[9px] tracking-[0.1em] text-faint">
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
            <p className="mx-auto mt-3 max-w-[320px] text-[12px] leading-[1.8] text-muted">
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
                className="group flex items-center gap-1.5 text-[11px] text-muted transition-colors hover:text-ink"
              >
                <ChevronLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
                上一页
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] text-line-strong">
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
                    "flex size-7 items-center justify-center font-mono text-[10px] transition-colors",
                    pageNumber === result.page
                      ? "bg-ink text-cream"
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
                className="group flex items-center gap-1.5 text-[11px] text-muted transition-colors hover:text-ink"
              >
                下一页
                <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] text-line-strong">
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

function Stat({ value, label, cnLabel }: { value: number; label: string; cnLabel: string }) {
  return (
    <div>
      <p className="font-display text-[34px] leading-none text-ink">
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-2 eyebrow text-[8px] text-faint">{label}</p>
      <p className="mt-1 text-[10px] text-muted">{cnLabel}</p>
    </div>
  );
}
