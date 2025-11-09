"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";

// ── Chart core（可 SSR 載入，不會觸發 window）
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
} from "chart.js";

// 注意：外掛改成「動態載入」（只在瀏覽器端），避免 Vercel 在建置期/SSR 讀到 window 而當掉
let annotationPlugin: any = null;
let zoomPlugin: any = null;

// React 封裝元件也改成動態載入以保險（僅 client）
const Line = dynamic(() => import("react-chartjs-2").then((m) => m.Line), {
  ssr: false,
});

// 先註冊核心（這個安全）
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip);

// ============ 型別 ============
type FileEntry = { bucket: string; path: string };
type ChartSeries = { id: string; label: string; unit: string; y: Array<number | null> };
type ChartJSON = {
  version: string;
  video: { fps_used: number; frame_count: number };
  series: ChartSeries[];
  events: { IC: number[]; TO: number[]; M_stance: number[]; M_swing: number[] };
  style?: Record<string, string>;
};

// （可選）強制這頁不要做 SSG，避免 build 期預渲染：
// export const dynamic = "force-dynamic";
// export const revalidate = 0;

export default function ResultPage() {
  const [email, setEmail] = useState("");
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [chartData, setChartData] = useState<ChartJSON | null>(null);
  const [pluginsReady, setPluginsReady] = useState(false); // 外掛載入完成

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chartRef = useRef<any>(null);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // 事件線開關
  const [showIC, setShowIC] = useState(true);
  const [showTO, setShowTO] = useState(true);
  const [showMs, setShowMs] = useState(true);
  const [showMw, setShowMw] = useState(true);

  // 曲線開關
  const [showSeries, setShowSeries] = useState<Record<string, boolean>>({});

  // ── 僅在瀏覽器端載入 Chart.js 外掛，並完成註冊
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
      // 初始化曲線可見性
      const init: Record<string, boolean> = {};
      (json.series || []).forEach((s) => (init[s.id] = true));
      setShowSeries(init);
    } catch (err) {
      console.error("❌ 載入 chart.json 失敗:", err);
    }
  }

  // 下載
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

  // Z-score
  function zNormalize(y: Array<number | null>) {
    const vals = y.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const std =
      Math.sqrt(vals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (vals.length || 1)) || 1;
    return { mean, std, z: y.map((v) => (typeof v === "number" ? (v - mean) / std : null)) };
  }

  // 事件線 annotations
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

  // Chart 資料與選項
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
        color: chartData.style?.[s.id] || "#888",
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
      plugins: {
        legend: { display: false }, // 用自訂 checkbox
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: (ctx: any) => {
              const dsIndex = ctx.datasetIndex;
              const frameIdx = ctx.dataIndex;
              const c = computed[dsIndex];
              const raw = c.raw?.[frameIdx];
              const z = c.z?.[frameIdx];
              return `${c.label}: ${raw?.toFixed?.(2) ?? "NA"} ${c.unit} | z=${z?.toFixed?.(2) ?? "NA"}`;
            },
          },
        },
        annotation: { annotations },
        // 縮放 & 平移（手機雙指、桌機 Ctrl+滾輪；拖曳平移）
        zoom: {
          zoom: {
            wheel: { enabled: true, modifierKey: "ctrl" },
            pinch: { enabled: true },
            mode: "x",
          },
          pan: { enabled: true, mode: "x" },
          limits: { x: { min: 0, max: chartData.video.frame_count - 1 } },
        },
      },
      scales: {
        x: { title: { display: true, text: "Frame" } },
        z: {
          type: "linear",
          position: "left",
          title: { display: true, text: "Z-score (σ)" },
          min: -3,
          max: 3,
        },
      },
      interaction: { mode: "nearest", intersect: false },
      maintainAspectRatio: false,
      // 點擊圖 → 跳轉對應幀
      onClick: (evt: any, _els: any, chart: any) => {
        const xScale = chart.scales.x;
        const rect = chart.canvas.getBoundingClientRect();
        const pixelX = evt.clientX - rect.left;
        const frame = Math.round(xScale.getValueForPixel(pixelX));
        seekToFrame(frame);
      },
    };

    return { chartJsData: data, chartJsOptions: options };
  }, [chartData, annotations, showSeries]);

  // 紅色同步線插件（交給 <Line plugins=[…]>）
  const syncLinePlugin = {
    id: "syncLine",
    afterDatasetsDraw(chart: any) {
      const { ctx, chartArea, scales } = chart;
      if (!ctx || !chartArea) return;
      const xScale = scales.x;
      const x = xScale.getPixelForValue(currentFrame);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ff4d4f";
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
  }

  // 每 100ms 從影片回寫（除非正在拖 range）
  useEffect(() => {
    if (!chartData || !videoRef.current) return;
    const fps = chartData.video.fps_used || 120;
    const timer = setInterval(() => {
      if (isScrubbing) return;
      const t = videoRef.current!.currentTime || 0;
      setCurrentFrame(Math.round(t * fps));
    }, 100);
    return () => clearInterval(timer);
  }, [chartData, isScrubbing]);

  // UI 共用
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
                {/* 影片 */}
                {job.result_signed_url && (
                  <video
                    ref={videoRef}
                    controls
                    src={job.result_signed_url}
                    className="w-full rounded-lg shadow-md border border-zinc-700"
                  />
                )}

                {/* 播放軸（雙向同步） */}
                {chartData && (
                  <div className="w-full text-left">
                    <input
                      type="range"
                      min={0}
                      max={chartData.video.frame_count - 1}
                      value={currentFrame}
                      onMouseDown={() => setIsScrubbing(true)}
                      onTouchStart={() => setIsScrubbing(true)}
                      onChange={(e) => seekToFrame(parseInt(e.target.value, 10))}
                      onMouseUp={() => setIsScrubbing(false)}
                      onTouchEnd={() => setIsScrubbing(false)}
                      className="w-full"
                    />
                    <div className="text-xs text-zinc-400 mt-1">
                      Frame: {currentFrame} / {chartData.video.frame_count - 1}
                    </div>
                  </div>
                )}

                {/* 曲線開關 */}
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

                {/* 事件線開關 */}
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

                {/* 圖表（縮放/平移 + 點擊跳轉 + 同步紅線） */}
                {pluginsReady && chartData && chartJsData && chartJsOptions ? (
                  <div className="h-80 w-full bg-black/10 dark:bg-white/5 rounded-lg p-3 border border-zinc-700">
                    <Line
                      ref={chartRef}
                      data={chartJsData as any}
                      options={chartJsOptions as any}
                      plugins={[annotationPlugin, zoomPlugin, { ...{ id: "syncLine", afterDatasetsDraw(chart: any) {
                        const { ctx, chartArea, scales } = chart;
                        if (!ctx || !chartArea) return;
                        const xScale = scales.x;
                        const x = xScale.getPixelForValue(currentFrame);
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(x, chartArea.top);
                        ctx.lineTo(x, chartArea.bottom);
                        ctx.setLineDash([6, 6]);
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = "#ff4d4f";
                        ctx.stroke();
                        ctx.restore();
                      } }}]}
                    />
                    <p className="mt-2 text-xs text-zinc-400 text-left">
                      手機：雙指捏合縮放、拖曳平移；桌機：Ctrl+滾輪縮放、滑鼠拖曳平移。點擊圖表可跳轉影片；紅虛線為同步位置。
                    </p>
                  </div>
                ) : (
                  <p className="text-zinc-400">
                    {pluginsReady ? "尚未取得圖表資料（chart.json）。" : "載入圖表外掛中…"}
                  </p>
                )}

                {/* 下載 */}
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

                {Object.entries(job.result_json.files)
                  .filter(([n]) => n.toLowerCase().endsWith(".xlsx"))
                  .map(([fileName, info]: [string, any]) => (
                    <button
                      key={fileName}
                      onClick={() => handleDownload(info.bucket, info.path, fileName)}
                      className={`${baseBtn} bg-amber-600 hover:bg-amber-700`}
                    >
                      📊 下載分析結果 xlsx
                    </button>
                  ))}

                {Object.entries(job.result_json.files)
                  .filter(([n]) => n.toLowerCase().endsWith(".png"))
                  .map(([fileName, info]: [string, any]) => (
                    <button
                      key={fileName}
                      onClick={() => handleDownload(info.bucket, info.path, fileName)}
                      className={`${baseBtn} bg-blue-600 hover:bg-blue-700`}
                    >
                      🖼️ 下載分析圖表 png
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
