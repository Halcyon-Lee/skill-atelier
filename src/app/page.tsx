import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { VIDEO_STYLES } from "@/lib/video/catalog";
import { getFavoriteStyles } from "@/lib/video/server";
import { VideoShell } from "@/components/video/shell";
import { StyleGallery } from "@/components/video/style-gallery";
export default async function HomePage() {
  const user=await getSessionUser();
  return <VideoShell>
    <section id="styles" className="shell scroll-mt-40 py-8 sm:py-10">
      <div className="mb-7 flex items-center justify-between gap-4"><h1 className="text-xl font-medium">视频风格</h1><span className="font-mono text-[11px] text-faint">{String(VIDEO_STYLES.length).padStart(2,"0")} CURATED STYLES</span></div>
      <StyleGallery styles={VIDEO_STYLES} favorites={getFavoriteStyles(user?.id)} loggedIn={!!user}/>
      <div className="my-8 flex flex-wrap items-center justify-between gap-5 rounded-xl border border-line bg-raised px-6 py-7"><div><p className="text-lg font-medium">从一个想法，到一支影片。</p><p className="mt-1 text-sm text-muted">选风格、写脚本，制作完成后在「我的作品」里查看。</p></div><Link href="/styles/swiss-motion" className="btn btn-outline">试试瑞士动态排版<ArrowUpRight size={16}/></Link></div>
    </section>
  </VideoShell>;
}
