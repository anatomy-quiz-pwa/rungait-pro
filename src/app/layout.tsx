import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RunGait Pro - 步態分析系統",
  description: "專業步態分析系統，透過 AI 技術提供精準的步態評估",
};

// 強制動態渲染
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* 版本標記 - 用於確認部署版本 */}
        <div className="fixed bottom-2 right-2 text-xs opacity-60 font-mono bg-black/20 dark:bg-white/20 px-2 py-1 rounded">
          v:{process.env.NEXT_PUBLIC_COMMIT_SHA?.slice(0, 7) || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev'}
        </div>
      </body>
    </html>
  );
}
