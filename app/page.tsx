import Link from "next/link";
import { Button } from "../components/ui/button";
import { FileVideo, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="flex flex-col items-center justify-center gap-8 px-4 py-16 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-50">
            RunGait Pro
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-md">
            專業步態分析系統
            <br />
            透過 AI 技術提供精準的步態評估
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link href="/analyze">
              <FileVideo className="w-5 h-5 mr-2" />
              開始分析
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
            <Link href="/compare">
              <BarChart3 className="w-5 h-5 mr-2" />
              比較分析
            </Link>
          </Button>
        </div>

        <div className="mt-12 text-sm text-slate-500 dark:text-slate-400">
          <p>上傳您的步態影片，獲得專業的分析報告與改善建議</p>
        </div>
      </main>
    </div>
  );
}
