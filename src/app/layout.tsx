import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "ATELIER · 私人技能档案馆",
    template: "%s · ATELIER",
  },
  description:
    "一个只对受邀者开放的 AI Agent Skill 档案馆。收藏、讨论并分享那些真正值得留在工具箱里的技能。",
  applicationName: "ATELIER",
  authors: [{ name: "ATELIER" }],
  openGraph: {
    title: "ATELIER · 私人技能档案馆",
    description: "一个只对受邀者开放的 AI Agent Skill 档案馆。",
    type: "website",
    locale: "zh_CN",
    siteName: "ATELIER",
  },
  twitter: {
    card: "summary",
    title: "ATELIER · 私人技能档案馆",
    description: "一个只对受邀者开放的 AI Agent Skill 档案馆。",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f2ede3",
  colorScheme: "light",
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
