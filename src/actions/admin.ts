"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export type InviteActionState = {
  error?: string;
  created?: {
    code: string;
    note: string;
    maxUses: number;
    expiresAt: string | null;
  };
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  const bytes = randomBytes(8);
  let raw = "";
  for (const byte of bytes) raw += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return `ATL-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

function uniqueCode(): string {
  const db = getDb();
  const exists = db.prepare("SELECT 1 FROM invites WHERE code = ?");
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateCode();
    if (!exists.get(code)) return code;
  }
  throw new Error("Could not generate a unique invite code");
}

export async function createInviteAction(
  _state: InviteActionState,
  formData: FormData,
): Promise<InviteActionState> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return { error: "只有馆员可以创建邀请。" };
  }

  const note = String(formData.get("note") ?? "").trim().slice(0, 80);
  const maxUses = Number.parseInt(String(formData.get("maxUses") ?? "1"), 10);
  const expiresDays = Number.parseInt(String(formData.get("expiresDays") ?? "30"), 10);

  if (!Number.isFinite(maxUses) || maxUses < 1 || maxUses > 100) {
    return { error: "席位数需要在 1 到 100 之间。" };
  }
  if (![0, 7, 30, 90, 180].includes(expiresDays)) {
    return { error: "请选择有效的有效期。" };
  }

  const code = uniqueCode();
  const now = new Date();
  const expiresAt =
    expiresDays === 0 ? null : new Date(now.getTime() + expiresDays * 86_400_000).toISOString();

  getDb()
    .prepare(
      `INSERT INTO invites (code, created_by, note, max_uses, used_count, expires_at, created_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
    )
    .run(code, user.id, note || "馆员邀请", maxUses, expiresAt, now.toISOString());

  revalidatePath("/admin");
  return { created: { code, note: note || "馆员邀请", maxUses, expiresAt } };
}

export async function revokeInviteAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/library");

  const id = Number.parseInt(String(formData.get("id") ?? ""), 10);
  if (!Number.isFinite(id)) redirect("/admin#invites");

  getDb()
    .prepare("UPDATE invites SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL")
    .run(new Date().toISOString(), id);

  revalidatePath("/admin");
  redirect("/admin?notice=invite-revoked#invites");
}

export async function toggleFeaturedAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/library");

  const id = Number.parseInt(String(formData.get("id") ?? ""), 10);
  if (!Number.isFinite(id)) redirect("/admin#skills");

  getDb().prepare("UPDATE skills SET featured = CASE featured WHEN 1 THEN 0 ELSE 1 END WHERE id = ?").run(id);

  revalidatePath("/library");
  revalidatePath("/admin");
  redirect("/admin?notice=featured#skills");
}
