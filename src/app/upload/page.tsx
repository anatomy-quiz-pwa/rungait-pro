"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

// ===== 可調參數 =====
const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXT = [".mp4", ".mov", ".m4v", ".avi", ".webm"];
const UPLOADS_PER_10MIN_LIMIT = 5;
const UPLOADS_PER_HOUR_LIMIT = 3;

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 2000;
const RECONNECT_MAX_DELAY_MS = 30000;

export default function UploadPage() {
  const [email, setEmail] = useState("");
  const [videoFPS, setVideoFPS] = useState(30);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const debouncedEmailRef = useRef<string>("");
  const debounceTimerRef = useRef<number | null>(null);

  // ===== 工具函式 =====
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const backoffDelay = (n: number) =>
    Math.min(RECONNECT_BASE_DELAY_MS * 2 ** (n - 1), RECONNECT_MAX_DELAY_MS);

  const removeCurrentChannel = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    subscribedRef.current = false;
  };

  // ===== 建立 Realtime 訂閱 =====
  const subscribeOnce = (effectiveEmail: string) => {
    if (!effectiveEmail || subscribedRef.current) return;
    subscribedRef.current = true;
    reconnectAttemptsRef.current = 0;

    const ch = supabase
      .channel(`job-status-${effectiveEmail}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
          filter: `user_email=eq.${effectiveEmail}`,
        },
        (payload) => {
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
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setIsConnected(true);
        if (status === "CLOSED" || status === "TIMED_OUT") setIsConnected(false);
      });

    channelRef.current = ch;
  };

  // ===== Realtime 斷線重連監控 =====
  useEffect(() => {
    let cancelled = false;
    const monitor = async () => {
      while (!cancelled) {
        await sleep(10000);
        if (!debouncedEmailRef.current || isConnected || !subscribedRef.current) continue;
        if (!navigator.onLine) continue;
        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setMessage("🔴 Realtime 已中斷且重連達上限，請重新整理或稍後再試");
          break;
        }
        reconnectAttemptsRef.current += 1;
        const delay = backoffDelay(reconnectAttemptsRef.current);
        setMessage(`⚡ 嘗試重新連線中（第 ${reconnectAttemptsRef.current} 次）…`);
        await sleep(delay);
        removeCurrentChannel();
        subscribeOnce(debouncedEmailRef.current);
      }
    };
    monitor();
    return () => {
      cancelled = true;
    };
  }, [isConnected]);

  // ===== Email 去抖動處理 =====
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (!email) return;
    debounceTimerRef.current = window.setTimeout(() => {
      debouncedEmailRef.current = email.trim();
      if (!subscribedRef.current) subscribeOnce(debouncedEmailRef.current);
    }, 500);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [email]);

  useEffect(() => {
    return () => removeCurrentChannel();
  }, []);

  // ===== 本地頻率限制 (localStorage) =====
  const checkLocalQuota = () => {
    try {
      const key = "upload_history_v1";
      const now = Date.now();
      const tenMinutesAgo = now - 10 * 60 * 1000;
      const arr = JSON.parse(localStorage.getItem(key) || "[]").filter((t: number) => t > tenMinutesAgo);
      if (arr.length >= UPLOADS_PER_10MIN_LIMIT) {
        const remain = Math.max(10 - Math.floor((now - arr[0]) / 60000), 0);
        return { ok: false, remain };
      }
      arr.push(now);
      localStorage.setItem(key, JSON.stringify(arr));
      return { ok: true };
    } catch {
      return { ok: true };
    }
  };

  // ===== 從 Supabase 檢查 Email 上傳次數 (真正根據帳號) =====
  async function checkEmailQuota(email: string) {
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from("jobs")
      .select("created_at")
      .eq("user_email", email)
      .gte("created_at", oneHourAgo)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("查詢上傳次數錯誤:", error);
      return { ok: true };
    }
    if (data && data.length >= UPLOADS_PER_HOUR_LIMIT) {
      const oldest = new Date(data[0].created_at).getTime();
      const remain = 60 - Math.floor((Date.now() - oldest) / 60000);
      return { ok: false, remain };
    }
    return { ok: true };
  }

  // ===== 備援：輪詢 job 狀態 =====
  async function pollJobStatus(email: string) {
    const MAX_POLLS = 24;
    for (let i = 0; i < MAX_POLLS; i++) {
      const { data } = await supabase
        .from("jobs")
        .select("status")
        .eq("user_email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.status === "done") {
        setMessage("✅ 分析完成！點擊下方按鈕查看結果");
        setUploading(false);
        return;
      } else if (data?.status === "failed") {
        setMessage("❌ 分析失敗，請稍後再試");
        setUploading(false);
        return;
      }
      await sleep(5000);
    }
    setMessage("⌛ 等待分析超時，請稍後重試。");
  }

  // ===== 上傳處理 =====
  const handleUpload = async () => {
    if (uploading) return;
    if (!email) return setMessage("請輸入 Email");
    if (!file) return setMessage("請選擇影片");
    if (file.size > MAX_SIZE) return setMessage("影片超過 50MB");

    const ext = file.name.toLowerCase();
    if (!ALLOWED_EXT.some((x) => ext.endsWith(x))) return setMessage("檔案格式不支援");

    // ✅ Step 1: 先檢查帳號上傳次數（跨裝置有效）
    const quotaByEmail = await checkEmailQuota(email);
    if (!quotaByEmail.ok)
      return setMessage(`⛔ ${email} 一小時內已上傳 3 次，請 ${quotaByEmail.remain} 分鐘後再試`);

    // ✅ Step 2: 本地限制（防止誤觸連續上傳）
    const quota = checkLocalQuota();
    if (!quota.ok)
      return setMessage(`⛔ 本機上傳過於頻繁，請 ${quota.remain} 分鐘後再試`);

    setUploading(true);
    setMessage("上傳中…");

    try {
      const path = `${email}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("videos").upload(path, file);
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("jobs").insert({
        user_email: email,
        storage_path: path,
        status: "pending",
        orig_filename: file.name,
        video_fps: videoFPS,
      });
      if (insErr) throw insErr;

      setMessage("✅ 影片已上傳成功，正在分析中…");
      pollJobStatus(email);
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ 錯誤：${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // ===== UI =====
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6 relative">
      <div className="bg-white/10 dark:bg-zinc-900 p-8 rounded-2xl shadow-lg w-full max-w-md space-y-5 border border-zinc-700">
        <h1 className="text-3xl font-bold text-center">上傳影片進行分析</h1>
        <input
          type="email"
          placeholder="輸入 Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded-md bg-white/60 dark:bg-zinc-800"
        />
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full border p-2 rounded-md bg-white/60 dark:bg-zinc-800"
        />
        <input
          type="number"
          min={1}
          max={240}
          step={1}
          value={videoFPS}
          onChange={(e) => setVideoFPS(Number(e.target.value) || 0)}
          className="w-full border p-2 rounded-md bg-white/60 dark:bg-zinc-800"
          placeholder="影片 FPS (預設 30)"
        />
        <button
          disabled={uploading}
          onClick={handleUpload}
          className={`w-full p-3 rounded-md font-semibold text-white ${
            uploading ? "bg-zinc-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {uploading ? "上傳中…" : "上傳並分析"}
        </button>

        {message && (
          <div className="text-center text-sm mt-3">
            <p>{message}</p>
            {message.includes("分析完成") && (
              <Link
                href={`/result?email=${encodeURIComponent(email)}`}
                className="inline-block px-5 py-2 mt-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                🎥 查看分析結果
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
