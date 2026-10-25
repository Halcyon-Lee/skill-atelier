import { getDb } from "@/lib/db";
import { recordConsultClick } from "@/lib/gallery/model";
import { consumeRateLimit, requestIp } from "@/lib/rate-limit";
import { isMember } from "@/lib/gallery/server";
import { sameOrigin } from "@/lib/video/server";

// Counts how often the WeChat QR on a video page was seen, so the team can tell which videos bring in enquiries.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  if (!(await isMember())) return new Response(null, { status: 401 });
  const { id } = await params;
  // One count per visitor per video per hour keeps reloads from inflating the number.
  if (!consumeRateLimit(`gallery-consult:${await requestIp()}:${id}`, 1, 3600).ok) return new Response(null, { status: 204 });
  return new Response(null, { status: recordConsultClick(getDb(), id) ? 204 : 404 });
}
