"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, Check, LoaderCircle } from "lucide-react";
import {
  changePasswordAction,
  updateProfileAction,
  type ProfileState,
} from "@/actions/auth";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/toast";

const initialState: ProfileState = {};

export function ProfileSettings({
  name,
  bio,
  email,
}: {
  name: string;
  bio: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) toast("个人资料已保存。");
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 border-l-2 border-danger bg-danger-soft px-3 py-2 text-[12px] leading-relaxed text-danger"
        >
          <AlertCircle size={13} className="mt-0.5 flex-none" />
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-name" className="field-label">
            称呼 · Name
          </label>
          <input
            id="profile-name"
            name="name"
            defaultValue={name}
            maxLength={24}
            required
            className="field"
          />
        </div>
        <div>
          <label htmlFor="profile-email" className="field-label">
            邮箱 · Email
          </label>
          <input
            id="profile-email"
            defaultValue={email}
            placeholder="邮箱由馆员维护"
            disabled
            className="field cursor-not-allowed opacity-55"
          />
        </div>
      </div>

      <div>
        <label htmlFor="profile-bio" className="field-label">
          <span>一句话自我介绍 · Bio</span>
          <span className="normal-case tracking-normal text-faint">最多 160 字</span>
        </label>
        <textarea
          id="profile-bio"
          name="bio"
          defaultValue={bio}
          maxLength={160}
          rows={3}
          placeholder="你在做什么，或者你相信什么。"
          className="field min-h-[92px]"
        />
      </div>

      <div className="flex items-center justify-between gap-4 pt-1">
        <p className="text-[12px] text-faint">邮箱修改请联系馆员。</p>
        <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
          {pending ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />}
          {pending ? "保存中" : "保存资料"}
        </button>
      </div>
    </form>
  );
}

export function PasswordSettings() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      toast("密码已更新，其他设备已被安全登出。");
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3.5">
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
        <label htmlFor="current-password" className="field-label">
          当前密码
        </label>
        <PasswordInput
          id="current-password"
          name="currentPassword"
          autoComplete="current-password"
          placeholder="当前密码"
        />
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label htmlFor="new-password" className="field-label">
            新密码
          </label>
          <PasswordInput
            id="new-password"
            name="newPassword"
            autoComplete="new-password"
            placeholder="至少 8 位"
          />
        </div>
        <div>
          <label htmlFor="confirm-new-password" className="field-label">
            确认新密码
          </label>
          <PasswordInput
            id="confirm-new-password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="再输入一次"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-1">
        <p className="text-[12px] leading-relaxed text-faint">修改后，其他设备上的会话会失效。</p>
        <button type="submit" disabled={pending} className="btn btn-outline btn-sm">
          {pending ? <LoaderCircle size={13} className="animate-spin" /> : null}
          {pending ? "更新中" : "更新密码"}
        </button>
      </div>
    </form>
  );
}
