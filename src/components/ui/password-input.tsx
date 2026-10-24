"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type PasswordInputProps = {
  id: string;
  name: string;
  autoComplete?: string;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
};

export function PasswordInput({
  id,
  name,
  autoComplete = "current-password",
  placeholder = "输入密码",
  invalid = false,
  describedBy,
  autoFocus = false,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="field pr-12"
        minLength={8}
        maxLength={128}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "隐藏密码" : "显示密码"}
        aria-pressed={visible}
        className={cn(
          "absolute top-1/2 right-1 flex size-11 -translate-y-1/2 items-center justify-center text-faint",
          "transition-colors hover:text-ink",
        )}
      >
        {visible ? <EyeOff size={16} strokeWidth={1.7} /> : <Eye size={16} strokeWidth={1.7} />}
      </button>
    </div>
  );
}
