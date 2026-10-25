import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { toggleBookmark } from "@/lib/skills";
import { isAdmin } from "@/lib/gallery/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdmin())) return new Response(null, { status: 404 }); // internal-only since the showcase pivot
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录。" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式不正确。" }, { status: 400 });
  }

  const slug =
    body && typeof body === "object" && "slug" in body && typeof body.slug === "string"
      ? body.slug.trim()
      : "";

  if (!slug) {
    return NextResponse.json({ error: "缺少技能标识。" }, { status: 400 });
  }

  const result = toggleBookmark(user.id, slug);
  if (!result) {
    return NextResponse.json({ error: "没有找到这份技能。" }, { status: 404 });
  }

  return NextResponse.json(result);
}
