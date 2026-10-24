import Link from "next/link";
import { Logo } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="mt-24 overflow-hidden border-t border-line">
      <div className="shell grid gap-10 py-12 md:grid-cols-[1.3fr_0.7fr_0.7fr]">
        <div>
          <Logo href="/library" />
          <p className="mt-5 max-w-[290px] text-[12px] leading-[1.85] text-muted">
            一个只对受邀者开放的 AI Agent Skill
            档案馆。由成员共同维护，只收录经得起反复使用的工具。
          </p>
        </div>

        <div>
          <p className="eyebrow text-faint">Archive</p>
          <div className="mt-4 flex flex-col gap-2.5">
            <Link href="/library" className="w-fit text-[12px] text-muted transition-colors hover:text-ink">
              全部技能
            </Link>
            <Link href="/saved" className="w-fit text-[12px] text-muted transition-colors hover:text-ink">
              我的收藏
            </Link>
            <Link href="/submit" className="w-fit text-[12px] text-muted transition-colors hover:text-ink">
              收录技能
            </Link>
          </div>
        </div>

        <div>
          <p className="eyebrow text-faint">Membership</p>
          <div className="mt-4 flex flex-col gap-2.5">
            <Link href="/profile" className="w-fit text-[12px] text-muted transition-colors hover:text-ink">
              我的档案
            </Link>
            <span className="text-[12px] text-faint">邀请制 · 仅限成员</span>
            <span className="text-[12px] text-faint">内容谢绝公开转载</span>
          </div>
        </div>
      </div>

      <div className="shell flex flex-col gap-4 border-t border-line py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="eyebrow text-faint">© 2026 ATELIER · Curated in private</p>
        <div className="flex items-center gap-5">
          <a
            href="https://github.com/Halcyon-Lee/skill-atelier"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 text-[10px] text-faint transition-colors hover:text-ink"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3 fill-current">
              <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2.2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.26 5.69.41.36.78 1.07.78 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
            </svg>
            GitHub
          </a>
          <p className="font-display text-[14px] text-muted italic">
            A small archive of very good things.
          </p>
        </div>
      </div>

      <div aria-hidden="true" className="relative -mb-6 select-none overflow-hidden sm:-mb-10">
        <p className="display shell whitespace-nowrap text-[clamp(84px,17vw,236px)] leading-[0.7] text-ink/[0.045]">
          ATELIER
        </p>
      </div>
    </footer>
  );
}
