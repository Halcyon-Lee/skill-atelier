import { getDb } from "@/lib/db";
import { getSiteSettings } from "@/lib/gallery/model";
import { imageResponse } from "@/lib/gallery/files";
import { isMember } from "@/lib/gallery/server";

export async function GET() {
  if (!(await isMember())) return new Response(null, { status: 401 });
  return imageResponse(getSiteSettings(getDb()).wechat_qr_path, "private");
}
