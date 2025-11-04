"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ResultPage() {
  const [email, setEmail] = useState("");
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ 讀取網址參數並載入最新結果
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
      fetchLatestResult(emailParam);
    }
  }, []);

  // ✅ 從 Supabase 取得最新 job
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

  // ✅ 檔案下載（透過 Supabase Storage）
  const handleDownload = async (bucket: string, path: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`❌ 無法下載 ${filename}\n${err.message}`);
    }
  };

  // ✅ 統一按鈕樣式
  const baseBtn =
    "w-full py-3 rounded-lg font-semibold text-white transition inline-flex items-center justify-center shadow-md text-lg";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6 text-center text-zinc-800 dark:text-zinc-200">
      <div className="bg-white/10 dark:bg-zinc-900 p-8 rounded-2xl shadow-lg w-full max-w-2xl border border-zinc-700">
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

            {/* ✅ 分析完成時顯示結果 */}
            {job.status === "done" && job.result_json?.files ? (
              <div className="space-y-4">
                {/* 🎬 影片下載 */}
                <button
                  onClick={async () => {
                    const files = job.result_json?.files || {};
                    const entry = Object.entries(files).find(([n]) =>
                      n.toLowerCase().endsWith(".mp4")
                    );
                    if (!entry) return window.open(job.result_signed_url, "_blank");
                    const [fileName, meta] = entry as [string, { bucket: string; path: string }];
                    await handleDownload(meta.bucket, meta.path, fileName);
                  }}
                  className={`${baseBtn} bg-green-600 hover:bg-green-700`}
                >
                  ⬇️ 下載 影片mp4檔
                </button>

                {/* 📊 下載 Excel */}
                {Object.entries(job.result_json.files)
                  .filter(([n]) => n.toLowerCase().endsWith(".xlsx"))
                  .map(([fileName, fileInfo]: [string, any]) => (
                    <button
                      key={fileName}
                      onClick={() =>
                        handleDownload(fileInfo.bucket, fileInfo.path, fileName)
                      }
                      className={`${baseBtn} bg-amber-600 hover:bg-amber-700`}
                    >
                      📊 下載 分析結果xlsx檔
                    </button>
                  ))}

                {/* 🖼️ 下載 PNG */}
                {Object.entries(job.result_json.files)
                  .filter(([n]) => n.toLowerCase().endsWith(".png"))
                  .map(([fileName, fileInfo]: [string, any]) => (
                    <button
                      key={fileName}
                      onClick={() =>
                        handleDownload(fileInfo.bucket, fileInfo.path, fileName)
                      }
                      className={`${baseBtn} bg-blue-600 hover:bg-blue-700`}
                    >
                      🖼️ 下載 分析圖表png檔
                    </button>
                  ))}
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
