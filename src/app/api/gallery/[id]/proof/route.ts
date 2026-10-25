import { getDb } from "@/lib/db";
import { findAdminVideo } from "@/lib/gallery/model";
import { imageResponse } from "@/lib/gallery/files";
import { isAdmin } from "@/lib/gallery/server";

// The Douyin metrics screenshot is evidence for the team only.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response(null, { status: 404 });
  return imageResponse(findAdminVideo(getDb(), (await params).id)?.metrics_proof_path ?? null, "private");
}
