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
      .select(
        "id, user_email, status, result_signed_url, result_video_path, result_json, error_msg"
      )
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

            {/* ✅ 分析完成顯示結果 */}
            {job.status === "done" && job.result_json?.files ? (
              <div className="space-y-6">
                {/* 🎥 主影片播放（如果有 result_signed_url） */}
                {job.result_signed_url && (
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
                      download={job.result_video_path?.split("/").pop() || "result.mp4"}
                      className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition inline-flex items-center justify-center"
                    >
                      ⬇️ 下載分析影片
                    </a>
                  </div>
                )}

                {/* 📂 其他檔案（根據副檔名分類顯示） */}
                <div className="flex flex-col gap-3 mt-6">
                  {Object.entries(job.result_json.files).map(([fileName, path]) => {
                    const ext = fileName.split(".").pop()?.toLowerCase();
                    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;

                    if (ext === "png") {
                      // 🖼️ 顯示圖片預覽 + 下載
                      return (
                        <div key={fileName} className="space-y-2">
                          <p className="text-sm text-zinc-400">{fileName}</p>
                          <img
                            src={publicUrl}
                            alt={fileName}
                            className="w-full rounded-lg border border-zinc-700"
                          />
                          <a
                            href={publicUrl}
                            download={fileName}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition inline-flex items-center justify-center"
                          >
                            🖼️ 下載 {fileName}
                          </a>
                        </div>
                      );
                    } else if (ext === "xlsx") {
                      // 📊 下載 Excel
                      return (
                        <a
                          key={fileName}
                          href={publicUrl}
                          download={fileName}
                          className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition inline-flex items-center justify-center"
                        >
                          📊 下載 {fileName}
                        </a>
                      );
                    } else if (ext === "mp4") {
                      // 🎬 顯示影片（避免重複主影片）
                      if (job.result_signed_url?.includes(fileName)) return null;
                      return (
                        <div key={fileName} className="space-y-2">
                          <p className="text-sm text-zinc-400">{fileName}</p>
                          <video
                            controls
                            className="w-full rounded-lg border border-zinc-700"
                            src={publicUrl}
                          />
                          <a
                            href={publicUrl}
                            download={fileName}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition inline-flex items-center justify-center"
                          >
                            🎬 下載 {fileName}
                          </a>
                        </div>
                      );
                    } else {
                      // 其他未知檔案
                      return (
                        <a
                          key={fileName}
                          href={publicUrl}
                          download={fileName}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition inline-flex items-center justify-center"
                        >
                          📁 下載 {fileName}
                        </a>
                      );
                    }
                  })}
                </div>
              </div>
            ) : job.status === "failed" ? (
              <p className="text-red-400">❌ 分析失敗，請重新上傳影片。</p>
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
