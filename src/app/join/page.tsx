import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, TicketX } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { JoinForm } from "@/components/auth/join-form";
import { getSessionUser } from "@/lib/auth";
import { checkInvite, inviteReasonMessage, normalizeInviteCode } from "@/lib/invites";

export const metadata: Metadata = {
  title: "接受邀请",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/library");

  const params = await searchParams;
  const code = normalizeInviteCode(typeof params.code === "string" ? params.code : "");
  const invite = checkInvite(code);

  if (!invite.valid) {
    return (
      <AuthShell>
        <div className="animate-rise">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-soft/40 px-3 py-1.5">
            <TicketX size={12} className="text-accent-deep" />
            <span className="eyebrow text-accent-deep">Invitation unavailable</span>
          </div>
          <h1 className="display-cn text-[44px] leading-[1.08] text-ink sm:text-[52px]">
            这张邀请函
            <br />
            没能打开门。
          </h1>
          <p className="mt-5 max-w-[330px] text-[13.5px] leading-[1.85] text-muted">
            {inviteReasonMessage(invite.reason)}如果你认为这是一个错误，请联系邀请你的成员重新发送。
          </p>
          <Link href="/" className="btn btn-primary group mt-8 !h-[48px]">
            <ArrowLeft
              size={15}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            返回邀请入口
          </Link>
          <p className="mt-6 border-t border-line pt-5 text-[12px] text-muted">
            已经是成员？{" "}
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
      <JoinForm code={invite.invite.code} inviterName={invite.invite.creator_name ?? "ATELIER"} />
    </AuthShell>
  );
}
