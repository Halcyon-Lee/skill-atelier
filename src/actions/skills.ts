"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { isCategory } from "@/lib/categories";
import { getDb } from "@/lib/db";
import { createUniqueSlug, getSkillBySlug } from "@/lib/skills";
import { normalizeTags } from "@/lib/utils";

export type SkillFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const skillSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "名称至少需要 2 个字符。")
    .max(60, "名称不能超过 60 个字符。"),
  tagline: z
    .string()
    .trim()
    .min(12, "一句话介绍至少需要 12 个字符。")
    .max(120, "一句话介绍不能超过 120 个字符。"),
  description: z
    .string()
    .trim()
    .min(40, "说明文档至少需要 40 个字符。")
    .max(20_000, "说明文档不能超过 20,000 个字符。"),
  category: z.string().refine(isCategory, "请选择有效的分类。"),
  tags: z.string().trim().min(1, "至少添加一个标签。").max(160, "标签过多。"),
  version: z
    .string()
    .trim()
    .min(1, "请填写版本号。")
    .max(24, "版本号过长。")
    .regex(/^[0-9A-Za-z][0-9A-Za-z.+_-]*$/, "版本号只能包含字母、数字与 . + _ -"),
  license: z.string().trim().min(1, "请填写许可协议。").max(32, "许可协议名称过长。"),
  sourceUrl: z
    .string()
    .trim()
    .max(400, "链接过长。")
    .refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    }, "来源链接必须是有效的 http(s) 地址。"),
  installCommand: z.string().trim().max(300, "安装命令不能超过 300 个字符。"),
});

function readSkillForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    tagline: String(formData.get("tagline") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    tags: String(formData.get("tags") ?? "").trim(),
    version: String(formData.get("version") ?? "").trim(),
    license: String(formData.get("license") ?? "").trim(),
    sourceUrl: String(formData.get("sourceUrl") ?? "").trim(),
    installCommand: String(formData.get("installCommand") ?? "").trim(),
  };
}

function mapZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export async function createSkillAction(
  _state: SkillFormState,
  formData: FormData,
): Promise<SkillFormState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const values = readSkillForm(formData);
  const parsed = skillSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "还差一点。请检查标出的字段。",
      fieldErrors: mapZodErrors(parsed.error),
    };
  }

  const tags = normalizeTags(parsed.data.tags);
  if (tags.length === 0) {
    return { error: "请检查标签。", fieldErrors: { tags: "至少添加一个有效标签。" } };
  }

  const now = new Date().toISOString();
  const slug = createUniqueSlug(parsed.data.name);
  const db = getDb();

  db.prepare(
    `INSERT INTO skills (
      slug, name, tagline, description, category, tags, version, license,
      source_url, install_command, author_id, featured, view_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
  ).run(
    slug,
    parsed.data.name,
    parsed.data.tagline,
    parsed.data.description,
    parsed.data.category,
    JSON.stringify(tags),
    parsed.data.version,
    parsed.data.license,
    parsed.data.sourceUrl || null,
    parsed.data.installCommand || null,
    user.id,
    now,
    now,
  );

  revalidatePath("/library");
  redirect(`/skills/${slug}?created=1`);
}

export async function updateSkillAction(
  _state: SkillFormState,
  formData: FormData,
): Promise<SkillFormState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const slug = String(formData.get("slug") ?? "").trim();
  const skill = getSkillBySlug(slug, user.id);
  if (!skill) return { error: "没有找到这份技能档案。" };
  if (skill.author.id !== user.id && user.role !== "admin") {
    return { error: "你只能编辑自己收录的技能。" };
  }

  const values = readSkillForm(formData);
  const parsed = skillSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: "还差一点。请检查标出的字段。",
      fieldErrors: mapZodErrors(parsed.error),
    };
  }

  const tags = normalizeTags(parsed.data.tags);
  if (tags.length === 0) {
    return { error: "请检查标签。", fieldErrors: { tags: "至少添加一个有效标签。" } };
  }

  getDb()
    .prepare(
      `UPDATE skills SET
        name = ?, tagline = ?, description = ?, category = ?, tags = ?,
        version = ?, license = ?, source_url = ?, install_command = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      parsed.data.name,
      parsed.data.tagline,
      parsed.data.description,
      parsed.data.category,
      JSON.stringify(tags),
      parsed.data.version,
      parsed.data.license,
      parsed.data.sourceUrl || null,
      parsed.data.installCommand || null,
      new Date().toISOString(),
      skill.id,
    );

  revalidatePath("/library");
  revalidatePath(`/skills/${slug}`);
  redirect(`/skills/${slug}?updated=1`);
}

export async function deleteSkillAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const slug = String(formData.get("slug") ?? "").trim();
  const skill = getSkillBySlug(slug, user.id);
  if (!skill) redirect("/library");
  if (skill.author.id !== user.id && user.role !== "admin") {
    redirect(`/skills/${slug}`);
  }

  getDb().prepare("DELETE FROM skills WHERE id = ?").run(skill.id);
  revalidatePath("/library");
  revalidatePath("/saved");
  redirect("/library?deleted=1");
}
