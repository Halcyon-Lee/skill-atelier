"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Avatar, Logo } from "@/components/brand";
import { CommandSearch } from "@/components/command-search";
import { cn } from "@/lib/utils";

type HeaderUser = {
  name: string;
  email: string;
  role: "member" | "admin";
  avatarColor: string;
};

const NAV_ITEMS = [
  { href: "/library", label: "技能库", match: ["/library", "/skills"] },
  { href: "/saved", label: "收藏夹", match: ["/saved"] },
  { href: "/submit", label: "收录技能", match: ["/submit"] },
];

export function SiteHeader({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  function isActive(item: (typeof NAV_ITEMS)[number]) {
    return item.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }

  function closeNavigation() {
    setMenuOpen(false);
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-[100] border-b border-line/80 bg-paper">
      <div className="shell flex h-[76px] items-center justify-between gap-6">
        <div className="flex items-center gap-9 xl:gap-14">
          <div onClick={closeNavigation}>
            <Logo href="/library" />
          </div>
          <nav aria-label="主导航" className="hidden items-center gap-7 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                data-active={isActive(item)}
                aria-current={isActive(item) ? "page" : undefined}
                onClick={closeNavigation}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <CommandSearch />
          <Link
            href="/submit"
            className="btn btn-primary btn-sm hidden !min-h-[38px] sm:inline-flex"
          >
            <Plus size={13} strokeWidth={2} />
            收录
          </Link>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="账户菜单"
              className={cn(
                "flex h-9 items-center gap-2 rounded-[2px] border border-transparent pl-0.5 transition-colors",
                menuOpen ? "border-line bg-raised/70 pr-1.5" : "hover:border-line hover:pr-1.5",
              )}
            >
              <Avatar name={user.name} color={user.avatarColor} />
              <span className="hidden max-w-24 truncate text-[11.5px] text-muted lg:block">
                {user.name}
              </span>
              <ChevronDown
                size={12}
                className={cn(
                  "hidden text-faint transition-transform lg:block",
                  menuOpen && "rotate-180",
                )}
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                aria-label="账户菜单"
                className="animate-rise absolute top-[calc(100%+10px)] right-0 w-[248px] overflow-hidden rounded-[2px] border border-line bg-raised shadow-[0_24px_55px_-28px_rgba(24,21,16,0.55)]"
              >
                <div className="border-b border-line px-4 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[12.5px] font-medium text-ink">{user.name}</p>
                    <span className="eyebrow text-[8px] text-faint">
                      {user.role === "admin" ? "Curator" : "Member"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[10.5px] text-faint">{user.email}</p>
                </div>

                <div className="p-1.5" onClick={() => setMenuOpen(false)}>
                  <MenuLink href="/profile" icon={UserRound} label="我的档案" />
                  <MenuLink href="/saved" icon={Bookmark} label="收藏夹" />
                  {user.role === "admin" && (
                    <MenuLink href="/admin" icon={LayoutDashboard} label="馆务台" accent />
                  )}
                </div>

                <div className="border-t border-line p-1.5">
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      role="menuitem"
                      className="flex w-full items-center gap-2.5 rounded-[2px] px-2.5 py-2 text-left text-[11.5px] text-muted transition-colors hover:bg-sunken/60 hover:text-ink"
                    >
                      <LogOut size={13} strokeWidth={1.8} />
                      退出登录
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="ml-0.5 flex size-9 items-center justify-center rounded-[2px] border border-line text-ink md:hidden"
            aria-label={mobileOpen ? "关闭菜单" : "打开菜单"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="animate-fade fixed inset-x-0 top-[76px] bottom-0 z-[110] overflow-y-auto border-t border-line bg-paper md:hidden">
          <div className="shell flex min-h-full flex-col py-8">
            <nav aria-label="移动端主导航" className="flex flex-col" onClick={closeNavigation}>
              {NAV_ITEMS.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-baseline justify-between border-b border-line py-5",
                    isActive(item) ? "text-ink" : "text-muted",
                  )}
                >
                  <span className="flex items-baseline gap-4">
                    <span className="font-mono text-[9px] text-faint">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="display-cn text-[32px] leading-none">{item.label}</span>
                  </span>
                  {isActive(item) && <span className="size-1.5 rounded-full bg-accent" />}
                </Link>
              ))}
              <Link
                href="/profile"
                className="flex items-baseline justify-between border-b border-line py-5 text-muted"
              >
                <span className="flex items-baseline gap-4">
                  <span className="font-mono text-[9px] text-faint">04</span>
                  <span className="display-cn text-[32px] leading-none">我的档案</span>
                </span>
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="flex items-baseline justify-between border-b border-line py-5 text-muted"
                >
                  <span className="flex items-baseline gap-4">
                    <span className="font-mono text-[9px] text-faint">05</span>
                    <span className="display-cn text-[32px] leading-none">馆务台</span>
                  </span>
                  <ShieldCheck size={15} className="text-accent" />
                </Link>
              )}
            </nav>

            <div className="mt-auto flex items-center justify-between pt-10">
              <div className="flex items-center gap-2.5">
                <Avatar name={user.name} color={user.avatarColor} />
                <div>
                  <p className="text-[12px] text-ink">{user.name}</p>
                  <p className="mt-0.5 text-[10px] text-faint">{user.email}</p>
                </div>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 text-[11px] text-muted transition-colors hover:text-ink"
                >
                  <LogOut size={12} />
                  退出
                </button>
              </form>
            </div>
            <p className="mt-6 eyebrow text-faint">ATELIER · Private skill archive</p>
          </div>
        </div>
      )}
    </header>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  accent = false,
}: {
  href: string;
  icon: typeof UserRound;
  label: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="flex items-center gap-2.5 rounded-[2px] px-2.5 py-2 text-[11.5px] text-muted transition-colors hover:bg-sunken/60 hover:text-ink"
    >
      <Icon size={13} strokeWidth={1.8} className={accent ? "text-accent" : undefined} />
      {label}
      {accent && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
    </Link>
  );
}
