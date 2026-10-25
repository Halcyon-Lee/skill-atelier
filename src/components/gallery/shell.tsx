import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Avatar, Logo } from "@/components/brand";
import { ConsultButton, type ConsultSettings } from "@/components/gallery/consult";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getSiteSettings } from "@/lib/gallery/model";

export function consultSettings(): ConsultSettings {
  const settings = getSiteSettings(getDb());
  return {
    hasQr: !!settings.wechat_qr_path,
    qrVersion: settings.wechat_qr_path?.replace(/\W/g, "").slice(-8) ?? "",
    wechatId: settings.wechat_id,
    headline: settings.consult_headline,
  };
}

export async function GalleryShell({ children }: { children: React.ReactNode }) {
  const settings = consultSettings(), user = await getSessionUser();
  return <div className="flex min-h-dvh flex-col">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:bg-accent focus:p-3 focus:text-on-accent">跳到主要内容</a>
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-xl">
      <div className="shell flex min-h-20 items-center justify-between gap-4 py-4">
        <Logo href="/" />
        <div className="flex items-center gap-3">
          {user?.role === "admin" && <Link href="/admin/gallery" className="flex min-h-10 items-center gap-1.5 text-xs text-muted hover:text-accent"><Settings size={14} /><span className="hidden sm:inline">管理后台</span></Link>}
          <ConsultButton settings={settings} className="btn-sm shrink-0 whitespace-nowrap" />
          {user && <>
            <span className="flex items-center" title={user.name}><Avatar name={user.name} color={user.avatarColor} /></span>
            <form action={logoutAction}><button aria-label="退出登录" className="flex size-10 items-center justify-center text-faint hover:text-ink"><LogOut size={17} /></button></form>
          </>}
        </div>
      </div>
    </header>
    <main id="main-content" className="flex-1">{children}</main>
    <footer className="mt-auto border-t border-line">
      <div className="shell flex flex-wrap items-center justify-between gap-3 py-6 text-xs text-faint">
        <span>© 2026 ATELIER</span>
        <span>抖音数据以各视频标注的截止日期为准；转载作品按原授权署名。</span>
      </div>
    </footer>
  </div>;
}
