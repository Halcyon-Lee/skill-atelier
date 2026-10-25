import type { Metadata } from "next";
import { requireAdminOr404 } from "@/lib/gallery/server";
import { VideoFooter } from "@/components/video/shell";
import { VideoHeader } from "@/components/video/shell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // The skill archive and admin tools are internal now; members and visitors get a 404.
  await requireAdminOr404();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only z-[300] focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:inline-flex focus:h-10 focus:items-center focus:bg-accent focus:px-4 focus:text-[14px] focus:text-on-accent"
      >
        跳到主要内容
      </a>
      <VideoHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <VideoFooter />
    </div>
  );
}
