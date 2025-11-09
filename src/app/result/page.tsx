"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";

// Chart.js 核心（可 SSR 載入）
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
} from "chart.js";

// 外掛改成「動態載入」（只在瀏覽器端），避免 Vercel SSR 期卡住
let annotationPlugin: any = null;
let zoomPlugin: any = null;

// React-ChartJS 元件以動態載入（僅 client）
const Line = dynamic(() => import("react-chartjs-2").then((m) => m.Line), { ssr: false });

// 先註冊核心
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip);

// ===== 型別 =====
type FileEntry = { bucket: string; path: string };
type ChartSeries = { id: string; label: string; unit: string; y: Array<number | null> };
type ChartJSON = {
  version: string;
  video: { fps_used: number; frame_count: number };
  series: ChartSeries[];
  events: { IC: number[]; TO: number[]; M_stance: number[]; M_swing: number[] };
  style?: Record<string, string>;
};

// （可選保險）避免 SSG：
// export const dynamic = "force-dynamic";
// export const revalidate = 0;

export default function ResultPage() {
  const [email, setEmail] = useState("");
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [chartData, setChartData] = useState<ChartJSON | null>(null);
  const [pluginsReady, setPluginsReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chartRef = useRef<any>(null);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [isUserPanning, setIsUserPanning] = useState(false);

  // 事件線開關
  const [showIC, setShowIC] = useState(true);
  const [showTO, setShowTO] = useState(true);
  const [showMs, setShowMs] = useState(true);
  const [showMw, setShowMw] = useState(true);

  // 各曲線開關
  const [showSeries, setShowSeries] = useState<Record<string, boolean>>({});

  // 僅在瀏覽器端載入插件
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

  // 讀網址參數並載入最新 job
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
      .select("id, user_email, status, result_signed_url, result_json, error_msg")
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
        n.toLowerCase().endsWith("_chart.json") || n.toLowerCase().endsWith(".json")
      );
      if (chartEntry) {
        const [, meta] = chartEntry as [string, FileEntry];
        await loadChartJSON(meta.bucket, meta.path);
      }
    }

    setLoading(false);
  }

  async function loadChartJSON(bucket: string, path: string) {
    try {
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error) throw error;
      const json: ChartJSON = JSON.parse(await data.text());
      setChartData(json);
      // 初始化各曲線顯示（預設全開）
      const init: Record<string, boolean> = {};
      (json.series || []).forEach((s) => (init[s.id] = true));
      setShowSeries(init);
    } catch (err) {
      console.error("❌ 載入 chart.json 失敗:", err);
    }
  }

  // 下載（僅保留 mp4）
  async function handleDownload(bucket: string, path: string, filename: string) {
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
  }

  // Z-score（僅用來等化尺度；tooltip 只回報角度）
  function zNormalize(y: Array<number | null>) {
    const vals = y.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const std =
      Math.sqrt(vals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (vals.length || 1)) || 1;
    return { mean, std, z: y.map((v) => (typeof v === "number" ? (v - mean) / std : null)) };
  }

  // 事件線（annotation）
  const annotations = useMemo(() => {
    if (!chartData) return {};
    const build = (arr: number[], color: string, label: string, show: boolean) =>
      Object.fromEntries(
        (arr || []).map((f, i) => [
          `${label}_${i}`,
          {
            type: "line",
            xMin: f,
            xMax: f,
            borderColor: color,
            borderWidth: 1.5,
            borderDash: [4, 4],
            display: show,
            label: {
              display: show,
              content: label,
              position: "start",
              backgroundColor: color + "88",
              color: "#fff",
              padding: 2,
              yAdjust: -8,
            },
          },
        ])
      );
    return {
      ...build(chartData.events?.IC || [], "#ff0000", "IC", showIC),
      ...build(chartData.events?.TO || [], "#00b050", "TO", showTO),
      ...build(chartData.events?.M_stance || [], "#aaaaaa", "Ms", showMs),
      ...build(chartData.events?.M_swing || [], "#8888ff", "Mw", showMw),
    };
  }, [chartData, showIC, showTO, showMs, showMw]);

  // 準備圖表資料 & 選項
  const { chartJsData, chartJsOptions } = useMemo(() => {
    if (!chartData) return { chartJsData: null, chartJsOptions: null };

    const labels = Array.from({ length: chartData.video.frame_count }, (_, i) => i);
    const computed = chartData.series.map((s) => {
      const { mean, std, z } = zNormalize(s.y);
      return {
        id: s.id,
        label: s.label,
        unit: s.unit,
        mean,
        std,
        z,
        raw: s.y,
        color: chartData.style?.[s.id] || "#7dd3fc", // 預設天藍
      };
    });

    const datasets = computed.map((c) => ({
      label: c.label,
      data: c.z,
      borderColor: c.color,
      borderWidth: 1.8,
      pointRadius: 0,
      spanGaps: true,
      yAxisID: "z",
      tension: 0.25,
      hidden: showSeries[c.id] === false,
    }));

    const data = { labels, datasets };

    const options: any = {
      responsive: true,
      animation: false,
      layout: { padding: { left: 4, right: 4, top: 4, bottom: 2 } }, // ⬅ 減少留白
      plugins: {
        legend: { display: false }, // 用自訂 checkbox
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            // 只回報角度（不顯示 z-score）
            label: (ctx: any) => {
              const ds = computed[ctx.datasetIndex];
              const raw = ds.raw?.[ctx.dataIndex];
              return `${ds.label}: ${raw?.toFixed?.(2) ?? "NA"} ${ds.unit}`;
            },
          },
        },
        annotation: { annotations },
        zoom: {
          zoom: {
            wheel: { enabled: true, modifierKey: "ctrl" }, // 桌機 Ctrl+滾輪縮放
            pinch: { enabled: true },                       // 手機雙指縮放
            mode: "x",
            onZoomStart: () => setIsUserPanning(true),
            onZoomComplete: (ctx: any) => {
              setIsUserPanning(false);
              const x = ctx.chart.scales.x;
              const center = Math.round((x.min + x.max) / 2);
              seekToFrame(center);
            },
          },
          pan: {
            enabled: true,
            mode: "x",
            onPanStart: () => setIsUserPanning(true),
            onPanComplete: (ctx: any) => {
              setIsUserPanning(false);
              const x = ctx.chart.scales.x;
              const center = Math.round((x.min + x.max) / 2);
              seekToFrame(center);
            },
          },
          limits: { x: { min: 0, max: chartData.video.frame_count - 1 } },
        },
      },
      scales: {
        x: {
          title: { display: false },
          ticks: { autoSkip: true, maxRotation: 0, font: { size: 10 } }, // ⬅ 字變小
          grid: { drawOnChartArea: true, color: "rgba(255,255,255,0.06)" },
        },
        z: {
          type: "linear",
          position: "left",
          min: -3,
          max: 3,
          ticks: { display: false },          // ⬅ 隱藏 y 軸刻度
          grid: { drawOnChartArea: false },   // ⬅ 減少干擾
          title: { display: false },          // ⬅ 隱藏 y 標題
        },
      },
      interaction: { mode: "nearest", intersect: false },
      maintainAspectRatio: false,
      // 點擊圖：也跳轉到對應幀
      onClick: (evt: any, _els: any, chart: any) => {
        const xScale = chart.scales.x;
        const rect = chart.canvas.getBoundingClientRect();
        const frame = Math.round(xScale.getValueForPixel(evt.clientX - rect.left));
        seekToFrame(frame);
      },
    };

    return { chartJsData: data, chartJsOptions: options };
  }, [chartData, annotations, showSeries]);

  // 固定「中心指針」＋ 紅線（以目前幀為中心自動捲動）
  const centerPointerPlugin = {
    id: "centerPointer",
    afterDatasetsDraw(chart: any) {
      const { ctx, chartArea } = chart;
      if (!ctx || !chartArea) return;
      const cx = (chartArea.left + chartArea.right) / 2; // 固定中央指針
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, chartArea.top);
      ctx.lineTo(cx, chartArea.bottom);
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fb923c"; // 橘線：固定播放軸
      ctx.stroke();
      ctx.restore();
    },
  };

  // 影片 ↔ 圖表 雙向同步
  function seekToFrame(frame: number) {
    if (!chartData || !videoRef.current) return;
    const f = Math.max(0, Math.min(chartData.video.frame_count - 1, frame));
    const t = f / (chartData.video.fps_used || 120);
    videoRef.current.currentTime = t;
    setCurrentFrame(f);
    // 也把圖表視窗中心設在這個幀
    centerViewOnFrame(f);
  }

  // 讓圖表的視窗中心對齊某幀（維持目前視窗寬度）
  function centerViewOnFrame(frame: number) {
    const chart = chartRef.current;
    if (!chart || !chart.scales || !chart.scales.x || !chartData) return;
    const x = chart.scales.x;
    const width = Math.max(10, x.max - x.min); // 視窗寬度（至少 10 幀避免太窄）
    let newMin = frame - width / 2;
    let newMax = frame + width / 2;
    const lo = 0;
    const hi = chartData.video.frame_count - 1;
    if (newMin < lo) { newMax += lo - newMin; newMin = lo; }
    if (newMax > hi) { newMin -= newMax - hi; newMax = hi; }
    chart.options.scales.x.min = newMin;
    chart.options.scales.x.max = newMax;
    chart.update("none");
  }

  // 每 100ms 從影片回寫目前幀；若使用者在拖動/縮放，就不自動捲動
  useEffect(() => {
    if (!chartData || !videoRef.current) return;
    const fps = chartData.video.fps_used || 120;
    const timer = setInterval(() => {
      const t = videoRef.current!.currentTime || 0;
      const f = Math.round(t * fps);
      setCurrentFrame(f);
      if (!isUserPanning) centerViewOnFrame(f);
    }, 100);
    return () => clearInterval(timer);
  }, [chartData, isUserPanning]);

  const baseBtn =
    "w-full py-3 rounded-lg font-semibold text-white transition inline-flex items-center justify-center shadow-md text-lg";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6 text-center text-zinc-800 dark:text-zinc-200">
      <div className="bg-white/10 dark:bg-zinc-900 p-8 rounded-2xl shadow-lg w-full max-w-3xl border border-zinc-700">
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

            {job.status === "done" && job.result_json?.files ? (
              <div className="space-y-6">
                {/* 🎞️ 影片 */}
                {job.result_signed_url && (
                  <video
                    ref={videoRef}
                    controls
                    src={job.result_signed_url}
                    className="w-full rounded-lg shadow-md border border-zinc-700"
                  />
                )}

                {/* ✅ 曲線顯示開關 */}
                {chartData && (
                  <div className="flex flex-wrap gap-4 text-sm text-left">
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

                {/* ✅ 事件線開關 */}
                {chartData && (
                  <div className="flex flex-wrap gap-4 text-sm text-left">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={showIC} onChange={() => setShowIC(!showIC)} /> IC
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={showTO} onChange={() => setShowTO(!showTO)} /> TO
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={showMs} onChange={() => setShowMs(!showMs)} /> M-stance
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={showMw} onChange={() => setShowMw(!showMw)} /> M-swing
                    </label>
                  </div>
                )}

                {/* 📈 圖表（圖＝播放軸｜中央指針｜平移縮放｜點擊跳轉） */}
                {pluginsReady && chartData && chartJsData && chartJsOptions ? (
                  <div className="h-72 sm:h-80 w-full bg-black/10 dark:bg-white/5 rounded-lg p-2 border border-zinc-700">
                    <Line
                      ref={chartRef}
                      data={chartJsData as any}
                      options={chartJsOptions as any}
                      plugins={[annotationPlugin, zoomPlugin, centerPointerPlugin]}
                    />
                    <p className="mt-2 text-xs text-zinc-400 text-left">
                      中央橘線＝播放指針；平移/縮放後會跳到指針幀。手機：雙指縮放、拖曳平移；桌機：Ctrl+滾輪縮放、拖曳平移；點擊圖表可跳轉。
                    </p>
                  </div>
                ) : (
                  <p className="text-zinc-400">
                    {pluginsReady ? "尚未取得圖表資料（chart.json）。" : "載入圖表外掛中…"}
                  </p>
                )}

                {/* ⬇️ 只保留 mp4 下載 */}
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
            ) : job.status === "failed" ? (
              <p className="text-red-400">❌ 分析失敗，請重新上傳影片。</p>
            ) : (
              <p className="text-yellow-400">⏳ 分析中，請稍後再試。</p>
            )}
          </>
        ) : (
          <p>找不到分析記錄。</p>
        )}

        <div className="mt-8">
          <Link href="/upload" className="text-sm text-zinc-400 hover:text-blue-400 transition">
            ← 回上傳頁面
          </Link>
        </div>
      </div>
    </main>
  );
}
