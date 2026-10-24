"use client";

import { useActionState } from "react";
import { AlertCircle, ArrowUpRight, LoaderCircle } from "lucide-react";
import { checkInviteAction, type AuthFormState } from "@/actions/auth";

const initialState: AuthFormState = {};

export function InviteGateForm({ initialCode = "" }: { initialCode?: string }) {
  const [state, formAction, pending] = useActionState(checkInviteAction, initialState);

  return (
    <form action={formAction} className="space-y-3.5" noValidate>
      <div>
        <label htmlFor="invite-code" className="field-label">
          <span>邀请码 · Invitation code</span>
          <span className="normal-case tracking-normal text-faint">必填</span>
        </label>
        <input
          id="invite-code"
          name="code"
          type="text"
          defaultValue={initialCode.toUpperCase()}
          placeholder="ATL-XXXX-XXXX"
          autoComplete="one-time-code"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={40}
          required
          aria-invalid={Boolean(state.error) || undefined}
          aria-describedby={state.error ? "invite-error" : "invite-help"}
          className="field input-code !h-[54px] !text-[13px]"
        />
      </div>

      {state.error && (
        <p
          id="invite-error"
          role="alert"
          className="flex items-start gap-2 border-l-2 border-accent bg-accent-soft/45 px-3 py-2.5 text-[12px] leading-relaxed text-accent-deep"
        >
          <AlertCircle size={14} className="mt-0.5 flex-none" />
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary group w-full !h-[50px]">
        {pending ? (
          <>
            <LoaderCircle size={15} className="animate-spin" />
            正在核验邀请函
          </>
        ) : (
          <>
            进入档案馆
            <ArrowUpRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </>
        )}
      </button>

      <p id="invite-help" className="pt-0.5 text-center text-[11.5px] leading-relaxed text-faint">
        邀请码由一位已加入的成员提供。
      </p>
    </form>
  );
}
