"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, findUserByEmail, getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { checkInvite, inviteReasonMessage, normalizeInviteCode } from "@/lib/invites";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  clearRateLimit,
  consumeRateLimit,
  rateLimitMessage,
  requestIp,
} from "@/lib/rate-limit";
import { avatarColorFor } from "@/lib/utils";
import { safeReturnTo } from "@/lib/video/types";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: { name?: string; email?: string; code?: string };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function stringValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validateName(name: string): string | null {
  const length = Array.from(name).length;
  if (length < 2) return "名字至少需要 2 个字符。";
  if (length > 24) return "名字不能超过 24 个字符。";
  if (/[\u0000-\u001f]/.test(name)) return "名字包含无效字符。";
  return null;
}

export async function checkInviteAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const code = normalizeInviteCode(stringValue(formData, "code"));
  const ip = await requestIp();
  const limit = consumeRateLimit(`invite:${ip}`, 30, 600);

  if (!limit.ok) {
    return { error: rateLimitMessage(limit.retryAfter), values: { code } };
  }

  if (!code) {
    return { error: "请输入邀请码。", values: { code } };
  }

  const result = checkInvite(code);
  if (!result.valid) {
    return { error: inviteReasonMessage(result.reason), values: { code } };
  }

  redirect(`/join?code=${encodeURIComponent(result.invite.code)}&next=${encodeURIComponent(safeReturnTo(stringValue(formData, "next")))}`);
}

export async function loginAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = stringValue(formData, "email").toLowerCase();
  const password = stringValue(formData, "password");
  const ip = await requestIp();
  const ipLimit = consumeRateLimit(`login-ip:${ip}`, 20, 600);
  const emailLimit = consumeRateLimit(`login-email:${email || "empty"}`, 10, 600);

  if (!ipLimit.ok || !emailLimit.ok) {
    const retryAfter = Math.max(
      ipLimit.ok ? 0 : ipLimit.retryAfter,
      emailLimit.ok ? 0 : emailLimit.retryAfter,
    );
    return { error: rateLimitMessage(retryAfter), values: { email } };
  }

  if (!email || !password) {
    return { error: "请输入邮箱和密码。", values: { email } };
  }

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "邮箱或密码不正确。", values: { email } };
  }

  clearRateLimit(`login-email:${email}`);
  await createSession(user.id);
  redirect(safeReturnTo(stringValue(formData, "next")));
}

export async function registerAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const code = normalizeInviteCode(stringValue(formData, "code"));
  const name = stringValue(formData, "name");
  const email = stringValue(formData, "email").toLowerCase();
  const password = stringValue(formData, "password");
  const confirmPassword = stringValue(formData, "confirmPassword");
  const values = { code, name, email };

  const ip = await requestIp();
  const limit = consumeRateLimit(`register:${ip}`, 12, 3600);
  if (!limit.ok) {
    return { error: rateLimitMessage(limit.retryAfter), values };
  }

  const fieldErrors: Record<string, string> = {};
  const nameError = validateName(name);
  if (nameError) fieldErrors.name = nameError;
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    fieldErrors.email = "请输入有效的邮箱地址。";
  }
  if (password.length < 8) {
    fieldErrors.password = "密码至少需要 8 个字符。";
  } else if (password.length > 128) {
    fieldErrors.password = "密码不能超过 128 个字符。";
  }
  if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "两次输入的密码不一致。";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "请检查标出的字段。", fieldErrors, values };
  }

  const invite = checkInvite(code);
  if (!invite.valid) {
    return { error: inviteReasonMessage(invite.reason), values };
  }

  const db = getDb();
  const existing = db
    .prepare("SELECT 1 FROM users WHERE email = ? COLLATE NOCASE")
    .get(email);
  if (existing) {
    return {
      error: "这个邮箱已经有账号，试试直接登录。",
      fieldErrors: { email: "该邮箱已注册。" },
      values,
    };
  }

  let userId: number;
  const now = new Date().toISOString();

  db.exec("BEGIN IMMEDIATE");
  try {
    const freshInvite = checkInvite(code);
    if (!freshInvite.valid) {
      db.exec("ROLLBACK");
      return { error: inviteReasonMessage(freshInvite.reason), values };
    }

    const insert = db
      .prepare(
        `INSERT INTO users (email, name, password_hash, role, bio, avatar_color, created_at)
         VALUES (?, ?, ?, 'member', '', ?, ?)`,
      )
      .run(email, name, hashPassword(password), avatarColorFor(email), now);
    userId = Number(insert.lastInsertRowid);

    const use = db
      .prepare(
        `UPDATE invites
         SET used_count = used_count + 1
         WHERE id = ? AND (max_uses = 0 OR used_count < max_uses) AND revoked_at IS NULL`,
      )
      .run(freshInvite.invite.id);

    if (Number(use.changes) !== 1) {
      throw new Error("Invite could not be consumed");
    }

    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // The transaction may already be closed.
    }
    console.error("Registration failed", error);
    return { error: "暂时无法完成注册，请稍后重试。", values };
  }

  await createSession(userId);
  redirect(safeReturnTo(stringValue(formData, "next")));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

export type ProfileState = {
  error?: string;
  success?: boolean;
};

export async function changePasswordAction(
  _state: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const currentPassword = stringValue(formData, "currentPassword");
  const newPassword = stringValue(formData, "newPassword");
  const confirmPassword = stringValue(formData, "confirmPassword");

  if (!currentPassword) return { error: "请输入当前密码。" };
  if (newPassword.length < 8) return { error: "新密码至少需要 8 个字符。" };
  if (newPassword.length > 128) return { error: "新密码不能超过 128 个字符。" };
  if (newPassword !== confirmPassword) return { error: "两次输入的新密码不一致。" };

  const db = getDb();
  const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as
    | { password_hash: string }
    | undefined;
  if (!row || !verifyPassword(currentPassword, row.password_hash)) {
    return { error: "当前密码不正确。" };
  }

  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
    hashPassword(newPassword),
    user.id,
  );
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
  await createSession(user.id);

  return { success: true };
}

export async function updateProfileAction(
  _state: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const name = stringValue(formData, "name");
  const bio = stringValue(formData, "bio").slice(0, 160);
  const nameError = validateName(name);
  if (nameError) return { error: nameError };

  getDb()
    .prepare("UPDATE users SET name = ?, bio = ? WHERE id = ?")
    .run(name, bio, user.id);

  revalidatePath("/", "layout");
  return { success: true };
}
