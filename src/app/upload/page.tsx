"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** ====== 可調參數 ====== */
const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXT = [".mp4", ".mov", ".m4v", ".avi", ".webm"];
const UPLOADS_PER_HOUR_LIMIT = 3;

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 2000; // 2s
const RECONNECT_MAX_DELAY_MS = 30000; // 30s

export default function UploadPage() {
  const [email, setEmail] = useState("");
  const [frameCount, setFrameCount] = useState(300);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  /** Realtime 管理 */
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const debouncedEmailRef = useRef<string>(""); // 去抖動後生效的 email
  const debounceTimerRef = useRef<number | null>(null);

  /** ====== 工具：指數退避 ====== */
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const backoffDelay = (attempt: number) =>
    Math.min(RECONNECT_BASE_DELAY_MS * 2 ** Math.max(0, attempt - 1), RECONNECT_MAX_DELAY_MS);

  /** ====== 工具：安全移除通道 ====== */
  const removeCurrentChannel = () => {
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch (e) {
        console.warn("removeChannel error:", e);
      }
      channelRef.current = null;
    }
    subscribedRef.current = false;
  };

  /** ====== 建立訂閱（單一） ====== */
  const subscribeOnce = (effectiveEmail: string) => {
    if (!effectiveEmail || subscribedRef.current) return;

    console.log("🔔 建立 Realtime 訂閱 for:", effectiveEmail);
    subscribedRef.current = true;
    reconnectAttemptsRef.current = 0; // 新訂閱重置

    const ch = supabase
      .channel(`job-status-${effectiveEmail}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
          filter: `user_email=eq.'${effectiveEmail}'`,
        },
        (payload) => {
          console.log("🧩 Realtime payload:", payload);
          const data = payload.new as { status?: string; error_msg?: string };
          const status = data?.status;

          if (status === "processing") {
            setMessage("🕐 分析中，請稍候...");
          } else if (status === "done") {
            setMessage("✅ 分析完成！點擊下方按鈕查看結果");
            setUploading(false);
          } else if (status === "failed") {
            setMessage(`❌ 分析失敗：${data.error_msg || "未知錯誤"}`);
            setUploading(false);
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 訂閱狀態:", status);
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else if (status === "CLOSED" || status === "TIMED_OUT") {
          setIsConnected(false);
          // 交給監控迴圈處理重連
        }
      });

    channelRef.current = ch;
  };

  /** ====== 監控：斷線自動重連（有上限） ====== */
  useEffect(() => {
    let isCancelled = false;

    const monitor = async () => {
      while (!isCancelled) {
        await sleep(10000); // 每 10 秒監控一次

        // 當前沒 email、或已連線、或沒訂閱就略過
        if (!debouncedEmailRef.current || isConnected || !subscribedRef.current) continue;

        // 若離線，不要爆衝重試
        if (!navigator.onLine) {
          console.warn("⚠️ 瀏覽器離線，等待網路恢復再重試");
          continue;
        }

        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.error("❌ Realtime 重連已達上限，停止嘗試");
          setMessage("🔴 Realtime 已中斷且重連達上限，請重新整理或稍後再試");
          break;
        }

        reconnectAttemptsRef.current += 1;
        const delay = backoffDelay(reconnectAttemptsRef.current);
        console.log(`🔄 嘗試重連 #${reconnectAttemptsRef.current}，等待 ${delay}ms…`);
        setMessage(`⚡ 嘗試重新連線中（第 ${reconnectAttemptsRef.current} 次）…`);

        await sleep(delay);
        // 重新建立通道（先刪舊的）
        removeCurrentChannel();
        subscribeOnce(debouncedEmailRef.current);
      }
    };

    monitor();
    return () => {
      isCancelled = true;
    };
  }, [isConnected]);

  /** ====== 去抖動處理 email，避免暴力重訂閱 ====== */
  useEffect(() => {
    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    if (!email) {
      // 清空 email 時，保留現有通道直到頁面卸載，避免連續 CLOSE 風暴
      return;
    }

    debounceTimerRef.current = window.setTimeout(() => {
      debouncedEmailRef.current = email.trim();
      if (!subscribedRef.current) {
        subscribeOnce(debouncedEmailRef.current);
      }
    }, 500); // 500ms 去抖動

    return () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    };
  }, [email]);

  /** ====== 頁面可見性、網路恢復時嘗試喚醒 ====== */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && !isConnected && debouncedEmailRef.current) {
        console.log("👀 頁面回到可見，嘗試喚醒連線");
        // 讓監控迴圈下一輪處理；或直接觸發一次輕量重試：
        removeCurrentChannel();
        subscribeOnce(debouncedEmailRef.current);
      }
    };
    const onOnline = () => {
      console.log("🌐 網路恢復，嘗試喚醒連線");
      removeCurrentChannel();
      subscribeOnce(debouncedEmailRef.current);
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
    };
  }, [isConnected]);

  /** ====== 卸載清理（只在真正離開頁面時） ====== */
  useEffect(() => {
    return () => {
      console.log("❎ 頁面卸載，移除 Realtime 訂閱");
      removeCurrentChannel();
    };
  }, []);

  /** ====== 上傳次數限制（每小時最多 3 次） ====== */
  const checkHourlyQuota = () => {
    try {
      const key = "upload_history_v1";
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      const arr = JSON.parse(localStorage.getItem(key) || "[]") as number[];
      const recent = arr.filter((t) => t > oneHourAgo);
      if (recent.length >= UPLOADS_PER_HOUR_LIMIT) {
        return { ok: false, remainMs: 60 * 60 * 1000 - (now - recent[0]) };
      }
      recent.push(now);
      localStorage.setItem(key, JSON.stringify(recent));
      return { ok: true, remainMs: 0 };
    } catch {
      // 無痕模式或存取失敗時，放行但記 log
      console.warn("localStorage 不可用，略過用量限制");
      return { ok: true, remainMs: 0 };
    }
  };

  /** ====== 上傳處理 ====== */
  const handleUpload = async () => {
    if (uploading) return; // 重入保護
    if (!email) {
      setMessage("請先輸入 Email");
      return;
    }
    if (!file) {
      setMessage("請先選擇影片檔案");
      return;
    }
    if (file.size > MAX_SIZE) {
      setMessage("影片超過 50 MB，請重新選擇");
      return;
    }
    const lower = file.name.toLowerCase();
    if (!ALLOWED_EXT.some((ext) => lower.endsWith(ext))) {
      setMessage(`檔案格式不支援，允許：${ALLOWED_EXT.join(", ")}`);
      return;
    }

    const quota = checkHourlyQuota();
    if (!quota.ok) {
      const mins = Math.ceil(quota.remainMs / 60000);
      setMessage(`⛔ 上傳過於頻繁，請 ${mins} 分鐘後再試（每小時最多 ${UPLOADS_PER_HOUR_LIMIT} 次）`);
      return;
    }

    setUploading(true);
    setMessage("上傳中…");

    try {
      const filePath = `${email}/${Date.now()}_${file.name}`;
      const up = await supabase.storage.from("videos").upload(filePath, file);
      if (up.error) throw up.error;

      const insert = await supabase
        .from("jobs")
        .insert({
          user_email: email,
          frame_count: frameCount,
          storage_path: filePath,
          status: "pending",
          orig_filename: file.name,
        })
        .select()
        .single();

      if (insert.error) throw insert.error;

      // 若此時還沒訂閱，補一次（極端情況）
      if (!subscribedRef.current && email) {
        subscribeOnce(email);
      }

      setMessage("✅ 影片已上傳成功，正在分析中…");
    } catch (err: any) {
      console.error("Upload error:", err);
      const msg =
        err?.message?.includes("row level security") ||
        err?.message?.toLowerCase?.().includes("rls")
          ? "權限設定不足（RLS）。請確認 jobs 表的 anon INSERT / SELECT 以及 Realtime 已開啟。"
          : err?.message || "未知錯誤";
      setMessage(`❌ 發生錯誤：${msg}`);
    } finally {
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
          onChange={(e) => {
            setEmail(e.target.value);
            // 不立即 removeChannel，避免輸入過程造成 CLOSED 風暴
            // 交由去抖動完成後再建立新訂閱
            setMessage("");
          }}
          className="w-full border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800 text-black dark:text-white p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <input
          type="number"
          placeholder="幀數（例如 300）"
          value={frameCount}
          min={1}
          onChange={(e) => setFrameCount(Number(e.target.value) || 1)}
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

        {message && (
          <div className="text-center text-sm text-zinc-800 dark:text-zinc-300 mt-3 space-y-2">
            <p>{message}</p>
            {message.includes("分析完成") && debouncedEmailRef.current && (
              <Link
                href={`/result?email=${encodeURIComponent(debouncedEmailRef.current)}`}
                className="inline-block px-5 py-2 mt-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                🎥 查看分析結果
              </Link>
            )}
          </div>
        )}

        <div
          className={`text-xs text-center mt-2 ${
            isConnected ? "text-green-500" : "text-red-400"
          }`}
        >
          {isConnected ? "🟢 Realtime 連線中" : "🔴 Realtime 已中斷，等待/嘗試重連…"}
          {reconnectAttemptsRef.current > 0 &&
            reconnectAttemptsRef.current <= MAX_RECONNECT_ATTEMPTS &&
            `（已嘗試 ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS} 次）`}
        </div>
      </div>

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
