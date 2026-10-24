"use client";

import { CopyButton } from "@/components/ui/copy-button";

export function InviteCopy({
  code,
  label = "复制链接",
  className,
  iconOnly = false,
}: {
  code: string;
  label?: string;
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <CopyButton
      getText={() => `${window.location.origin}/join?code=${encodeURIComponent(code)}`}
      label={label}
      copiedLabel="已复制"
      toastMessage="邀请链接已复制，发给你想邀请的人。"
      className={className}
      iconOnly={iconOnly}
    />
  );
}
