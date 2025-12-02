"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function UploadPage() {
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  const [videoFPS, setVideoFPS] = useState(120);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 預覽剪輯起點
  const previewTrim = () => {
    if (!videoRef.current || startTime === null) return;
    videoRef.current.currentTime = startTime;
    videoRef.current.play().catch(() => {});
  };

  // 選擇檔案：建立本機預覽
  const handleSelectFile = (f: File | null) => {
    console.log("📁 選擇檔案：", f);
    setFile(f);

    // ✅ 換影片時先重置起訖時間
    setStartTime(null);
    setEndTime(null);

    if (f) {
      const url = URL.createObjectURL(f);
      console.log("🎬 本機預覽 URL：", url);
      setVideoUrl(url);
    } else {
      setVideoUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!email) return setMessage("請輸入 Email");
    if (!file) return setMessage("請選擇影片");

    // ✅ 如果使用者沒有手動按「設為起點/終點」，但 metadata 有載入，
    //    我們嘗試自動補上 0 ~ duration
    if ((startTime === null || endTime === null) && videoRef.current) {
      const duration = videoRef.current.duration;
      if (isFinite(duration) && duration > 0) {
        if (startTime === null) setStartTime(0);
        if (endTime === null) setEndTime(duration);
      }
    }

    if (startTime === null || endTime === null) {
      return setMessage("請設定剪輯時間（或等影片載入完成再重試）");
    }

    setUploading(true);
    setMessage("準備上傳…");

    try {
      // 1) 向後端要 PUT 預簽 URL
      const presignRes = await fetch("/api/r2-presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          email,
        }),
      });

      if (!presignRes.ok) {
        const text = await presignRes.text().catch(() => "");
        console.error("❌ /api/r2-presign HTTP 錯誤：", presignRes.status, text);
        throw new Error(
          `預簽失敗：status=${presignRes.status} body=${text || "(no body)"}`
        );
      }

      const resJson = await presignRes.json().catch((e) => {
        console.error("❌ /api/r2-presign JSON 解析失敗：", e);
        throw new Error("預簽回應不是有效的 JSON");
      });

      console.log("📦 /api/r2-presign 回傳：", resJson);

      if (resJson.error) {
        throw new Error(resJson.error);
      }

      const { uploadUrl, objectKey } = resJson;

      // 2) 直接 PUT 檔案到 R2
      setMessage("上傳到 R2 中…");
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      console.log("📡 R2 回應狀態碼：", uploadRes.status);
      if (!uploadRes.ok) {
        const text = await uploadRes.text().catch(() => "");
        console.error("❌ R2 回傳錯誤內容：", text);
        throw new Error("R2 上傳失敗，狀態碼：" + uploadRes.status);
      }

      // 3) 建立 jobs 記錄
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          user_email: email,
          original_video_r2: objectKey,
          start_time: startTime,
          end_time: endTime,
          video_fps: videoFPS,
          status: "pending",
        })
        .select("id")
        .single();

      if (error) throw error;

      setMessage("成功送出，跳轉中…");
      window.location.href = `/result?jobId=${data.id}`;
    } catch (err: any) {
      console.error("❌ handleUpload 失敗：", err);
      setMessage("錯誤：" + err.message);
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white/10 dark:bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4 shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-2">上傳影片並設定剪輯</h1>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm text-zinc-400">Email</label>
          <input
            type="email"
            placeholder="輸入 Email"
            className="w-full border border-zinc-600 bg-zinc-950/60 text-white p-2 rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* 檔案選擇 */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">選擇影片檔案</label>
          <div className="flex items-center gap-3">
            <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md cursor-pointer shadow">
              選擇影片…
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleSelectFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <span className="text-xs text-zinc-400 break-all">
              {file ? file.name : "尚未選擇檔案"}
            </span>
          </div>
        </div>

        {/* 預覽區 */}
        {videoUrl && (
          <div className="space-y-2">
            <video
              key={videoUrl}
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full rounded-md border border-zinc-700"
              onLoadedMetadata={() => {
                const dur = videoRef.current?.duration ?? 0;
                console.log("🎞️ 影片 metadata 載入完成，duration =", dur);

                // ✅ 自動把起訖時間預設為 0 ~ duration
                if (isFinite(dur) && dur > 0) {
                  setStartTime(0);
                  setEndTime(dur);
                }
              }}
              onError={(e) => {
                console.error("❌ 影片無法播放，可能瀏覽器不支援這個編碼", e);
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  if (!videoRef.current) return;
                  const t = videoRef.current.currentTime;
                  console.log("⏱ 設為起點：", t);
                  setStartTime(t);
                }}
                className="px-3 py-2 bg-emerald-600 text-white text-sm rounded"
              >
                設為起點
              </button>

              <button
                onClick={() => {
                  if (!videoRef.current) return;
                  const t = videoRef.current.currentTime;
                  console.log("⏱ 設為終點：", t);
                  setEndTime(t);
                }}
                className="px-3 py-2 bg-emerald-600 text-white text-sm rounded"
              >
                設為終點
              </button>

              <button
                onClick={previewTrim}
                className="px-3 py-2 bg-zinc-700 text-white text-sm rounded"
              >
                從起點預覽
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              起點：{startTime !== null ? startTime.toFixed(2) : "--"} 秒　/　終點：
              {endTime !== null ? endTime.toFixed(2) : "--"} 秒
            </p>
          </div>
        )}

        {/* FPS */}
        <div className="space-y-1">
          <label className="text-sm text-zinc-400">影片 FPS（預設 120）</label>
          <input
            type="number"
            min={1}
            max={240}
            value={videoFPS}
            onChange={(e) => setVideoFPS(Number(e.target.value) || 0)}
            className="w-full border border-zinc-600 bg-zinc-950/60 text-white p-2 rounded-md"
          />
        </div>

        {/* 送出按鈕 */}
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`w-full p-3 rounded-md font-semibold text-white mt-2 ${
            uploading
              ? "bg-zinc-600 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {uploading ? "上傳中…" : "送出任務"}
        </button>

        {message && (
          <p className="text-sm text-red-400 whitespace-pre-wrap mt-1">
            {message}
          </p>
        )}

        <div className="mt-3 text-right">
          <Link href="/result" className="text-xs text-zinc-400 hover:text-blue-400">
            測試用：直接看結果頁
          </Link>
        </div>
      </div>
    </main>
  );
}
