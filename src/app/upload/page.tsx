"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useRef } from "react";

// ✅ 初始化 Supabase（使用環境變數）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UploadPage() {
  const [email, setEmail] = useState("");
  const [frameCount, setFrameCount] = useState(300);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const subscribedRef = useRef(false);
  const MAX_SIZE = 50 * 1024 * 1024; // 50 MB 限制

  // 🧠 Realtime 訂閱：偵測分析狀態更新
  useEffect(() => {
    if (!email) {
        console.log("⚠️ 尚未輸入 email，不啟用 Realtime");
        return;
    }
    if (subscribedRef.current) {
        console.log("⚙️ 已訂閱過，略過重複訂閱");
        return;
    }

    console.log("🔔 啟用 Realtime 訂閱 for:", email);
    subscribedRef.current = true;

    const channel = supabase
        .channel(`job-status-${email}`)
        .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "jobs",
            filter: `user_email=eq.'${email}'`,
        },
        (payload) => {
            console.log("🧩 收到更新事件:", payload);
            const data = payload.new as { status?: string; error_msg?: string };
            const status = data?.status;

            if (status === "processing") setMessage("🕐 分析中，請稍候...");
            else if (status === "done") {
            setMessage("✅ 分析完成！點擊下方按鈕查看結果");
            setUploading(false);
            } else if (status === "failed") {
            setMessage(`❌ 分析失敗：${data.error_msg || "未知錯誤"}`);
            setUploading(false);
            }
        }
        )
        .subscribe((status) => console.log("📡 訂閱狀態:", status));

    return () => {
        console.log("❎ 卸載時移除 Realtime 訂閱");
        supabase.removeChannel(channel);
    };
    }, [email]);

  // 🧩 上傳影片
  const handleUpload = async () => {
    if (!email || !file) {
      setMessage("請輸入 Email 並選擇影片");
      return;
    }
    if (file.size > MAX_SIZE) {
      setMessage("影片超過 50 MB，請重新選擇");
      return;
    }

    setUploading(true);
    setMessage("上傳中…");

    try {
      const filePath = `${email}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("jobs")
        .insert({
          user_email: email,
          frame_count: frameCount,
          storage_path: filePath,
          status: "pending",
          orig_filename: file.name,
        });

      if (insertError) throw insertError;

      // ✅ 上傳結束後立刻開放 Realtime 可以接收到 processing/done
      setUploading(false);
      setMessage("✅ 影片已上傳成功，正在分析中…");
    } catch (err: any) {
      setMessage(`❌ 發生錯誤：${err.message}`);
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6 transition-colors duration-500 relative">
      <div className="bg-white/10 dark:bg-zinc-900 backdrop-blur-md p-8 rounded-2xl shadow-lg w-full max-w-md space-y-5 border border-zinc-700">
        <h1 className="text-3xl font-bold text-center text-zinc-900 dark:text-zinc-100">
          上傳影片進行分析
        </h1>
        <p className="text-center text-zinc-600 dark:text-zinc-400 text-sm">
          請上傳你的跑步影片（限制 50 MB），系統會自動進行姿勢分析。
        </p>

        <input
          type="email"
          placeholder="輸入 Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800 text-black dark:text-white p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <input
          type="number"
          placeholder="幀數（例如 300）"
          value={frameCount}
          onChange={(e) => setFrameCount(Number(e.target.value))}
          className="w-full border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800 text-black dark:text-white p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800 text-black dark:text-white p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <button
          disabled={uploading}
          onClick={handleUpload}
          className={`w-full p-3 rounded-md font-semibold text-white transition ${
            uploading
              ? "bg-zinc-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
          }`}
        >
          {uploading ? "上傳中…" : "上傳並分析"}
        </button>

        {/* 🧩 顯示狀態訊息 */}
        {message && (
          <div className="text-center text-sm text-zinc-800 dark:text-zinc-300 mt-3 space-y-2">
            <p>{message}</p>
            {message.includes("分析完成") && (
              <Link
                href={`/result?email=${encodeURIComponent(email)}`}
                className="inline-block px-5 py-2 mt-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                🎥 查看分析結果
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ← 回首頁按鈕 */}
      <div className="absolute bottom-6">
        <Link
          href="/"
          className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-blue-400 dark:hover:text-blue-300 transition"
        >
          ← 回首頁
        </Link>
      </div>
    </main>
  );
}
