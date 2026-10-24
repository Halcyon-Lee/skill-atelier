"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";
import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";
import { deleteSkillAction } from "@/actions/skills";
import { cn } from "@/lib/utils";

export function DeleteSkillDialog({
  slug,
  name,
  className,
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => cancelRef.current?.focus(), 40);

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 text-[12px] text-faint transition-colors hover:text-danger",
          className,
        )}
      >
        <Trash2 size={11} strokeWidth={1.8} />
        删除档案
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="animate-fade fixed inset-0 z-[160] flex items-center justify-center bg-dark/50 px-4 backdrop-blur-[2px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div className="animate-rise w-full max-w-[430px] border border-line bg-raised p-6 shadow-[0_40px_100px_-35px_rgba(18,15,10,0.6)] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <span className="flex size-9 items-center justify-center rounded-full bg-danger-soft text-danger">
                  <AlertTriangle size={16} strokeWidth={1.8} />
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex size-7 items-center justify-center text-faint transition-colors hover:text-ink"
                  aria-label="关闭"
                >
                  <X size={14} />
                </button>
              </div>

              <h2 id="delete-title" className="display-cn mt-5 text-[30px] leading-tight text-ink">
                确定要删除吗？
              </h2>
              <p className="mt-3 text-[14px] leading-[1.8] text-muted">
                档案「<span className="font-medium text-ink">{name}</span>
                」将被永久移出档案馆，成员的收藏也会一并清除。这个操作无法撤销。
              </p>

              <form action={deleteSkillAction} className="mt-7">
                <input type="hidden" name="slug" value={slug} />
                <div className="flex items-center justify-end gap-2">
                  <button
                    ref={cancelRef}
                    type="button"
                    onClick={() => setOpen(false)}
                    className="btn btn-outline btn-sm"
                  >
                    保留档案
                  </button>
                  <DeleteSubmit />
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function DeleteSubmit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-danger btn-sm">
      {pending ? <LoaderCircle size={13} className="animate-spin" /> : <Trash2 size={13} />}
      {pending ? "正在删除" : "确认删除"}
    </button>
  );
}
