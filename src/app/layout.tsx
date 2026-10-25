import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "ATELIER · AI 视频作品",
    template: "%s · ATELIER",
  },
  description:
    "用 skill 和 AI 做出来的视频，以及它们在抖音的真实表现。",
  applicationName: "ATELIER",
  authors: [{ name: "ATELIER" }],
  openGraph: {
    title: "ATELIER · AI 视频作品",
    description: "用 skill 和 AI 做出来的视频，以及它们在抖音的真实表现。",
    type: "website",
    locale: "zh_CN",
    siteName: "ATELIER",
  },
  twitter: {
    card: "summary",
    title: "ATELIER · AI 视频作品",
    description: "用 skill 和 AI 做出来的视频，以及它们在抖音的真实表现。",
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
