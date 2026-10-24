"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { revokeInviteAction } from "@/actions/admin";

export function RevokeInviteButton({ id, code }: { id: number; code: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[12px] text-faint transition-colors hover:text-accent-deep"
      >
        撤回
      </button>
    );
  }

  return (
    <form action={revokeInviteAction} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={id} />
      <span className="text-[12px] text-accent-deep" title={code}>
        确认撤回？
      </span>
      <RevokeSubmit />
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-[12px] text-faint transition-colors hover:text-ink"
      >
        取消
      </button>
    </form>
  );
}

function RevokeSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1 text-[12px] font-medium text-accent-deep hover:underline"
    >
      {pending && <LoaderCircle size={9} className="animate-spin" />}
      撤回
    </button>
  );
}
