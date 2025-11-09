"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

// 外掛改動態載入避免 SSR 期觸發 window
let annotationPlugin: any = null;
let zoomPlugin: any = null;

// React Chart 元件也動態載入（只在 client）
const Line = dynamic(() => import("react-chartjs-2").then((m) => m.Line), {
  ssr: false,
});

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

type FileEntry = { bucket: string; path: string };
type ChartSeries = { id: string; label: string; unit: string; y: Array<number | null> };
type ChartJSON = {
  version: string;
  video: { fps_used: number; frame_count: number };
  series: ChartSeries[];
  events: { IC: number[]; TO: number[]; M_stance: number[]; M_swing: number[] };
  style?: Record<string, string>;
};

export default function ResultPage() {
  const [email, setEmail] = useState("");
  const [job, setJob] = useState<any>(null);
  const [chartData, setChartData] = useState<ChartJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [pluginsReady, setPluginsReady] = useState(false);

  // 曲線顯示開關
  const [showSeries, setShowSeries] = useState<Record<string, boolean>>({});

  // 影片/圖同步
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chartRef = useRef<any>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const autoScroll = useRef(true);

  // ===== 只在瀏覽器載入外掛 =====
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ default: anno }, { default: zoom }] = await Promise.all([
        import("chartjs-plugin-annotation"),
        import("chartjs-plugin-zoom"),
      ]);
      if (cancelled) return;
      annotationPlugin = anno;
      zoomPlugin = zoom;
      ChartJS.register(annotationPlugin, zoomPlugin);
      setPluginsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ===== 讀參數、載入最新 job =====
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
      fetchLatestResult(emailParam);
    }
  }, []);

  async function fetchLatestResult(email: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("id,user_email,status,result_signed_url,result_json,error_msg")
      .eq("user_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("❌ 無法取得結果:", error);
      setLoading(false);
      return;
    }

    setJob(data);

    const files: Record<string, FileEntry> | undefined = data?.result_json?.files;
    if (files) {
      const chartEntry = Object.entries(files).find(([n]) =>
        n.toLowerCase().endsWith("chart.json")
      );
      if (chartEntry) {
        const [, meta] = chartEntry as [string, FileEntry];
        await loadChartJSON(meta.bucket, meta.path);
      }
    }
    setLoading(false);
  }

  // ===== 安全載入 chart.json（修正 TS：先檢查 data 是否為 null） =====
  async function loadChartJSON(bucket: string, path: string) {
    const res = await supabase.storage.from(bucket).download(path);
    if (res.error) throw res.error;
    if (!res.data) throw new Error(`No blob returned for ${bucket}/${path}`);
    const text = await res.data.text();
    const json: ChartJSON = JSON.parse(text);
    setChartData(json);
    const vis: Record<string, boolean> = {};
    (json.series || []).forEach((s) => (vis[s.id] = true));
    setShowSeries(vis);
  }

  // ===== 唯一保留的下載：mp4 =====
  async function handleDownload(bucket: string, path: string, filename: string) {
    const res = await supabase.storage.from(bucket).download(path);
    if (res.error) {
      alert(`❌ 無法下載 ${filename}\n${res.error.message}`);
      return;
    }
    if (!res.data) {
      alert(`❌ 無法下載 ${filename}\nNo data`);
      return;
    }
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ===== Z-score =====
  function zNormalize(y: Array<number | null>) {
    const vals = y.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const std =
      Math.sqrt(vals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (vals.length || 1)) || 1;
    return { z: y.map((v) => (typeof v === "number" ? (v - mean) / std : null)) };
  }

  // ===== Chart 資料與選項 =====
  const { chartJsData, chartJsOptions } = useMemo(() => {
    if (!chartData) return { chartJsData: null, chartJsOptions: null };

    const labels = Array.from({ length: chartData.video.frame_count }, (_, i) => i);
    const datasets = chartData.series.map((s) => {
      const { z } = zNormalize(s.y);
      return {
        id: s.id,
        label: s.label,
        data: z,
        borderColor: chartData.style?.[s.id] || "#999",
        borderWidth: 1.5,
        pointRadius: 0,
        spanGaps: true,
        hidden: showSeries[s.id] === false,
      };
    });

    const options: any = {
      responsive: true,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { mode: "index", intersect: false },
        zoom: {
          zoom: { wheel: { enabled: true, modifierKey: "ctrl" }, pinch: { enabled: true }, mode: "x" },
          pan: { enabled: true, mode: "x" },
        },
      },
      // 🔧 減少留白，讓小螢幕折線區更大
      layout: { padding: { left: 8, right: 8, bottom: 4, top: 4 } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#cfcfcf", maxRotation: 0, autoSkipPadding: 8 },
          title: { display: false },
        },
        y: {
          min: -3,
          max: 3,
          ticks: { stepSize: 1, color: "#cfcfcf" },
          title: { display: false },
          grid: { color: "rgba(255,255,255,0.08)" },
        },
      },
      maintainAspectRatio: false,
      // pan/zoom 完成後：以視窗中心幀 seek 影片（圖表 = 播放軸）
      onPanComplete: (ctx: any) => {
        const x = ctx.chart.scales.x;
        const center = Math.round((x.min + x.max) / 2);
        seekToFrame(center);
      },
      onZoomComplete: (ctx: any) => {
        const x = ctx.chart.scales.x;
        const center = Math.round((x.min + x.max) / 2);
        seekToFrame(center);
      },
    };

    return { chartJsData: { labels, datasets }, chartJsOptions: options };
  }, [chartData, showSeries]);

  // ===== 中央紅指針（固定中間） =====
  const centerPointerPlugin = {
    id: "centerPointer",
    afterDraw(chart: any) {
      const { ctx, chartArea } = chart;
      const midX = (chartArea.left + chartArea.right) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(midX, chartArea.top);
      ctx.lineTo(midX, chartArea.bottom);
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#ff4d4f";
      ctx.stroke();
      ctx.restore();
    },
  };

  // ===== seek 影片到指定幀 =====
  function seekToFrame(frame: number) {
    if (!chartData || !videoRef.current) return;
    const fps = chartData.video.fps_used || 120;
    const f = Math.max(0, Math.min(chartData.video.frame_count - 1, frame));
    const t = f / fps;
    videoRef.current.currentTime = t;
    setCurrentFrame(f);
  }

  // ===== 影片播放 -> 圖表自動捲動，紅線固定中間 =====
  useEffect(() => {
    if (!chartData || !videoRef.current || !chartRef.current) return;
    const fps = chartData.video.fps_used || 120;
    const chart = chartRef.current;

    const timer = setInterval(() => {
      const t = videoRef.current!.currentTime || 0;
      const f = Math.round(t * fps);
      setCurrentFrame(f);

      // 自動讓視窗中心靠近 f
      if (autoScroll.current && chart.chart) {
        const xScale = chart.chart.scales.x;
        const currentMin = xScale.min;
        const currentMax = xScale.max;
        if (typeof currentMin !== "number" || typeof currentMax !== "number") return;

        const range = currentMax - currentMin || 1;
        const center = (currentMin + currentMax) / 2;
        const diff = f - center;

        // 偏離中心 30% 視窗寬就輕推回去
        if (Math.abs(diff) > range * 0.3) {
          const shift = diff * 0.08; // 推動比例
          xScale.options.min = (currentMin + shift) as any;
          xScale.options.max = (currentMax + shift) as any;
          chart.chart.update("none"); // 不要動畫
        }
      }
    }, 100);

    return () => clearInterval(timer);
  }, [chartData]);

  const baseBtn =
    "w-full py-3 rounded-lg font-semibold text-white transition inline-flex items-center justify-center shadow-md text-lg";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6 text-center text-zinc-200">
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-lg w-full max-w-3xl border border-zinc-700">
        <h1 className="text-3xl font-bold mb-4">🎥 分析結果</h1>

        {loading ? (
          <p>載入中...</p>
        ) : job ? (
          <>
            <p className="mb-2 text-zinc-400 text-sm">{job.user_email}</p>
            <p className="mb-4 text-sm">
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

            {job.status === "done" && job.result_json?.files ? (
              <div className="space-y-4">
                {/* 影片 */}
                {job.result_signed_url && (
                  <video
                    ref={videoRef}
                    controls
                    src={job.result_signed_url}
                    className="w-full rounded-lg border border-zinc-700"
                  />
                )}

                {/* 曲線顯示開關 */}
                {chartData && (
                  <div className="flex flex-wrap gap-4 text-sm justify-start">
                    {chartData.series.map((s) => (
                      <label key={s.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={showSeries[s.id] !== false}
                          onChange={() =>
                            setShowSeries((prev) => ({ ...prev, [s.id]: !(prev[s.id] !== false) }))
                          }
                        />
                        {s.label}
                      </label>
                    ))}
                  </div>
                )}

                {/* 圖表（固定中央指針；拖曳/縮放即 seek） */}
                {pluginsReady && chartData && chartJsData && chartJsOptions ? (
                  <div className="h-72 w-full bg-black/10 rounded-lg p-2 border border-zinc-700">
                    <Line
                      ref={chartRef}
                      data={chartJsData as any}
                      options={chartJsOptions as any}
                      plugins={[zoomPlugin, centerPointerPlugin]}
                    />
                    <p className="text-xs text-zinc-400 mt-1 text-left">
                      中央紅線＝目前影片幀。拖曳/縮放圖表會改變影片時間；播放時圖表自動向前移動。
                    </p>
                  </div>
                ) : (
                  <p className="text-zinc-400">{pluginsReady ? "尚未取得圖表資料。" : "載入圖表外掛中…"}</p>
                )}

                {/* 只保留 mp4 下載 */}
                {Object.entries(job.result_json.files)
                  .filter(([n]) => n.toLowerCase().endsWith(".mp4"))
                  .map(([fileName, info]: [string, any]) => (
                    <button
                      key={fileName}
                      onClick={() => handleDownload(info.bucket, info.path, fileName)}
                      className={`${baseBtn} bg-green-600 hover:bg-green-700`}
                    >
                      ⬇️ 下載影片 mp4
                    </button>
                  ))}
              </div>
            ) : (
              <p className="text-yellow-400">⏳ 分析中或無結果。</p>
            )}
          </>
        ) : (
          <p>找不到紀錄。</p>
        )}

        <div className="mt-6">
          <Link href="/upload" className="text-sm text-zinc-400 hover:text-blue-400">
            ← 回上傳頁面
          </Link>
        </div>
      </div>
    </main>
  );
}
