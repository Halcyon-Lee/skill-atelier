import Link from "next/link";
import { cn, initials } from "@/lib/utils";

export function SparkMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M16 1.5c.7 7.5 6.9 13.7 14.5 14.5C22.9 16.8 16.7 23 16 30.5 15.3 23 9.1 16.8 1.5 16 9.1 15.2 15.3 9 16 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Logo({
  href = "/",
  inverted = false,
  compact = false,
}: {
  href?: string;
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label="ATELIER 首页"
      className="group inline-flex items-center gap-2.5 rounded-sm"
    >
      <span
        className={cn(
          "relative flex size-10 flex-none items-center justify-center rounded-lg border transition-colors duration-300",
          inverted
            ? "border-cream/35 text-cream group-hover:border-cream/70"
            : "border-ink/25 text-ink group-hover:border-ink/60",
        )}
      >
        <SparkMark className="size-[15px]" />
        <span className="absolute -top-[3px] -right-[3px] size-[5px] rounded-full bg-accent" />
      </span>
      <span className="flex flex-col justify-center">
        <span
          className={cn(
            "font-sans text-[22px] font-semibold leading-none tracking-[-0.04em]",
            inverted ? "text-cream" : "text-ink",
          )}
        >
          ATELIER
        </span>
        {!compact && (
          <span
            className={cn(
              "mt-[5px] hidden font-mono text-[12px] leading-none tracking-[0.06em] uppercase sm:block",
              inverted ? "text-muted" : "text-faint",
            )}
          >
            视频案例库
          </span>
        )}
      </span>
    </Link>
  );
}

export function Avatar({
  name,
  color,
  size = "md",
  className,
}: {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const label = initials(name);
  const sizeClass =
    size === "sm"
      ? "size-6 text-[12px]"
      : size === "xl"
        ? "size-20 text-lg"
        : size === "lg"
          ? "size-14 text-sm"
          : "size-8 text-[12px]";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex flex-none items-center justify-center rounded-full font-mono font-medium tracking-[0.02em] text-white/95 ring-1 ring-black/5",
        sizeClass,
        className,
      )}
      style={{ backgroundColor: color }}
    >
      {label.toUpperCase()}
    </span>
  );
}
