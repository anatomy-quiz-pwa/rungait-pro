"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ResultPage() {
  const [email, setEmail] = useState("");
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ 從網址取得 ?email 參數
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
      fetchLatestResult(emailParam);
    }
  }, []);

  // ✅ 從 Supabase 抓最新分析結果
  async function fetchLatestResult(email: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("id, user_email, status, result_signed_url, result_video_path, error_msg")
      .eq("user_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("❌ 無法取得結果:", error);
    } else {
      setJob(data);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6 text-center text-zinc-800 dark:text-zinc-200">
      <div className="bg-white/10 dark:bg-zinc-900 backdrop-blur-md p-8 rounded-2xl shadow-lg w-full max-w-2xl border border-zinc-700">
        <h1 className="text-3xl font-bold mb-6">🎥 分析結果頁面</h1>

        {loading ? (
          <p>載入中...</p>
        ) : job ? (
          <>
            <p className="mb-3 text-zinc-400">
              使用者：<span className="text-white">{job.user_email}</span>
            </p>
            <p className="mb-6">
              狀態：
              <span
                className={`font-semibold ${
                  job.status === "done"
                    ? "text-green-400"
                    : job.status === "failed"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                {job.status}
              </span>
            </p>

            {job.status === "done" ? (
              job.result_signed_url ? (
                <div>
                  <video
                    controls
                    className="w-full rounded-lg border border-zinc-700 mb-4"
                    src={job.result_signed_url}
                  >
                    您的瀏覽器不支援影片播放。
                  </video>
                  <a
                    href={job.result_signed_url}
                    download
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium inline-flex items-center"
                  >
                    ⬇ 下載分析結果
                  </a>
                </div>
              ) : (
                <p className="text-zinc-400">
                  簽名連結尚未產生或已過期，請稍後再試。
                </p>
              )
            ) : job.status === "failed" ? (
              <p className="text-red-400">
                ❌ 分析失敗：{job.error_msg || "請重新上傳影片。"}
              </p>
            ) : (
              <p className="text-yellow-400">⏳ 分析中，請稍後再試。</p>
            )}
          </>
        ) : (
          <p>找不到分析記錄。</p>
        )}

        {/* ← 回上傳頁 */}
        <div className="mt-8">
          <Link
            href="/upload"
            className="text-sm text-zinc-400 hover:text-blue-400 transition"
          >
            ← 回上傳頁面
          </Link>
        </div>
      </div>
    </main>
  );
}
