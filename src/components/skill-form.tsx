"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AlertCircle, ArrowUpRight, LoaderCircle } from "lucide-react";
import {
  createSkillAction,
  updateSkillAction,
  type SkillFormState,
} from "@/actions/skills";
import { CATEGORIES, getCategory } from "@/lib/categories";
import type { SkillFormInitial } from "@/lib/skill-form";
import { ScreenshotPicker, type ScreenshotUpload } from "@/components/screenshot-picker";
import { normalizeTags } from "@/lib/utils";

const initialState: SkillFormState = {};

const EMPTY: SkillFormInitial = {
  name: "",
  tagline: "",
  description: "",
  useCases: "",
  exampleInput: "",
  exampleOutput: "",
  screenshots: [],
  category: "engineering",
  tags: "",
  version: "1.0.0",
  license: "MIT",
  sourceUrl: "",
  installCommand: "",
};

export function SkillForm({
  mode,
  slug,
  initial,
}: {
  mode: "create" | "edit";
  slug?: string;
  initial?: SkillFormInitial;
}) {
  const start = initial ?? EMPTY;
  const [uploads, setUploads] = useState<ScreenshotUpload[]>([]);
  const [screenshots, setScreenshots] = useState(start.screenshots);
  const [state, formAction, pending] = useActionState(async (previous: SkillFormState, data: FormData) => {
    for (const image of uploads) data.append("screenshots", image.file);
    return (mode === "edit" ? updateSkillAction : createSkillAction)(previous, data);
  }, initialState);
  const [name, setName] = useState(start.name);
  const [tagline, setTagline] = useState(start.tagline);
  const [description, setDescription] = useState(start.description);
  const [useCases, setUseCases] = useState(start.useCases);
  const [exampleInput, setExampleInput] = useState(start.exampleInput);
  const [exampleOutput, setExampleOutput] = useState(start.exampleOutput);
  const [version, setVersion] = useState(start.version);
  const [license, setLicense] = useState(start.license);
  const [sourceUrl, setSourceUrl] = useState(start.sourceUrl);
  const [installCommand, setInstallCommand] = useState(start.installCommand);
  const [category, setCategory] = useState(start.category);
  const [tags, setTags] = useState(start.tags);
  const errors = state.fieldErrors ?? {};
  const previewCategory = getCategory(category);
  const legacy = mode === "edit" && !start.useCases && !start.exampleInput && !start.exampleOutput;
  const previewTags = normalizeTags(tags).slice(0, 3);

  return (
    <form
      action={formAction}
      className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14"
      noValidate
    >
      {mode === "edit" && slug && <input type="hidden" name="slug" value={slug} />}

      <div className="min-w-0">
        {state.error && (
          <div
            role="alert"
            className="mb-8 flex items-start gap-2.5 border-l-2 border-danger bg-danger-soft px-4 py-3 text-[14px] leading-relaxed text-danger"
          >
            <AlertCircle size={15} className="mt-0.5 flex-none" />
            <span>{state.error}</span>
          </div>
        )}

        {legacy && <p className="mb-6 border-l-2 border-line-strong pl-3 text-[12px] leading-relaxed text-muted">这份旧档案尚无案例，可先保存原有信息；补充时请一并填写使用场景、任务输入和输出结果。</p>}
        <fieldset disabled={pending} className="border-t border-line pt-7">
          <legend className="sr-only">基础信息</legend>
          <SectionHeading
            index="01"
            title="这件工具是什么？"
            note="先让人一眼知道它解决什么问题。"
          />

          <div className="mt-6 grid gap-5">
            <div>
              <label htmlFor="skill-name" className="field-label">
                <span>名称 · Name *</span>
                <span className="normal-case tracking-normal text-faint">{name.length}/60</span>
              </label>
              <input
                id="skill-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
                required
                placeholder="例如：代码审阅"
                aria-invalid={Boolean(errors.name) || undefined}
                className="field !h-[54px] !text-[15px]"
              />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="skill-tagline" className="field-label">
                <span>描述 · 一句话介绍 *</span>
                <span className="normal-case tracking-normal text-faint">{tagline.length}/120</span>
              </label>
              <input
                id="skill-tagline"
                name="tagline"
                value={tagline}
                onChange={(event) => setTagline(event.target.value)}
                maxLength={120}
                required
                placeholder="像一位克制的资深工程师那样审阅改动，只指出真正会出问题的地方。"
                aria-invalid={Boolean(errors.tagline) || undefined}
                className="field"
              />
              <p className="field-hint">避免堆砌形容词。说清楚它为谁、在什么时候、带来什么改变。</p>
              {errors.tagline && <p className="field-error">{errors.tagline}</p>}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="skill-category" className="field-label">
                  分类 · Category *
                </label>
                <select
                  id="skill-category"
                  name="category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="field"
                >
                  {CATEGORIES.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.label} / {item.english}
                    </option>
                  ))}
                </select>
                <p className="field-hint">{previewCategory.description}</p>
                {errors.category && <p className="field-error">{errors.category}</p>}
              </div>

              <div>
                <label htmlFor="skill-tags" className="field-label">
                  标签 · Tags *
                </label>
                <input
                  id="skill-tags"
                  name="tags"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  maxLength={160}
                  required
                  placeholder="TypeScript, Code Review, Git"
                  aria-invalid={Boolean(errors.tags) || undefined}
                  className="field"
                />
                <p className="field-hint">用逗号分隔，最多 6 个。</p>
                {errors.tags && <p className="field-error">{errors.tags}</p>}
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset disabled={pending} className="mt-11 border-t border-line pt-7">
          <legend className="sr-only">使用场景</legend>
          <SectionHeading index="02" title="什么时候适合用？" note="说清楚谁在什么情况下，会需要这份 Skill。" />
          <div className="mt-6">
            <label htmlFor="skill-useCases" className="field-label"><span>使用场景 *</span><span>{useCases.length}/2000</span></label>
            <textarea id="skill-useCases" name="useCases" value={useCases} onChange={(event) => setUseCases(event.target.value)} rows={4} maxLength={2000}
              placeholder={"- 提交 PR 后，需要检查权限与边界问题\n- 上线前，希望快速定位高风险改动"} aria-invalid={Boolean(errors.useCases) || undefined} className="field !text-[16px] !leading-[1.85]" />
            <p className="field-hint">可以分行列出不同情境，支持 Markdown。</p>
            {errors.useCases && <p className="field-error">{errors.useCases}</p>}
          </div>
        </fieldset>

        <fieldset disabled={pending} className="mt-11 border-t border-line pt-7">
          <legend className="sr-only">实际案例</legend>
          <SectionHeading index="03" title="用了之后，能得到什么？" note="用一组真实的任务输入和输出结果说明效果，截图可选。" />
          <div className="mt-6 grid gap-5">
            {[
              { key: "exampleInput", label: "任务输入", value: exampleInput, change: setExampleInput, placeholder: "例如：请审查这份登录接口改动，重点检查会话过期和权限边界。" },
              { key: "exampleOutput", label: "输出结果", value: exampleOutput, change: setExampleOutput, placeholder: "粘贴实际产出或有代表性的片段，例如问题位置、严重程度和修复建议。" },
            ].map((field) => <div key={field.key}>
              <label htmlFor={`skill-${field.key}`} className="field-label"><span>{field.label} *</span><span>{field.value.length}/10000</span></label>
              <textarea id={`skill-${field.key}`} name={field.key} value={field.value} onChange={(event) => field.change(event.target.value)} rows={6} maxLength={10000}
                placeholder={field.placeholder} aria-invalid={Boolean(errors[field.key]) || undefined} className="field !text-[16px] !leading-[1.85]" />
              {errors[field.key] && <p className="field-error">{errors[field.key]}</p>}
            </div>)}
            <p className="field-hint">支持 Markdown 和代码块，可以保留能说明效果的关键片段。</p>
            <ScreenshotPicker existing={screenshots} onExistingChange={setScreenshots} uploads={uploads} onUploadsChange={setUploads} error={errors.screenshots} disabled={pending} />
          </div>
        </fieldset>

        <fieldset disabled={pending} className="mt-11 border-t border-line pt-7">
          <legend className="sr-only">技能文档</legend>
          <SectionHeading
            index="04"
            title="完整说明与安装。"
            note="补充工作方式、使用步骤与能力边界。支持 Markdown。"
          />

          <div className="mt-6 grid gap-5">
            <div>
              <label htmlFor="skill-description" className="field-label">
                <span>说明文档 · Documentation *</span>
                <span className="normal-case tracking-normal text-faint">
                  {description.length}/20000
                </span>
              </label>
              <textarea
                id="skill-description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={14}
                maxLength={20_000}
                required
                placeholder={`## 它解决什么\n\n...\n\n## 何时使用\n\n- ...\n\n## 工作方式\n\n1. ...`}
                aria-invalid={Boolean(errors.description) || undefined}
                className="field min-h-[280px] !text-[16px] !leading-[1.85]"
              />
              <div className="mt-2 flex flex-wrap justify-between gap-2 text-[12px] text-faint">
                <span>使用 ## 小标题、列表、引用与代码块让文档更易读。</span>
                <span className="font-mono">MARKDOWN</span>
              </div>
              {errors.description && <p className="field-error">{errors.description}</p>}
            </div>

            <div>
              <label htmlFor="skill-install" className="field-label">
                <span>安装命令 · Install</span>
                <span className="normal-case tracking-normal text-faint">可选但推荐</span>
              </label>
              <input
                id="skill-install"
                name="installCommand"
                value={installCommand}
                onChange={(event) => setInstallCommand(event.target.value)}
                maxLength={300}
                placeholder="npx skills add owner/repo --skill name"
                aria-invalid={Boolean(errors.installCommand) || undefined}
                className="field font-mono !text-[16px]"
              />
              {errors.installCommand && <p className="field-error">{errors.installCommand}</p>}
            </div>

            <div>
              <label htmlFor="skill-source" className="field-label">
                <span>来源链接 · Source</span>
                <span className="normal-case tracking-normal text-faint">可选</span>
              </label>
              <input
                id="skill-source"
                name="sourceUrl"
                type="url"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                maxLength={400}
                placeholder="https://github.com/..."
                aria-invalid={Boolean(errors.sourceUrl) || undefined}
                className="field font-mono !text-[16px]"
              />
              {errors.sourceUrl && <p className="field-error">{errors.sourceUrl}</p>}
            </div>
          </div>
        </fieldset>

        <fieldset disabled={pending} className="mt-11 border-t border-line pt-7">
          <legend className="sr-only">版本信息</legend>
          <SectionHeading index="05" title="版本与信任。" note="让成员知道他们正在使用什么。" />

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="skill-version" className="field-label">
                版本号 · Version *
              </label>
              <input
                id="skill-version"
                name="version"
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                maxLength={24}
                required
                placeholder="1.0.0"
                aria-invalid={Boolean(errors.version) || undefined}
                className="field font-mono !text-[16px]"
              />
              {errors.version && <p className="field-error">{errors.version}</p>}
            </div>
            <div>
              <label htmlFor="skill-license" className="field-label">
                许可 · License *
              </label>
              <input
                id="skill-license"
                name="license"
                value={license}
                onChange={(event) => setLicense(event.target.value)}
                maxLength={32}
                required
                placeholder="MIT"
                aria-invalid={Boolean(errors.license) || undefined}
                className="field font-mono !text-[16px]"
              />
              {errors.license && <p className="field-error">{errors.license}</p>}
            </div>
          </div>
        </fieldset>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="text-[12px] leading-relaxed text-faint">
            提交即表示你有权分享这份内容，并同意它仅限馆内成员浏览。
          </p>
          <div className="flex items-center gap-2.5">
            <Link
              href={mode === "edit" && slug ? `/skills/${slug}` : "/library"}
              className="btn btn-outline btn-sm"
            >
              取消
            </Link>
            <button type="submit" disabled={pending} className="btn btn-primary group btn-sm">
              {pending ? (
                <>
                  <LoaderCircle size={13} className="animate-spin" />
                  正在保存
                </>
              ) : (
                <>
                  {mode === "edit" ? "保存修改" : "分享 Skill"}
                  <ArrowUpRight
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-[100px]">
        <div className="border border-line bg-raised">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="eyebrow text-faint">Live preview / 预览</span>
            <span className="font-mono text-[12px] text-faint">DRAFT</span>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2">
              <span
                className="size-[6px] rounded-full"
                style={{ backgroundColor: previewCategory.color }}
              />
              <span className="eyebrow text-muted">{previewCategory.english}</span>
            </div>
            <p className="display-cn mt-5 min-h-[34px] text-[27px] leading-[1.15] text-ink">
              {name.trim() || "未命名技能"}
              {name.trim() && <span className="text-accent">.</span>}
            </p>
            <p className="mt-3 line-clamp-4 min-h-[62px] text-[12px] leading-[1.8] text-muted">
              {tagline.trim() || "一句话介绍会出现在这里。让人一眼知道这份技能的价值。"}
            </p>
            {useCases.trim() && <div className="mt-4 border-l-2 border-accent/30 pl-3"><p className="text-[12px] text-faint">适用场景</p><p className="mt-1 whitespace-pre-line text-[12px] leading-relaxed text-muted">{useCases.trim()}</p></div>}
            <div className="mt-5 flex flex-wrap gap-1.5">
              {previewTags.length > 0 ? (
                previewTags.map((tag) => (
                  <span key={tag} className="tag-pill !h-[21px] !px-2 !text-[12px]">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="tag-pill !h-[21px] !px-2 !text-[12px] !text-faint">标签</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <p className="eyebrow text-faint">收录准则</p>
          <ol className="mt-4 space-y-3.5">
            {[
              "只收录你真正使用过、愿意推荐给朋友的技能。",
              "写清楚适用场景与边界，而不只是罗列功能。",
              "保留来源与许可，尊重原作者的工作。",
            ].map((rule, index) => (
              <li key={rule} className="flex gap-3 text-[12px] leading-[1.75] text-muted">
                <span className="font-mono text-[12px] text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {rule}
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-6 border-l border-line-strong pl-3 text-[12px] leading-[1.7] text-faint">
          草稿不会自动保存。离开页面前请确认内容已提交。
        </p>
      </aside>
    </form>
  );
}

function SectionHeading({
  index,
  title,
  note,
}: {
  index: string;
  title: string;
  note: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="mt-1 font-mono text-[12px] tracking-[0.1em] text-accent">{index}</span>
      <div>
        <h2 className="display-cn text-[26px] leading-tight text-ink">{title}</h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-faint">{note}</p>
      </div>
    </div>
  );
}

export type { SkillFormInitial } from "@/lib/skill-form";
