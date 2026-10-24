"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, Check, LoaderCircle, Plus } from "lucide-react";
import { createInviteAction, type InviteActionState } from "@/actions/admin";
import { CopyButton } from "@/components/ui/copy-button";

const initialState: InviteActionState = {};

export function InviteManager() {
  const [state, formAction, pending] = useActionState(createInviteAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.created) formRef.current?.reset();
  }, [state]);

  const inviteLink = state.created ? `/join?code=${encodeURIComponent(state.created.code)}` : "";

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="display-cn text-[24px] leading-none text-ink">签发邀请</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-faint">
            每张邀请函都有独立席位与有效期，可随时撤销。
          </p>
        </div>
        <span className="flex size-8 flex-none items-center justify-center rounded-full bg-accent-soft/55 text-accent-deep">
          <Plus size={15} />
        </span>
      </div>

      <form ref={formRef} action={formAction} className="mt-6 space-y-4">
        {state.error && (
          <p
            role="alert"
            className="flex items-start gap-2 border-l-2 border-danger bg-danger-soft px-3 py-2 text-[12px] leading-relaxed text-danger"
          >
            <AlertCircle size={13} className="mt-0.5 flex-none" />
            {state.error}
          </p>
        )}

        <div>
          <label htmlFor="invite-note" className="field-label">
            备注 · Note
          </label>
          <input
            id="invite-note"
            name="note"
            maxLength={80}
            placeholder="给谁的邀请？例如：设计团队"
            className="field !min-h-[44px] !text-[14px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="invite-uses" className="field-label">
              席位 · Seats
            </label>
            <input
              id="invite-uses"
              name="maxUses"
              type="number"
              min={1}
              max={100}
              defaultValue={1}
              required
              className="field !min-h-[44px] !text-[14px]"
            />
          </div>
          <div>
            <label htmlFor="invite-expiry" className="field-label">
              有效期 · Expires
            </label>
            <select
              id="invite-expiry"
              name="expiresDays"
              defaultValue="30"
              className="field !min-h-[44px] !text-[14px]"
            >
              <option value="7">7 天</option>
              <option value="30">30 天</option>
              <option value="90">90 天</option>
              <option value="180">180 天</option>
              <option value="0">永不过期</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={pending} className="btn btn-primary btn-sm w-full">
          {pending ? <LoaderCircle size={13} className="animate-spin" /> : <Plus size={13} />}
          {pending ? "正在签发" : "生成邀请函"}
        </button>
      </form>

      {state.created && (
        <div className="animate-rise mt-5 border border-accent/30 bg-accent-soft/25 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="eyebrow text-accent-deep">New invitation</span>
            <Check size={14} className="text-accent-deep" />
          </div>
          <p className="input-code mt-3 font-mono text-[17px] tracking-[0.1em] text-ink">
            {state.created.code}
          </p>
          <p className="mt-1.5 text-[12px] text-faint">
            {state.created.maxUses} 个席位 ·{" "}
            {state.created.expiresAt
              ? `${new Date(state.created.expiresAt).toLocaleDateString("zh-CN")} 到期`
              : "永不过期"}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-accent/15 pt-3">
            <CopyButton
              text={state.created.code}
              label="复制邀请码"
              toastMessage="邀请码已复制。"
              className="text-ink hover:text-accent-deep"
            />
            <span className="h-3 w-px bg-accent/20" />
            <CopyButton
              getText={() =>
                `${window.location.origin}/join?code=${encodeURIComponent(state.created?.code ?? "")}`
              }
              label="复制邀请链接"
              toastMessage="邀请链接已复制，发给你想邀请的人。"
              className="text-ink hover:text-accent-deep"
            />
          </div>
          {inviteLink && (
            <p className="mt-2 truncate font-mono text-[12px] text-faint">{inviteLink}</p>
          )}
        </div>
      )}
    </div>
  );
}
