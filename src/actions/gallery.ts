"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import {
  createVideo, deleteVideo, findAdminVideo, GalleryError, parseVideoInput, saveSiteSetting, setVideoFile, updateVideo, getSiteSettings,
} from "@/lib/gallery/model";
import { removeGalleryFile, removeVideoFolder, saveImage } from "@/lib/gallery/files";
import { isAdmin } from "@/lib/gallery/server";

export type GalleryActionState = { error?: string; saved?: number };

function file(form: FormData, name: string) {
  const value = form.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

export async function saveVideoAction(_state: GalleryActionState, form: FormData): Promise<GalleryActionState> {
  if (!(await isAdmin())) return { error: "只有管理员可以编辑视频。" };
  const db = getDb(), id = String(form.get("id") ?? "");
  let saved;
  try {
    const raw = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === "string"));
    const input = parseVideoInput(raw);
    const existing = id ? findAdminVideo(db, id) : null;
    if (id && !existing) return { error: "找不到这条视频，可能已被删除。" };
    // Images are stored before the record update so a newly uploaded cover can satisfy the publish check.
    const target = existing ?? createVideo(db, input);
    const poster = file(form, "poster"), proof = file(form, "proof");
    if (poster) { const path = await saveImage(poster, target.id, "poster", 1080); setVideoFile(db, target.id, "poster_path", path); removeGalleryFile(target.poster_path); }
    if (proof) { const path = await saveImage(proof, target.id, "proof", 2000); setVideoFile(db, target.id, "metrics_proof_path", path); removeGalleryFile(target.metrics_proof_path); }
    saved = existing ? updateVideo(db, target.id, input) : findAdminVideo(db, target.id)!;
  } catch (error) {
    if (error instanceof GalleryError) return { error: error.message };
    console.error("Save gallery video failed", error);
    return { error: "保存失败，请重试。" };
  }
  revalidatePath("/");
  revalidatePath(`/v/${saved.slug}`);
  revalidatePath("/admin/gallery");
  if (!id) redirect(`/admin/gallery/${saved.id}?created=1`);
  return { saved: Date.now() };
}

export async function deleteVideoAction(form: FormData) {
  if (!(await isAdmin())) redirect("/");
  const id = String(form.get("id") ?? "");
  if (findAdminVideo(getDb(), id)) {
    deleteVideo(getDb(), id);
    removeVideoFolder(id);
  }
  revalidatePath("/");
  redirect("/admin/gallery");
}

export async function saveSettingsAction(_state: GalleryActionState, form: FormData): Promise<GalleryActionState> {
  if (!(await isAdmin())) return { error: "只有管理员可以修改设置。" };
  const db = getDb();
  const wechatId = String(form.get("wechat_id") ?? "").trim(), headline = String(form.get("consult_headline") ?? "").trim();
  if (wechatId.length > 40) return { error: "微信号最多 40 个字符。" };
  if (headline.length > 40) return { error: "引导语最多 40 字。" };
  try {
    const qr = file(form, "wechat_qr"), previous = getSiteSettings(db).wechat_qr_path;
    if (qr) { saveSiteSetting(db, "wechat_qr_path", await saveImage(qr, "site", "wechat-qr", 800)); removeGalleryFile(previous); }
    else if (form.get("remove_qr") === "on") { saveSiteSetting(db, "wechat_qr_path", null); removeGalleryFile(previous); }
  } catch (error) {
    if (error instanceof GalleryError) return { error: error.message };
    throw error;
  }
  saveSiteSetting(db, "wechat_id", wechatId);
  saveSiteSetting(db, "consult_headline", headline || null);
  revalidatePath("/", "layout");
  return { saved: Date.now() };
}
