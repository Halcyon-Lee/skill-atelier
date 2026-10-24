"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Logo } from "@/components/brand";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="shell flex h-[82px] items-center justify-between border-b border-line">
        <Logo href="/" />
        <span className="eyebrow text-faint">System / Error</span>
      </div>
      <main className="shell flex flex-1 items-center py-20">
        <div className="max-w-[560px]">
          <span className="flex size-10 items-center justify-center rounded-full bg-danger-soft text-danger">
            <AlertTriangle size={17} />
          </span>
          <h1 className="display-cn mt-6 text-[clamp(44px,6vw,76px)] leading-[1.02]">
            创作空间暂时
            <br />
            没有回应<span className="text-accent">。</span>
          </h1>
          <p className="mt-5 max-w-[420px] text-[14px] leading-[1.85] text-muted">
            刚才的操作没有完成。可以再试一次；如果问题持续出现，请联系管理员检查服务状态。
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <button type="button" onClick={reset} className="btn btn-primary btn-sm">
              <RotateCcw size={13} />
              再试一次
            </button>
            <Link href="/" className="btn btn-outline btn-sm">
              返回首页
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
