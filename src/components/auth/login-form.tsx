"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, ArrowRight, LoaderCircle } from "lucide-react";
import { loginAction, type AuthFormState } from "@/actions/auth";
import { PasswordInput } from "@/components/ui/password-input";

const initialState: AuthFormState = {};

export function LoginForm({ returnTo = "/" }: { returnTo?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] font-medium tracking-tight text-ink sm:text-[32px]">登录</h1>
        <p className="mt-3 text-base leading-[1.8] text-muted">
          登录后查看全部视频案例。
        </p>
      </div>

      <form action={formAction} className="space-y-5" noValidate>
        <input type="hidden" name="next" value={returnTo} />
        {state.error && !state.fieldErrors && (
          <p
            role="alert"
            className="flex items-start gap-2 border-l-2 border-danger bg-danger-soft px-3 py-2.5 text-[14px] leading-relaxed text-danger"
          >
            <AlertCircle size={14} className="mt-0.5 flex-none" />
            {state.error}
          </p>
        )}

        <div>
          <label htmlFor="login-email" className="field-label">
            邮箱 · Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={state.values?.email ?? ""}
            maxLength={254}
            required
            autoFocus
            className="field"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="field-label">
            密码 · Password
          </label>
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            placeholder="输入你的密码"
          />
        </div>

        <button type="submit" disabled={pending} className="btn btn-primary group w-full !h-[50px] !mt-7">
          {pending ? (
            <>
              <LoaderCircle size={15} className="animate-spin" />
              正在验证
            </>
          ) : (
            <>
              登录
              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 border-t border-line pt-5">
        <p className="text-[14px] leading-relaxed text-muted">
          还没有账号？{" "}
          <Link href={`/join?next=${encodeURIComponent(returnTo)}`} className="link-underline text-ink">
            使用邀请码注册
          </Link>
        </p>
        <p className="mt-2.5 text-[12px] leading-relaxed text-faint">
          忘记密码？请联系管理员重置。
        </p>
      </div>
    </div>
  );
}
