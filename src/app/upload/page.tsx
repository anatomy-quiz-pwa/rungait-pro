"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [userTag, setUserTag] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  const [videoFPS, setVideoFPS] = useState(120);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ✅ 只用 getUser，避免 race condition
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user?.email) {
        router.replace("/login");
        return;
      }
      setUserEmail(data.user.email);
      setCheckingAuth(false);
    })();
  }, [router]);

  if (checkingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center text-zinc-400">
        檢查登入狀態中…
      </main>
    );
  }

  const previewTrim = () => {
    if (!videoRef.current || startTime === null) return;
    videoRef.current.currentTime = startTime;
    videoRef.current.play().catch(() => {});
  };

  const handleSelectFile = (f: File | null) => {
    setFile(f);
    setStartTime(null);
    setEndTime(null);

    if (f) {
      setVideoUrl(URL.createObjectURL(f));
    } else {
      setVideoUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!userEmail) return setMessage("尚未登入，請重新登入");
    if (!file) return setMessage("請選擇影片");

    if ((startTime === null || endTime === null) && videoRef.current) {
      const duration = videoRef.current.duration;
      if (isFinite(duration) && duration > 0) {
        setStartTime(startTime ?? 0);
        setEndTime(endTime ?? duration);
      }
    }

    if (startTime === null || endTime === null) {
      return setMessage("請設定剪輯時間");
    }

    setUploading(true);
    setMessage("準備上傳…");

    try {
      // 1) presign
      const presignRes = await fetch("/api/r2-presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name }),
      });

      if (presignRes.status === 401) {
        throw new Error("登入已失效，請重新登入");
      }
      if (presignRes.status === 403) {
        throw new Error("此帳號尚未開通上傳權限");
      }
      if (!presignRes.ok) {
        throw new Error("預簽失敗（" + presignRes.status + "）");
      }

      const { uploadUrl, objectKey } = await presignRes.json();

      // 2) upload to R2
      setMessage("上傳影片中…");
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      if (!uploadRes.ok) {
        throw new Error("影片上傳失敗");
      }

      // 3) insert job
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          user_email: userEmail,
          user_tag: userTag || null,
          original_video_r2: objectKey,
          start_time: startTime,
          end_time: endTime,
          video_fps: videoFPS,
          status: "pending",
        })
        .select("id")
        .single();

      if (error) throw error;

      router.push(`/result?jobId=${data.id}`);
    } catch (err: any) {
      setMessage("錯誤：" + err.message);
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white/10 dark:bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4 shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-2">上傳影片並設定剪輯</h1>

        <div className="space-y-1">
          <label className="text-sm text-zinc-400">登入帳號</label>
          <div className="w-full border border-zinc-600 bg-zinc-950/60 text-white p-2 rounded-md">
            {userEmail}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-400">Tag（可選）</label>
          <input
            type="text"
            placeholder="baseline / post-training / race-1"
            className="w-full border border-zinc-600 bg-zinc-950/60 text-white p-2 rounded-md"
            value={userTag}
            onChange={(e) => setUserTag(e.target.value)}
          />
        </div>

        {/* 檔案選擇 */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">選擇影片</label>
          <label className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md cursor-pointer">
            選擇影片…
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => handleSelectFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="text-xs text-zinc-400">{file?.name ?? "尚未選擇"}</p>
        </div>

        {videoUrl && (
          <div className="space-y-2">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full rounded-md border border-zinc-700"
              onLoadedMetadata={() => {
                const d = videoRef.current?.duration ?? 0;
                if (d > 0) {
                  setStartTime(0);
                  setEndTime(d);
                }
              }}
            />
            <div className="flex gap-2">
              <button onClick={() => setStartTime(videoRef.current?.currentTime ?? null)} className="px-3 py-2 bg-emerald-600 text-white text-sm rounded">
                設為起點
              </button>
              <button onClick={() => setEndTime(videoRef.current?.currentTime ?? null)} className="px-3 py-2 bg-emerald-600 text-white text-sm rounded">
                設為終點
              </button>
              <button onClick={previewTrim} className="px-3 py-2 bg-zinc-700 text-white text-sm rounded">
                從起點預覽
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`w-full p-3 rounded-md font-semibold text-white ${
            uploading ? "bg-zinc-600" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {uploading ? "上傳中…" : "送出任務"}
        </button>

        {message && <p className="text-sm text-red-400">{message}</p>}

        <div className="text-right">
          <Link href="/result" className="text-xs text-zinc-400 hover:text-blue-400">
            測試：結果頁
          </Link>
        </div>
      </div>
    </main>
  );
}
