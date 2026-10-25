"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { isCategory } from "@/lib/categories";
import { getDb } from "@/lib/db";
import { createUniqueSlug, getSkillBySlug } from "@/lib/skills";
import { validateShowcase } from "@/lib/showcase-rules";
import { listScreenshots, prepareScreenshots, removeScreenshotFiles, saveScreenshotRecords, ScreenshotError, writeScreenshotFiles } from "@/lib/screenshots";
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
  useCases: z.string(),
  exampleInput: z.string(),
  exampleOutput: z.string(),
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
    useCases: String(formData.get("useCases") ?? "").trim(),
    exampleInput: String(formData.get("exampleInput") ?? "").trim(),
    exampleOutput: String(formData.get("exampleOutput") ?? "").trim(),
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

export async function createSkillAction(_state: SkillFormState, formData: FormData): Promise<SkillFormState> {
  return persistSkill(formData, false);
}

export async function updateSkillAction(_state: SkillFormState, formData: FormData): Promise<SkillFormState> {
  return persistSkill(formData, true);
}

async function persistSkill(formData: FormData, editing: boolean): Promise<SkillFormState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") return { error: "技能档案目前只对管理员开放。" };
  const original = editing ? getSkillBySlug(String(formData.get("slug") ?? "").trim(), user.id) : null;
  if (editing && !original) return { error: "没有找到这份技能档案。" };
  if (original && original.author.id !== user.id && user.role !== "admin") {
    return { error: "你只能编辑自己收录的技能。" };
  }

  const values = readSkillForm(formData);
  const parsed = skillSchema.safeParse(values);
  const legacy = Boolean(original && !original.useCases && !original.exampleInput && !original.exampleOutput);
  const errors = { ...(!parsed.success ? mapZodErrors(parsed.error) : {}), ...validateShowcase(values, legacy) };
  if (Object.keys(errors).length) return { error: "还差一点。请检查标出的字段。", fieldErrors: errors };
  if (!parsed.success) return { error: "请检查填写的内容。" };
  const tags = normalizeTags(values.tags);
  if (!tags.length) return { error: "请检查标签。", fieldErrors: { tags: "至少添加一个有效标签。" } };

  const db = getDb();
  let plan: Awaited<ReturnType<typeof prepareScreenshots>>;
  try {
    plan = await prepareScreenshots(formData, original ? listScreenshots(db, original.id) : []);
    if ((plan.kept.length || plan.uploads.length) && !values.exampleOutput) {
      return { error: "请先补充文字案例。", fieldErrors: { exampleOutput: "添加截图时请一并填写任务输入和输出结果。" } };
    }
  } catch (error) {
    return { error: "截图未能保存。", fieldErrors: { screenshots: error instanceof ScreenshotError ? error.message : "无法处理截图，请重试。" } };
  }

  let slug = original?.slug ?? "";
  let transaction = false;
  try {
    writeScreenshotFiles(plan.uploads);
    db.exec("BEGIN IMMEDIATE");
    transaction = true;
    const now = new Date().toISOString();
    const params = [values.name, values.tagline, values.description, values.category, JSON.stringify(tags),
      values.version, values.license, values.sourceUrl || null, values.installCommand || null,
      values.useCases, values.exampleInput, values.exampleOutput, now];
    let skillId: number;
    if (original) {
      const result = db.prepare(`UPDATE skills SET name = ?, tagline = ?, description = ?, category = ?, tags = ?,
        version = ?, license = ?, source_url = ?, install_command = ?, use_cases = ?, example_input = ?, example_output = ?, updated_at = ?
        WHERE id = ? AND (author_id = ? OR ? = 'admin')`).run(...params, original.id, user.id, user.role);
      if (Number(result.changes) !== 1) throw new Error("Skill changed while saving");
      skillId = original.id;
    } else {
      slug = createUniqueSlug(values.name);
      const result = db.prepare(`INSERT INTO skills (name, tagline, description, category, tags, version, license,
        source_url, install_command, use_cases, example_input, example_output, updated_at, slug, author_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(...params, slug, user.id, now);
      skillId = Number(result.lastInsertRowid);
    }
    saveScreenshotRecords(db, skillId, plan);
    db.exec("COMMIT");
    transaction = false;
  } catch (error) {
    if (transaction) db.exec("ROLLBACK");
    removeScreenshotFiles(plan.uploads);
    console.error("Skill save failed", error);
    return { error: "保存失败，内容已保留，请稍后重试。" };
  }
  removeScreenshotFiles(plan.removed);
  revalidatePath("/library");
  revalidatePath("/saved");
  revalidatePath("/admin");
  revalidatePath(`/skills/${slug}`);
  redirect(`/skills/${slug}?${editing ? "updated" : "created"}=1`);
}

export async function deleteSkillAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  const slug = String(formData.get("slug") ?? "").trim();
  const skill = getSkillBySlug(slug, user.id);
  if (!skill) redirect("/library");
  if (skill.author.id !== user.id && user.role !== "admin") {
    redirect(`/skills/${slug}`);
  }

  const db = getDb();
  const images = listScreenshots(db, skill.id);
  db.prepare("DELETE FROM skills WHERE id = ?").run(skill.id);
  removeScreenshotFiles(images);
  revalidatePath("/library");
  revalidatePath("/saved");
  redirect("/library?deleted=1");
}
