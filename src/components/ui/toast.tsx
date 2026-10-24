"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertCircle, Check, Info, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; message: string; tone: ToastTone };

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

const icons = {
  success: Check,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      counter.current += 1;
      const id = counter.current;
      setItems((current) => [...current.slice(-2), { id, message, tone }]);
      const timer = setTimeout(() => dismiss(id), 3600);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      for (const timer of activeTimers.values()) clearTimeout(timer);
    };
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed right-4 bottom-5 z-[200] flex w-[calc(100%-32px)] max-w-sm flex-col gap-2 sm:right-6 sm:bottom-6"
      >
        {items.map((item) => {
          const Icon = icons[item.tone];
          return (
            <div
              key={item.id}
              role="status"
              className="animate-rise pointer-events-auto flex items-center gap-3 rounded-[2px] border border-dark-line bg-dark px-3.5 py-3 text-cream shadow-[0_18px_45px_-22px_rgba(0,0,0,0.7)]"
            >
              <span
                className={`flex size-5 flex-none items-center justify-center rounded-full ${
                  item.tone === "error"
                    ? "bg-accent text-white"
                    : item.tone === "info"
                      ? "bg-cream/15 text-cream"
                      : "bg-[#d7e5cf] text-[#1f331d]"
                }`}
              >
                <Icon size={12} strokeWidth={2.4} />
              </span>
              <p className="min-w-0 flex-1 text-[12.5px] leading-[1.5]">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="flex size-6 flex-none items-center justify-center text-cream/45 transition-colors hover:text-cream"
                aria-label="关闭提示"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
