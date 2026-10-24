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
              <span className="eyebrow text-muted">Not in the archive</span>
            </div>
            <h1 className="display-cn mt-6 text-[clamp(52px,8vw,104px)] leading-[0.96]">
              这一页
              <br />
              不在馆藏里<span className="text-accent">。</span>
            </h1>
            <p className="mt-6 max-w-[420px] text-[13px] leading-[1.85] text-muted">
              它可能已经被移出档案馆，或者从未存在过。回到档案库，继续翻找真正值得留下的东西。
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link href="/library" className="btn btn-primary btn-sm">
                <ArrowLeft size={13} />
                返回档案馆
              </Link>
              <Link href="/" className="btn btn-outline btn-sm">
                邀请入口
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
        <p className="eyebrow text-faint">ATELIER · Curated in private</p>
      </div>
    </div>
  );
}
