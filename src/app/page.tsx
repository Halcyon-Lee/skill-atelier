import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Logo, SparkMark } from "@/components/brand";
import { InviteGateForm } from "@/components/auth/invite-gate-form";
import { getSessionUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import { getMembersCount, getSkillsCount } from "@/lib/skills";

export default async function InvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/library");

  const params = await searchParams;
  const initialCode = typeof params.code === "string" ? params.code : "";
  const skillCount = getSkillsCount();
  const memberCount = getMembersCount();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="relative z-20 border-b border-line/80">
        <div className="shell flex h-[82px] items-center justify-between">
          <Logo />
          <div className="flex items-center gap-5 sm:gap-7">
            <span className="eyebrow hidden items-center gap-2 text-faint md:flex">
              <span className="size-1.5 rounded-full bg-accent animate-pulse-soft" />
              Invitation only
            </span>
            <Link
              href="/login"
              className="group inline-flex items-center gap-1.5 text-[12.5px] text-muted transition-colors hover:text-ink"
            >
              已是成员
              <ArrowRight
                size={13}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative flex flex-1 items-center overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 h-[500px] w-[55%] bg-[radial-gradient(ellipse_at_top_right,rgba(223,74,40,0.07),transparent_62%)]"
        />
        <div className="shell relative grid w-full gap-14 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-20 lg:py-16 xl:gap-28">
          <section className="relative">
            <div className="animate-rise flex items-center gap-3">
              <span className="h-px w-9 bg-accent" />
              <span className="eyebrow text-muted">Private skill archive · Est. 2026</span>
            </div>

            <h1 className="animate-rise delay-1 display-cn mt-7 text-[clamp(56px,7.4vw,108px)] text-balance">
              好技能，
              <br />
              只传给
              <br />
              <span className="text-accent">对的人。</span>
            </h1>

            <p className="animate-rise delay-2 mt-5 font-display text-[23px] leading-none text-muted italic sm:text-[26px]">
              The good stuff, kept close.
            </p>

            <div className="animate-rise delay-3 mt-10 grid max-w-[620px] gap-7 border-t border-line pt-7 sm:grid-cols-[1fr_auto] sm:gap-12">
              <p className="max-w-[430px] text-[13.5px] leading-[1.9] text-muted text-pretty">
                这里不追逐热点。ATELIER 只收录被反复使用、真正让 AI
                agent 变得更好用的技能。每一份档案都有来源、有判断，也有它适合被使用的时刻。
              </p>
              <div className="flex gap-8 sm:flex-col sm:gap-4 sm:border-l sm:border-line sm:pl-7">
                <div>
                  <p className="font-display text-[30px] leading-none text-ink">
                    {String(skillCount).padStart(2, "0")}
                  </p>
                  <p className="mt-1.5 font-mono text-[9px] tracking-[0.12em] text-faint uppercase">
                    份收录
                  </p>
                </div>
                <div>
                  <p className="font-display text-[30px] leading-none text-ink">
                    {String(memberCount).padStart(2, "0")}
                  </p>
                  <p className="mt-1.5 font-mono text-[9px] tracking-[0.12em] text-faint uppercase">
                    位成员
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="animate-rise delay-2 relative mx-auto w-full max-w-[460px] lg:mx-0 lg:justify-self-end">
            <div
              aria-hidden="true"
              className="rule-grid absolute -inset-5 -z-10 opacity-30"
            />
            <div className="invite-ticket">
              <div className="relative z-10 px-7 py-7 pl-10 sm:px-9 sm:py-8 sm:pl-11">
                <div className="flex items-start justify-between">
                  <Logo inverted compact />
                  <span className="eyebrow mt-1 text-cream/35">No. 001 / 2026</span>
                </div>

                <div className="mt-12 flex items-end justify-between gap-4">
                  <div>
                    <span className="eyebrow text-cream/40">Membership</span>
                    <p className="display mt-2.5 text-[44px] leading-none text-cream sm:text-[50px]">
                      By invitation<span className="text-accent">.</span>
                    </p>
                  </div>
                  <SparkMark className="mb-1 size-11 flex-none text-accent sm:size-12" />
                </div>

                <div className="mt-11 grid grid-cols-3 gap-3 border-t border-cream/15 pt-4">
                  <div>
                    <p className="eyebrow text-cream/30">Access</p>
                    <p className="mt-1.5 font-mono text-[9px] tracking-[0.08em] text-cream/70">
                      PRIVATE
                    </p>
                  </div>
                  <div>
                    <p className="eyebrow text-cream/30">Issue</p>
                    <p className="mt-1.5 font-mono text-[9px] tracking-[0.08em] text-cream/70">
                      MMXXVI
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="eyebrow text-cream/30">Status</p>
                    <p className="mt-1.5 font-mono text-[9px] tracking-[0.08em] text-accent-soft">
                      INVITED
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 border border-line bg-raised p-6 shadow-[0_30px_60px_-52px_rgba(24,21,16,0.75)] sm:p-7">
              <div className="mb-5 flex items-baseline justify-between">
                <h2 className="text-[13.5px] font-medium text-ink">开启你的档案</h2>
                <span className="eyebrow text-faint">Members only</span>
              </div>
              <InviteGateForm initialCode={initialCode} />
            </div>

            <p className="mt-4 flex items-center justify-center gap-2 text-[10.5px] text-faint">
              <LockKeyhole size={11} strokeWidth={1.8} />
              没有邀请码？请联系引荐你的那位成员。
            </p>
          </section>
        </div>
      </main>

      <div className="relative overflow-hidden border-y border-line bg-raised/45 py-4">
        <div className="animate-marquee flex w-max items-center">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
              {CATEGORIES.map((category) => (
                <div key={category.slug} className="flex items-center">
                  <span className="px-7 font-mono text-[9.5px] tracking-[0.18em] text-muted uppercase">
                    {category.english}
                  </span>
                  <SparkMark className="size-2.5 text-accent/60" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <footer className="relative z-10">
        <div className="shell flex h-[66px] items-center justify-between">
          <p className="eyebrow text-faint">Curated in private · 2026</p>
          <p className="hidden font-display text-[14px] text-muted italic sm:block">
            A small archive of very good things.
          </p>
          <p className="eyebrow text-faint">ATELIER</p>
        </div>
      </footer>
    </div>
  );
}
