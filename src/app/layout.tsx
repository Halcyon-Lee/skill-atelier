import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "ATELIER · AI 视频创作",
    template: "%s · ATELIER",
  },
  description:
    "选一种喜欢的视频风格，写下你的脚本，让想法成为影片。",
  applicationName: "ATELIER",
  authors: [{ name: "ATELIER" }],
  openGraph: {
    title: "ATELIER · AI 视频创作",
    description: "精选视频风格，用自己的脚本创作属于你的影片。",
    type: "website",
    locale: "zh_CN",
    siteName: "ATELIER",
  },
  twitter: {
    card: "summary",
    title: "ATELIER · AI 视频创作",
    description: "精选视频风格，用自己的脚本创作属于你的影片。",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#070a08",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
