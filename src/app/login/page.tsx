import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSessionUser } from "@/lib/auth";
import { safeReturnTo } from "@/lib/video/types";

export const metadata: Metadata = {
  title: "登录",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const returnTo = safeReturnTo((await searchParams).next);
  const user = await getSessionUser();
  if (user) redirect(returnTo);

  return (
    <AuthShell>
      <LoginForm returnTo={returnTo} />
    </AuthShell>
  );
}
