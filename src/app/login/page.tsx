import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "成员登录",
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/library");

  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
