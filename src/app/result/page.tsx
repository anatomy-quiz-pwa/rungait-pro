"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";

// Chart.js 核心（SSR 安全）
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
} from "chart.js";

// 外掛改「動態載入」避免 SSR 期觸發 window
let annotationPlugin: any = null;
let zoomPlugin: any = null;

// React-ChartJS 元件以動態載入（僅 client）
const Line = dynamic(() => import("react-chartjs-2").then((m) => m.Line), { ssr: false });

// 註冊核心
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip);

// ===== 型別 =====
type FileEntry = { bucket: string; path: string };
type ChartSeries = { id: string; label: string; unit: string; y: Array<number | null> };
type ChartJSON = {
  version: string;
  video?: { fps_used?: number; frame_count: number };
  series: ChartSeries[];
  events: { IC: number[]; TO: number[]; M_stance: number[]; M_swing: number[] };
  style?: Record<string, string>;
};

export default function ResultPage() {
  const [email, setEmail] = useState("");
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [chartData, setChartData] = useState<ChartJSON | null>(null);
  const [pluginsReady, setPluginsReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chartRef = useRef<any>(null);

  // 影片目前實際幀（紅線）
  const [currentFrame, setCurrentFrame] = useState(0);
  // 使用者「播放軸」選取幀（橘線）：可點圖、平移/縮放改變它並 seek
  const [selectionFrame, setSelectionFrame] = useState(0);

  const [isUserPanning, setIsUserPanning] = useState(false);

  // 事件線開關
  const [showIC, setShowIC] = useState(true);
  const [showTO, setShowTO] = useState(true);
  const [showMs, setShowMs] = useState(true);
  const [showMw, setShowMw] = useState(true);

  // 各曲線開關
  const [showSeries, setShowSeries] = useState<Record<string, boolean>>({});

  // ── 僅在瀏覽器端載入插件
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

  // ✅ 取用 video_fps 一起帶回來
  async function fetchLatestResult(email: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select(
        "id, user_email, status, result_signed_url, result_json, error_msg, video_fps"
      )
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

    // 初始指針在第 0 幀
    setSelectionFrame(0);
    setCurrentFrame(0);

    setLoading(false);
  }

  async function loadChartJSON(bucket: string, path: string) {
    try {
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error) throw error;
      const json: ChartJSON = JSON.parse(await data.text());
      setChartData(json);
      // 初始化曲線顯示（全開）
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

  // ✔ FPS：優先 chart.json，其次 jobs.video_fps，再來 120
  const fpsUsed = useMemo(() => {
    return (
      chartData?.video?.fps_used ||
      job?.video_fps ||
      120
    );
  }, [chartData, job]);

  // Z-score（僅用來同軸顯示；tooltip 僅顯示角度）
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

    const frames = chartData.video?.frame_count ?? Math.max(...chartData.series.map(s => s.y.length));
    const labels = Array.from({ length: frames }, (_, i) => i);
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
        color: chartData.style?.[s.id] || "#7dd3fc",
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
      layout: { padding: { left: 4, right: 4, top: 4, bottom: 2 } }, // 減少留白
      plugins: {
        legend: { display: false }, // 自訂 checkbox
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            // 只回報角度（不顯示 z）
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
              // 縮放完成 → 用「視窗中心幀」當成播放軸（橘線）並 seek
              const x = ctx.chart.scales.x;
              const center = Math.round((x.min + x.max) / 2);
              setSelectionFrame(center);
              seekToFrame(center);
            },
          },
          pan: {
            enabled: true,
            mode: "x",
            onPanStart: () => setIsUserPanning(true),
            onPanComplete: (ctx: any) => {
              setIsUserPanning(false);
              // 平移完成 → 同上：以視窗中心幀當播放軸並 seek
              const x = ctx.chart.scales.x;
              const center = Math.round((x.min + x.max) / 2);
              setSelectionFrame(center);
              seekToFrame(center);
            },
          },
          limits: {
            x: { min: 0, max: frames - 1 },
          },
        },
      },
      scales: {
        x: {
          title: { display: false },
          ticks: { autoSkip: true, maxRotation: 0, font: { size: 10 } }, // 小字
          grid: { drawOnChartArea: true, color: "rgba(255,255,255,0.06)" },
        },
        z: {
          type: "linear",
          position: "left",
          min: -3,
          max: 3,
          ticks: { display: false },
          grid: { drawOnChartArea: false },
          title: { display: false },
        },
      },
      interaction: { mode: "nearest", intersect: false },
      maintainAspectRatio: false,
      // 點擊圖：把播放軸（橘線）設為該點並 seek
      onClick: (evt: any, _els: any, chart: any) => {
        const xScale = chart.scales.x;
        const rect = chart.canvas.getBoundingClientRect();
        const frame = Math.round(xScale.getValueForPixel(evt.clientX - rect.left));
        setSelectionFrame(frame);
        seekToFrame(frame);
      },
    };

    return { chartJsData: data, chartJsOptions: options };
  }, [chartData, annotations, showSeries]);

  // 🔴 紅色同步線（影片目前幀）
  const syncLinePlugin = {
    id: "syncLine",
    afterDatasetsDraw(chart: any) {
      const { ctx, chartArea, scales } = chart;
      if (!ctx || !chartArea) return;
      const xScale = scales.x;
      const x = xScale.getPixelForValue(currentFrame);
      if (!Number.isFinite(x)) return;
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

  // 🟠 橘色播放軸指針（可達兩端）：畫在 selectionFrame 的實際位置
  const pointerPlugin = {
    id: "pointerPlugin",
    afterDatasetsDraw(chart: any) {
      const { ctx, chartArea, scales } = chart;
      if (!ctx || !chartArea) return;
      const xScale = scales.x;
      // 指針位置用「選取幀」→ 能落在最左/右端
      const px = xScale.getPixelForValue(selectionFrame);
      const x = Math.max(chartArea.left, Math.min(chartArea.right, px));
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fb923c"; // 橘線
      ctx.stroke();
      ctx.restore();
    },
  };

  // 影片 ↔ 圖表 雙向同步
  function seekToFrame(frame: number) {
    if (!chartData || !videoRef.current) return;
    const last = (chartData.video?.frame_count ?? 1) - 1;
    const f = Math.max(0, Math.min(last, frame));
    const t = f / (fpsUsed || 120);
    videoRef.current.currentTime = t;
    setCurrentFrame(f);
    // 自動保持「選取幀」在可視範圍（能置中就置中；邊界就貼邊）
    followFrameInView(f);
  }

  // 自動卷動：讓 f 落在視窗中；能置中就置中，否則貼邊界
  function followFrameInView(f: number) {
    const chart = chartRef.current;
    if (!chart || !chart.scales || !chart.scales.x || !chartData) return;
    const x = chart.scales.x;
    const last = (chartData.video?.frame_count ?? 1) - 1;
    const width = Math.max(10, x.max - x.min); // 視窗寬度
    let newMin = Math.round(f - width / 2);
    let newMax = Math.round(f + width / 2);
    if (newMin < 0) { newMax += -newMin; newMin = 0; }
    if (newMax > last) { newMin -= (newMax - last); newMax = last; }
    if (newMin === x.min && newMax === x.max) return; // 無變化
    chart.options.scales.x.min = newMin;
    chart.options.scales.x.max = newMax;
    chart.update("none");
  }

  // 每 100ms 從影片回寫目前幀；若使用者沒在拖，就以目前幀當「播放軸」並跟隨
  useEffect(() => {
    if (!chartData || !videoRef.current) return;
    const timer = setInterval(() => {
      const t = videoRef.current!.currentTime || 0;
      const f = Math.round(t * (fpsUsed || 120));
      setCurrentFrame(f);
      if (!isUserPanning) {
        setSelectionFrame(f);     // 播放時橘線跟著跑
        followFrameInView(f);     // 自動卷動
      }
    }, 100);
    return () => clearInterval(timer);
  }, [chartData, fpsUsed, isUserPanning]);

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
                    onLoadedMetadata={() => {
                      // 初始進來把視窗對到 0 幀
                      setCurrentFrame(0);
                      setSelectionFrame(0);
                      followFrameInView(0);
                    }}
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

                {/* 📈 圖表（橘線＝可操作指針；紅線＝影片同步；支援縮放/平移/點擊） */}
                {pluginsReady && chartData && chartJsData && chartJsOptions ? (
                  <div className="h-72 sm:h-80 w-full bg-black/10 dark:bg-white/5 rounded-lg p-2 border border-zinc-700">
                    <Line
                      ref={chartRef}
                      data={chartJsData as any}
                      options={chartJsOptions as any}
                      plugins={[annotationPlugin, zoomPlugin, syncLinePlugin, pointerPlugin]}
                    />
                    <p className="mt-2 text-xs text-zinc-400 text-left">
                      橘線＝播放軸，可點擊圖表或平移/縮放後自動定位並跳片段；紅線＝影片目前幀。
                      手機：雙指縮放、拖曳平移；桌機：Ctrl+滾輪縮放、拖曳平移。
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
