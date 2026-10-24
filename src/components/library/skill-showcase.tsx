import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Markdown } from "@/components/markdown";
import type { Skill } from "@/lib/skills";

export function SkillShowcase({ skill }: { skill: Skill }) {
  const complete = Boolean(skill.exampleInput && skill.exampleOutput);
  return (
    <div className="mb-12 space-y-10">
      <section aria-labelledby="use-cases-title">
        <p className="eyebrow text-accent">01 / When to use</p>
        <h2 id="use-cases-title" className="display-cn mt-2 text-[28px] text-ink">使用场景</h2>
        {skill.useCases ? <div className="mt-4"><Markdown content={skill.useCases} /></div> : <p className="mt-4 text-[14px] text-faint">作者尚未补充使用场景。</p>}
      </section>
      <section aria-labelledby="example-title" className="border-t border-line pt-8">
        <p className="eyebrow text-accent">02 / In practice</p>
        <h2 id="example-title" className="display-cn mt-2 text-[28px] text-ink">实现效果</h2>
        <p className="mt-2 text-[12px] leading-relaxed text-faint">从一个具体任务，看看这份 Skill 能带来什么。</p>
        {complete ? <div className="mt-5">
          <div className="border border-line bg-raised p-5 sm:p-6">
            <h3 className="mb-4 text-[12px] font-medium text-muted">任务输入</h3>
            <Markdown content={skill.exampleInput} />
          </div>
          <div className="flex items-center gap-2 py-3 pl-5 text-[12px] text-faint"><ArrowDown size={14} /><span>使用 Skill</span></div>
          <div className="border border-moss/25 bg-moss/[0.04] p-5 sm:p-6">
            <h3 className="mb-4 text-[12px] font-medium text-moss">输出结果</h3>
            <Markdown content={skill.exampleOutput} />
          </div>
          {skill.screenshots.length > 0 && <div className="mt-5 grid gap-4">
            {skill.screenshots.map((image, index) => <figure key={image.id} className="min-w-0 overflow-hidden border border-line bg-raised">
              <a href={image.url} target="_blank" rel="noopener noreferrer" aria-label={`查看 ${skill.name} 效果截图 ${index + 1} 原图（新标签页）`}>
                <Image unoptimized src={image.url} alt={`${skill.name} 效果截图 ${index + 1}`} width={1280} height={720} className="h-auto max-h-[620px] w-full object-contain" />
                <figcaption className="flex items-center justify-between border-t border-line px-4 py-3 text-[12px] text-faint">效果截图 {index + 1}<span className="flex items-center gap-1">查看原图<ArrowUpRight size={11} /></span></figcaption>
              </a>
            </figure>)}
          </div>}
        </div> : <div className="mt-5 border border-dashed border-line-strong px-5 py-7 text-[14px] leading-relaxed text-faint">作者尚未补充案例。</div>}
      </section>
      <div className="border-t border-line pt-8"><p className="eyebrow text-accent">03 / Documentation</p><h2 className="display-cn mt-2 text-[28px] text-ink">完整说明</h2></div>
    </div>
  );
}
