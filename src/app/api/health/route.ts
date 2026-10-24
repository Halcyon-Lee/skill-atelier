import { NextResponse } from "next/server";
import { ensureSeeded } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = ensureSeeded();
    db.prepare("SELECT 1 AS ok").get();

    return NextResponse.json(
      { status: "ok", service: "atelier" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
