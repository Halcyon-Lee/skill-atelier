import Link from "next/link";
import { Film, ArrowUpRight, LogOut } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { Avatar,Logo } from "@/components/brand";
export async function VideoHeader() {
  const user=await getSessionUser();
  return <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-xl">
    <div className="shell flex min-h-20 flex-wrap items-center justify-between gap-x-5 gap-y-3 py-4">
      <Logo href="/" />
      <nav aria-label="主导航" className="order-3 flex w-full items-center gap-6 border-t border-line pt-3 text-sm sm:order-none sm:w-auto sm:border-0 sm:pt-0">
        <Link href="/" className="text-ink hover:text-accent">公开首页</Link>
        <Link href="/admin/gallery" className="text-muted hover:text-accent">视频管理</Link>
        <Link href="/styles/swiss-motion" className="text-muted hover:text-accent">内部创作</Link>
        <Link href="/library" className="text-muted hover:text-accent">Skill 档案</Link>
      </nav>
      <div className="flex items-center gap-3">
        {user ? <>
          {user.role==="admin" && <Link href="/admin" className="hidden text-xs text-muted hover:text-accent lg:block">管理后台</Link>}
          <Link href="/profile" className="flex items-center gap-2" title={user.name}><Avatar name={user.name} color={user.avatarColor} /><span className="hidden max-w-36 truncate text-xs text-muted xl:block">{user.name}</span></Link>
          <form action={logoutAction}><button aria-label="退出登录" className="flex size-10 items-center justify-center text-faint hover:text-ink"><LogOut size={17}/></button></form>
        </> : <Link href="/login" className="btn btn-outline btn-sm">登录 / 加入<ArrowUpRight size={14}/></Link>}
      </div>
    </div>
  </header>;
}
export function VideoFooter() {
  return <footer className="mt-auto border-t border-line"><div className="shell flex flex-wrap items-center justify-between gap-5 py-8 text-xs text-faint">
    <span className="flex items-center gap-2"><Film size={15}/> ATELIER · 让想法成为影片</span>
    <p>精选样片：<a href="https://github.com/lemomo-ai/lemo-opuscar" target="_blank" rel="noreferrer" className="text-muted hover:text-accent">LemoLab / Lemo-Opuscar</a> · <a href="/credits" className="underline underline-offset-4">素材来源与授权</a></p>
  </div></footer>;
}
export async function VideoShell({children}:{children:React.ReactNode}) {
  return <div className="flex min-h-dvh flex-col"><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:bg-accent focus:p-3 focus:text-on-accent">跳到主要内容</a><VideoHeader/><main id="main-content" className="flex-1">{children}</main><VideoFooter/></div>;
}
