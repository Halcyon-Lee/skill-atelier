import Link from "next/link";
import { SparkMark, Logo } from "@/components/brand";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.04fr_0.96fr]">
      <aside className="relative hidden overflow-hidden bg-dark px-11 py-9 text-cream lg:flex lg:flex-col xl:px-16 xl:py-11">
        <div className="rule-grid absolute inset-0 opacity-[0.07]" />
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 size-[420px] rounded-full border border-cream/10"
        />
        <div
          aria-hidden="true"
          className="absolute top-[9%] right-[9%] size-2 rounded-full bg-accent"
        />
        <div aria-hidden="true" className="absolute right-8 bottom-[16%] text-cream/[0.045]">
          <SparkMark className="size-[390px]" />
        </div>

        <div className="relative z-10 flex items-start justify-between">
          <Logo href="/" inverted />
          <span className="eyebrow mt-2 text-cream/35">Est. 2026</span>
        </div>

        <div className="relative z-10 my-auto max-w-[530px] py-16">
          <div className="mb-8 flex items-center gap-3">
            <span className="h-px w-8 bg-accent" />
            <span className="eyebrow text-cream/45">The members&apos; room</span>
          </div>
          <p className="display max-w-[500px] text-[clamp(44px,4.4vw,68px)] leading-[1.01]">
            The best tools
            <br />
            are passed
            <br />
            <em className="text-accent-soft/95">hand to hand.</em>
          </p>
          <p className="mt-9 max-w-[330px] text-[13.5px] leading-[1.85] text-cream/50">
            好工具从来不是被算法推到你面前的。它们由信任的人，亲手递过来。
          </p>
        </div>

        <div className="relative z-10 flex items-end justify-between border-t border-cream/15 pt-5">
          <div className="eyebrow leading-[1.8] text-cream/35">
            Private skill archive
            <br />
            Invitation · Members only
          </div>
          <div className="flex items-center gap-2 text-cream/40">
            <span className="micro">No. 001</span>
            <span className="size-1 rounded-full bg-accent" />
            <span className="micro">MMXXVI</span>
          </div>
        </div>
      </aside>

      <main className="relative flex min-h-dvh flex-col px-6 py-6 sm:px-10 lg:px-14 xl:px-20">
        <div className="flex items-center justify-between lg:hidden">
          <Logo href="/" />
          <Link
            href="/"
            className="micro text-faint transition-colors hover:text-ink"
          >
            返回入口
          </Link>
        </div>

        <div className="flex flex-1 items-center py-12 sm:py-16">
          <div className="animate-rise mx-auto w-full max-w-[390px]">{children}</div>
        </div>

        <div className="mx-auto flex w-full max-w-[390px] items-center justify-between border-t border-line pt-5">
          <Link
            href="/"
            className="micro text-faint transition-colors hover:text-ink"
          >
            ← 返回邀请入口
          </Link>
          <span className="eyebrow text-faint/70">ATELIER © 2026</span>
        </div>
      </main>
    </div>
  );
}
