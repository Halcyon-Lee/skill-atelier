import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getCategory } from "@/lib/categories";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (!query) return NextResponse.json({ results: [] });

  const like = `%${query.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;
  const rows = getDb()
    .prepare(
      `SELECT slug, name, tagline, category
       FROM skills
       WHERE name LIKE ? ESCAPE '\\' OR tagline LIKE ? ESCAPE '\\' OR tags LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\'
       ORDER BY view_count DESC, created_at DESC
       LIMIT 6`,
    )
    .all(like, like, like, like) as unknown as Array<{
    slug: string;
    name: string;
    tagline: string;
    category: string;
  }>;

  return NextResponse.json({
    results: rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      tagline: row.tagline,
      category: getCategory(row.category).label,
    })),
  });
}
