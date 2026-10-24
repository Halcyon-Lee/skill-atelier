import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Logo, SparkMark } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="shell flex h-[82px] items-center justify-between border-b border-line">
        <Logo href="/" />
        <span className="eyebrow text-faint">Error / 404</span>
      </div>
      <main className="shell flex flex-1 items-center py-20">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-accent" />
              <span className="eyebrow text-muted">Scene not found</span>
            </div>
            <h1 className="display-cn mt-6 text-[clamp(52px,8vw,104px)] leading-[0.96]">
              这一页
              <br />
              暂时找不到<span className="text-accent">。</span>
            </h1>
            <p className="mt-6 max-w-[420px] text-[14px] leading-[1.85] text-muted">
              这个风格或作品可能已被移除。回到首页，寻找下一个值得讲述的故事。
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link href="/" className="btn btn-primary btn-sm">
                <ArrowLeft size={13} />
                返回首页
              </Link>
              <Link href="/works" className="btn btn-outline btn-sm">
                我的作品
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
          <div className="hidden text-ink/[0.045] lg:block" aria-hidden="true">
            <SparkMark className="size-[330px]" />
          </div>
        </div>
      </main>
      <div className="shell border-t border-line py-5">
        <p className="eyebrow text-faint">ATELIER · Pick a style. Tell your story.</p>
      </div>
    </div>
  );
}
