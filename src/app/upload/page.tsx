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

  // 🔍 預覽起點
  const previewTrim = () => {
    if (!videoRef.current || startTime === null) return;
    videoRef.current.currentTime = startTime;
    videoRef.current.play().catch(() => {});
  };

  // 🔍 選檔：建立本機 blob URL
  const handleSelectFile = (f: File | null) => {
    console.log("📁 handleSelectFile 被呼叫，檔案：", f);
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      console.log("🎬 建立本機預覽 URL：", url);
      setVideoUrl(url);
    } else {
      setVideoUrl(null);
    }
  };

  // 🔼 上傳處理
  const handleUpload = async () => {
    if (!email) return setMessage("請輸入 Email");
    if (!file) return setMessage("請選擇影片");
    if (startTime === null || endTime === null)
      return setMessage("請設定剪輯時間");

    setUploading(true);
    setMessage("準備上傳…");

    try {
      console.log("🚀 送出 /api/r2-presign 請求");
      const presignRes = await fetch("/api/r2-presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // 建議帶上
        },
        body: JSON.stringify({
          fileName: file.name,
          email,
        }),
      });

      const resJson = await presignRes.json();
      console.log("📦 /api/r2-presign 回傳：", resJson);

      if (resJson.error) throw new Error(resJson.error);

      const { uploadUrl, fields } = resJson;
      const objectKey = fields.key;

      // 組 POST formData
      const formData = new FormData();
      Object.entries(fields).forEach(([k, v]) =>
        formData.append(k, v as string)
      );
      formData.append("file", file);

      console.log("⬆️ 開始上傳到 R2：", uploadUrl);
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      console.log("📡 R2 回應狀態碼：", uploadRes.status);
      if (!uploadRes.ok) {
        const text = await uploadRes.text();
        console.error("❌ R2 回傳錯誤內容：", text);
        throw new Error("R2 上傳失敗，狀態碼：" + uploadRes.status);
      }

      // 建 job
      console.log("🧾 建立 jobs 記錄");
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
    <main className="p-4 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">影片上傳並設定剪輯</h1>

      <input
        type="email"
        placeholder="Email"
        className="w-full border p-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="file"
        accept="video/*"
        onChange={(e) => handleSelectFile(e.target.files?.[0] ?? null)}
      />

      {videoUrl && (
        <>
          <video
            key={videoUrl} // 👈 確保檔案更換時強制重新掛載
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full rounded"
            onLoadedMetadata={() => {
              console.log(
                "🎞️ 影片 metadata 載入完成，duration =",
                videoRef.current?.duration
              );
            }}
            onError={(e) => {
              console.error("❌ 影片無法播放，可能瀏覽器不支援編碼", e);
            }}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                if (!videoRef.current) return;
                const t = videoRef.current.currentTime;
                console.log("⏱ 設為起點：", t);
                setStartTime(t);
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded"
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
              className="px-3 py-2 bg-blue-600 text-white rounded"
            >
              設為終點
            </button>

            <button
              onClick={previewTrim}
              className="px-3 py-2 bg-zinc-700 text-white rounded"
            >
              預覽起點
            </button>
          </div>

          <p className="text-sm text-zinc-500">
            起點：{startTime?.toFixed(2)} 秒　終點：
            {endTime?.toFixed(2)} 秒
          </p>
        </>
      )}

      <input
        type="number"
        min={1}
        max={240}
        value={videoFPS}
        onChange={(e) => setVideoFPS(Number(e.target.value))}
        className="w-full border p-2"
        placeholder="影片 FPS"
      />

      <button
        onClick={handleUpload}
        disabled={uploading}
        className="w-full p-3 bg-green-600 text-white rounded"
      >
        {uploading ? "上傳中…" : "送出任務"}
      </button>

      <p className="text-sm text-red-500 whitespace-pre-wrap">{message}</p>

      <Link href="/result" className="text-sm text-blue-500">
        查看最近一筆結果（測試）
      </Link>
    </main>
  );
}
