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

  const previewTrim = () => {
    if (!videoRef.current || startTime === null) return;
    videoRef.current.currentTime = startTime;
  };

  const handleSelectFile = (f: File | null) => {
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setVideoUrl(url);
    } else {
      setVideoUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!email) return setMessage("請輸入 Email");
    if (!file) return setMessage("請選擇影片");
    if (startTime === null || endTime === null)
      return setMessage("請設定剪輯時間");

    setUploading(true);
    setMessage("準備上傳…");

    try {
      // 向後端要求 presign
      const res = await fetch("/api/r2-presign", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          email,
        }),
      }).then((r) => r.json());

      if (res.error) throw new Error(res.error);

      const { uploadUrl, fields, publicUrl } = res;
      const objectKey = fields.key;

      // R2 multipart form
      const formData = new FormData();
      Object.entries(fields).forEach(([k, v]) =>
        formData.append(k, v as string)
      );
      formData.append("file", file);

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("R2 上傳失敗");

      // 建 job
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
          <video ref={videoRef} src={videoUrl} controls className="w-full" />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                if (!videoRef.current) return;
                setStartTime(videoRef.current.currentTime);
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded"
            >
              設為起點
            </button>

            <button
              onClick={() => {
                if (!videoRef.current) return;
                setEndTime(videoRef.current.currentTime);
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
        </>
      )}

      <button
        onClick={handleUpload}
        disabled={uploading}
        className="w-full p-3 bg-green-600 text-white rounded"
      >
        {uploading ? "上傳中…" : "送出任務"}
      </button>

      <p>{message}</p>
    </main>
  );
}
