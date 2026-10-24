import "server-only";

import { pinyin } from "pinyin-pro";
import { getCategory, isCategory, type CategorySlug } from "@/lib/categories";
import { getDb } from "@/lib/db";
import { parseTags } from "@/lib/utils";

export type SkillSort = "newest" | "popular" | "title";

export type SkillRow = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  tags: string;
  version: string;
  license: string;
  source_url: string | null;
  install_command: string | null;
  author_id: number;
  featured: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_color: string;
  author_bio: string;
  bookmark_count: number;
  bookmarked: number;
};

export type Skill = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: CategorySlug;
  categoryLabel: string;
  categoryEnglish: string;
  categoryColor: string;
  tags: string[];
  version: string;
  license: string;
  sourceUrl: string | null;
  installCommand: string | null;
  author: {
    id: number;
    name: string;
    color: string;
    bio: string;
  };
  featured: boolean;
  viewCount: number;
  bookmarkCount: number;
  bookmarked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LibraryFilters = {
  q?: string;
  category?: string;
  sort?: SkillSort;
  page?: number;
  pageSize?: number;
};

const SKILL_SELECT = `
  SELECT
    s.*,
    u.name AS author_name,
    u.avatar_color AS author_color,
    u.bio AS author_bio,
    (SELECT COUNT(*) FROM bookmarks b WHERE b.skill_id = s.id) AS bookmark_count,
    EXISTS(SELECT 1 FROM bookmarks b WHERE b.skill_id = s.id AND b.user_id = ?) AS bookmarked
  FROM skills s
  JOIN users u ON u.id = s.author_id
`;

function mapSkill(row: SkillRow): Skill {
  const category = getCategory(row.category);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    category: category.slug,
    categoryLabel: category.label,
    categoryEnglish: category.english,
    categoryColor: category.color,
    tags: parseTags(row.tags),
    version: row.version,
    license: row.license,
    sourceUrl: row.source_url,
    installCommand: row.install_command,
    author: {
      id: row.author_id,
      name: row.author_name,
      color: row.author_color,
      bio: row.author_bio,
    },
    featured: Boolean(row.featured),
    viewCount: row.view_count,
    bookmarkCount: Number(row.bookmark_count),
    bookmarked: Boolean(row.bookmarked),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

type QueryPart = { clause: string; params: Array<string | number> };

function buildFilters(filters: LibraryFilters): QueryPart {
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  const q = filters.q?.trim();
  if (q) {
    const like = `%${escapeLike(q)}%`;
    clauses.push(
      "(s.name LIKE ? ESCAPE '\\' OR s.tagline LIKE ? ESCAPE '\\' OR s.tags LIKE ? ESCAPE '\\' OR s.description LIKE ? ESCAPE '\\')",
    );
    params.push(like, like, like, like);
  }

  if (filters.category && isCategory(filters.category)) {
    clauses.push("s.category = ?");
    params.push(filters.category);
  }

  return {
    clause: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

export function listSkills(
  userId: number,
  filters: LibraryFilters,
  excludeId?: number,
): { skills: Skill[]; total: number; page: number; pageCount: number } {
  const db = getDb();
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const pageSize = Math.min(24, Math.max(1, Math.floor(filters.pageSize ?? 9)));
  const built = buildFilters(filters);
  const exclusion = excludeId ? " AND s.id != ?" : "";
  const where = built.clause ? `${built.clause}${exclusion}` : excludeId ? "WHERE s.id != ?" : "";
  const params: Array<string | number> = [userId, ...built.params];
  if (excludeId) params.push(excludeId);

  const countRow = db
    .prepare(`SELECT COUNT(*) AS count FROM skills s ${where}`)
    .get(...built.params, ...(excludeId ? [excludeId] : [])) as { count: number };
  const total = Number(countRow.count);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);

  let orderBy = "s.created_at DESC, s.id DESC";
  if (filters.sort === "popular") {
    orderBy =
      "(SELECT COUNT(*) FROM bookmarks b2 WHERE b2.skill_id = s.id) DESC, s.view_count DESC, s.id DESC";
  } else if (filters.sort === "title") {
    orderBy = "s.name COLLATE NOCASE ASC";
  }

  const rows = db
    .prepare(`${SKILL_SELECT} ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
    .all(...params, pageSize, (safePage - 1) * pageSize) as unknown as SkillRow[];

  return {
    skills: rows.map(mapSkill),
    total,
    page: safePage,
    pageCount,
  };
}

export function getSkillBySlug(slug: string, userId: number): Skill | null {
  const row = getDb()
    .prepare(`${SKILL_SELECT} WHERE s.slug = ?`)
    .get(userId, slug) as unknown as SkillRow | undefined;
  return row ? mapSkill(row) : null;
}

export function getSkillById(id: number, userId: number): Skill | null {
  const row = getDb()
    .prepare(`${SKILL_SELECT} WHERE s.id = ?`)
    .get(userId, id) as unknown as SkillRow | undefined;
  return row ? mapSkill(row) : null;
}

export function getFeaturedSkill(userId: number): Skill | null {
  const row = getDb()
    .prepare(`${SKILL_SELECT} WHERE s.featured = 1 ORDER BY s.created_at DESC, s.id DESC LIMIT 1`)
    .get(userId) as unknown as SkillRow | undefined;
  return row ? mapSkill(row) : null;
}

export function getRelatedSkills(skill: Skill, userId: number, limit = 3): Skill[] {
  const rows = getDb()
    .prepare(
      `${SKILL_SELECT} WHERE s.category = ? AND s.id != ? ORDER BY s.view_count DESC, s.id DESC LIMIT ?`,
    )
    .all(userId, skill.category, skill.id, limit) as unknown as SkillRow[];
  return rows.map(mapSkill);
}

export function getBookmarkedSkills(userId: number): Skill[] {
  const rows = getDb()
    .prepare(
      `${SKILL_SELECT}
       WHERE EXISTS(SELECT 1 FROM bookmarks b2 WHERE b2.skill_id = s.id AND b2.user_id = ?)
       ORDER BY s.created_at DESC, s.id DESC`,
    )
    .all(userId, userId) as unknown as SkillRow[];
  return rows.map(mapSkill);
}

export function getSkillsByAuthor(userId: number, authorId: number): Skill[] {
  const rows = getDb()
    .prepare(`${SKILL_SELECT} WHERE s.author_id = ? ORDER BY s.created_at DESC, s.id DESC`)
    .all(userId, authorId) as unknown as SkillRow[];
  return rows.map(mapSkill);
}

export function getCategoryCounts(): Record<string, number> {
  const rows = getDb()
    .prepare("SELECT category, COUNT(*) AS count FROM skills GROUP BY category")
    .all() as unknown as Array<{ category: string; count: number }>;
  return Object.fromEntries(rows.map((row) => [row.category, Number(row.count)]));
}

export function getSkillsCount(): number {
  const row = getDb().prepare("SELECT COUNT(*) AS count FROM skills").get() as { count: number };
  return Number(row.count);
}

export function getMembersCount(): number {
  const row = getDb().prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number };
  return Number(row.count);
}

export function incrementViewCount(slug: string): void {
  getDb().prepare("UPDATE skills SET view_count = view_count + 1 WHERE slug = ?").run(slug);
}

export function toggleBookmark(
  userId: number,
  slug: string,
): { saved: boolean; count: number } | null {
  const db = getDb();
  const skill = db.prepare("SELECT id FROM skills WHERE slug = ?").get(slug) as
    | { id: number }
    | undefined;
  if (!skill) return null;

  const existing = db
    .prepare("SELECT 1 FROM bookmarks WHERE user_id = ? AND skill_id = ?")
    .get(userId, skill.id);

  if (existing) {
    db.prepare("DELETE FROM bookmarks WHERE user_id = ? AND skill_id = ?").run(userId, skill.id);
  } else {
    db.prepare("INSERT OR IGNORE INTO bookmarks (user_id, skill_id, created_at) VALUES (?, ?, ?)").run(
      userId,
      skill.id,
      new Date().toISOString(),
    );
  }

  const count = db
    .prepare("SELECT COUNT(*) AS count FROM bookmarks WHERE skill_id = ?")
    .get(skill.id) as { count: number };

  return { saved: !existing, count: Number(count.count) };
}

export function slugifySkillName(name: string): string {
  let latin = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (/\p{Script=Han}/u.test(name)) {
    latin = pinyin(name, { toneType: "none", type: "array", nonZh: "consecutive" }).join(" ");
  }

  return (
    latin
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 56) || "skill"
  );
}

export function createUniqueSlug(name: string): string {
  const db = getDb();
  const base = slugifySkillName(name);
  let candidate = base;
  let suffix = 2;
  const exists = db.prepare("SELECT 1 FROM skills WHERE slug = ?");

  while (exists.get(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
