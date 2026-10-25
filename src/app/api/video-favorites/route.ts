import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getVideoStyle } from "@/lib/video/catalog";
import { sameOrigin } from "@/lib/video/server";
import { isAdmin } from "@/lib/gallery/server";
export async function POST(request: Request) {
  if (!(await isAdmin())) return new Response(null, { status: 404 }); // internal-only since the showcase pivot
  const user=await getSessionUser();
  if(!user) return Response.json({error:"请先登录。"},{status:401});
  if(!sameOrigin(request)) return Response.json({error:"请求来源无效。"},{status:403});
  try {
    const {slug,favorite}=await request.json();
    if(!getVideoStyle(slug) || typeof favorite!=="boolean") return Response.json({error:"风格不存在。"},{status:400});
    const db=getDb();
    if(favorite) db.prepare("INSERT OR IGNORE INTO video_favorites(user_id,style_slug,created_at) VALUES(?,?,?)").run(user.id,slug,new Date().toISOString());
    else db.prepare("DELETE FROM video_favorites WHERE user_id=? AND style_slug=?").run(user.id,slug);
    return Response.json({favorite});
  } catch { return Response.json({error:"收藏失败，请稍后重试。"},{status:400}); }
}
