// src/app/page.tsx
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-black dark:text-zinc-50">
            上傳跑步影片，獲得分析結果
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            透過 AI 運動姿勢分析系統，幫助你了解每一步的動作細節，
            找出潛在問題與改善方向。立即上傳影片，開始你的智能運動分析體驗。
          </p>
        </div>

        <div className="mt-10 flex justify-center w-full">
          <Link
            href="/login"
            className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
          >
            登入後上傳影片
          </Link>
        </div>
      </main>
    </div>
  );
}
