import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, TicketX } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { JoinForm } from "@/components/auth/join-form";
import { InviteGateForm } from "@/components/auth/invite-gate-form";
import { safeReturnTo } from "@/lib/video/types";
import { getSessionUser } from "@/lib/auth";
import { checkInvite, inviteReasonMessage, normalizeInviteCode } from "@/lib/invites";

export const metadata: Metadata = {
  title: "注册",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; next?: string }>;
}) {
  if (process.env.REGISTRATION_OPEN === "false") notFound();
  const params = await searchParams;
  const returnTo = safeReturnTo(params.next);
  const user = await getSessionUser();
  if (user) redirect(returnTo);
  if (!params.code) return <AuthShell><h1 className="text-[28px] font-medium tracking-tight">注册</h1><p className="mb-7 mt-3 text-sm leading-relaxed text-muted">输入邀请码，注册后即可查看全部视频案例。已有账号请<Link href="/login" className="link-underline text-ink">直接登录</Link>。</p><InviteGateForm returnTo={returnTo}/></AuthShell>;
  const code = normalizeInviteCode(typeof params.code === "string" ? params.code : "");
  const invite = checkInvite(code);

  if (!invite.valid) {
    return (
      <AuthShell>
        <div className="animate-rise">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-soft/40 px-3 py-1.5">
            <TicketX size={12} className="text-accent-deep" />
            <span className="eyebrow text-accent-deep">邀请码不可用</span>
          </div>
          <h1 className="text-[28px] font-medium tracking-tight text-ink sm:text-[32px]">这个邀请码不能用</h1>
          <p className="mt-5 max-w-[330px] text-[14px] leading-[1.85] text-muted">
            {inviteReasonMessage(invite.reason)}如有疑问，请联系邀请你的人或管理员。
          </p>
          <Link href="/join" className="btn btn-primary group mt-8 !h-[48px]">
            <ArrowLeft
              size={15}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            重新输入邀请码
          </Link>
          <p className="mt-6 border-t border-line pt-5 text-[14px] text-muted">
            已有账号？{" "}
            <Link href="/login" className="link-underline text-ink">
              直接登录
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <JoinForm code={invite.invite.code} inviterName={invite.invite.creator_name ?? "ATELIER"} returnTo={returnTo} />
    </AuthShell>
  );
}
