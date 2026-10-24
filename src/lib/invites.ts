import "server-only";

import { ensureSeeded } from "@/lib/db";

export type InviteRow = {
  id: number;
  code: string;
  created_by: number;
  note: string;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  creator_name?: string;
};

export type InviteCheck =
  | { valid: true; invite: InviteRow }
  | { valid: false; reason: "invalid" | "revoked" | "expired" | "exhausted" };

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function checkInvite(code: string): InviteCheck {
  const normalized = normalizeInviteCode(code);
  if (!normalized) return { valid: false, reason: "invalid" };

  const row = ensureSeeded()
    .prepare(
      `SELECT i.*, u.name AS creator_name
       FROM invites i JOIN users u ON u.id = i.created_by
       WHERE i.code = ? COLLATE NOCASE`,
    )
    .get(normalized) as InviteRow | undefined;

  if (!row) return { valid: false, reason: "invalid" };
  if (row.revoked_at) return { valid: false, reason: "revoked" };
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
    return { valid: false, reason: "expired" };
  }
  if (row.max_uses > 0 && row.used_count >= row.max_uses) return { valid: false, reason: "exhausted" };

  return { valid: true, invite: row };
}

export function inviteReasonMessage(reason: "invalid" | "revoked" | "expired" | "exhausted"): string {
  switch (reason) {
    case "revoked":
      return "这张邀请函已被收回。";
    case "expired":
      return "这张邀请函已经过期。";
    case "exhausted":
      return "这张邀请函的席位已经用完。";
    default:
      return "邀请码无效，请检查后重试。";
  }
}

export function getInviteStatus(invite: InviteRow): {
  label: string;
  tone: "active" | "muted" | "closed";
} {
  if (invite.revoked_at) return { label: "已撤销", tone: "closed" };
  if (invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()) {
    return { label: "已过期", tone: "closed" };
  }
  if (invite.max_uses > 0 && invite.used_count >= invite.max_uses) return { label: "已用尽", tone: "muted" };
  return { label: "有效", tone: "active" };
}
