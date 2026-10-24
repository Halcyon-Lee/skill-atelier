"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, ArrowRight, Check, LoaderCircle } from "lucide-react";
import { registerAction, type AuthFormState } from "@/actions/auth";
import { PasswordInput } from "@/components/ui/password-input";

const initialState: AuthFormState = {};

export function JoinForm({
  code,
  inviterName,
}: {
  code: string;
  inviterName: string;
}) {
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <div>
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-moss/25 bg-moss/[0.07] px-3 py-1.5">
        <Check size={12} strokeWidth={2.5} className="text-moss" />
        <span className="eyebrow text-moss">Invitation verified</span>
      </div>

      <h1 className="display-cn text-[44px] text-ink sm:text-[50px]">门为你开着。</h1>
      <p className="mt-4 max-w-[340px] text-[13.5px] leading-[1.8] text-muted">
        邀请函已被核验。完成注册，成为这座档案馆的一员。
      </p>

      <div className="my-6 flex items-center justify-between gap-4 border-y border-line py-3">
        <span className="micro text-faint">Invited by</span>
        <span className="text-[12px] font-medium text-ink">{inviterName}</span>
        <span className="h-3 w-px bg-line" />
        <span className="input-code font-mono text-[10.5px] text-muted">{code}</span>
      </div>

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="code" value={code} />

        {state.error && !state.fieldErrors && (
          <p
            role="alert"
            className="flex items-start gap-2 border-l-2 border-accent bg-accent-soft/45 px-3 py-2.5 text-[12px] leading-relaxed text-accent-deep"
          >
            <AlertCircle size={14} className="mt-0.5 flex-none" />
            {state.error}
          </p>
        )}

        <div>
          <label htmlFor="join-name" className="field-label">
            称呼 · Name
          </label>
          <input
            id="join-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="你希望大家怎么称呼你？"
            defaultValue={state.values?.name ?? ""}
            maxLength={24}
            required
            autoFocus
            aria-invalid={Boolean(errors.name) || undefined}
            aria-describedby={errors.name ? "join-name-error" : undefined}
            className="field"
          />
          {errors.name && (
            <p id="join-name-error" className="field-error">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="join-email" className="field-label">
            邮箱 · Email
          </label>
          <input
            id="join-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={state.values?.email ?? ""}
            maxLength={254}
            required
            aria-invalid={Boolean(errors.email) || undefined}
            aria-describedby={errors.email ? "join-email-error" : undefined}
            className="field"
          />
          {errors.email && (
            <p id="join-email-error" className="field-error">
              {errors.email}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="join-password" className="field-label">
              密码 · Password
            </label>
            <PasswordInput
              id="join-password"
              name="password"
              autoComplete="new-password"
              placeholder="至少 8 位"
              invalid={Boolean(errors.password)}
              describedBy={errors.password ? "join-password-error" : undefined}
            />
            {errors.password && (
              <p id="join-password-error" className="field-error">
                {errors.password}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="join-confirm" className="field-label">
              确认 · Again
            </label>
            <PasswordInput
              id="join-confirm"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="再输入一次"
              invalid={Boolean(errors.confirmPassword)}
              describedBy={errors.confirmPassword ? "join-confirm-error" : undefined}
            />
            {errors.confirmPassword && (
              <p id="join-confirm-error" className="field-error">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary group !mt-7 w-full !h-[50px]"
        >
          {pending ? (
            <>
              <LoaderCircle size={15} className="animate-spin" />
              正在为你开门
            </>
          ) : (
            <>
              创建账号并进入
              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </>
          )}
        </button>

        <p className="text-center text-[10.5px] leading-relaxed text-faint">
          加入即表示你同意只收录自己有权分享的内容，并尊重档案馆的私密性。
        </p>
      </form>

      <p className="mt-5 border-t border-line pt-5 text-[12px] text-muted">
        已经是成员？{" "}
        <Link href="/login" className="link-underline text-ink">
          直接登录
        </Link>
      </p>
    </div>
  );
}
