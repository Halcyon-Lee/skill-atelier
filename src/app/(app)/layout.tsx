import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only z-[300] focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:inline-flex focus:h-10 focus:items-center focus:bg-ink focus:px-4 focus:text-[12px] focus:text-cream"
      >
        跳到主要内容
      </a>
      <SiteHeader
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
          avatarColor: user.avatarColor,
        }}
      />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
