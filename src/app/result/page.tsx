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

// 外掛改成動態載入（僅瀏覽器），避免 Vercel SSR 期讀到 window
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
  video: { fps_used: number; frame_count: number };
  series: ChartSeries[];
  events: { IC: number[]; TO: number[]; M_stance: number[]; M_swing: number[] };
  style?: Record<string, string>;
};

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

  // 影片 FPS（優先用 jobs.video_fps）
  const fpsRef = useRef<number>(120);

  // 左右留白幀數（讓中央指針能指到第 0 與最後一幀）
  const PAD_FRAMES = 120; // 你可改 60/180…依需求

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
    return () => void (cancelled = true);
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
    if (typeof data?.video_fps === "number" && data.video_fps > 0) {
      fpsRef.current = data.video_fps;
    }

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
      // 若 jobs 沒給 fps，就用 chart.json 的
      if ((!fpsRef.current || fpsRef.current <= 0) && json?.video?.fps_used) {
        fpsRef.current = json.video.fps_used;
      }
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

  // Z-score（僅用來等化尺度；tooltip 只顯示角度）
  function zNormalize(y: Array<number | null>) {
    const vals = y.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const std =
      Math.sqrt(vals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (vals.length || 1)) || 1;
    return { mean, std, z: y.map((v) => (typeof v === "number" ? (v - mean) / std : null)) };
  }

  // 把 series 前後補空白（null）以對齊 PAD_FRAMES
  function padSeries(y: Array<number | null>, pad: number, tailPad: number) {
    const front = Array(pad).fill(null);
    const back = Array(tailPad).fill(null);
    return [...front, ...y, ...back];
  }

  // 事件線（annotation）— 注意 x 軸要 +PAD_FRAMES
  const annotations = useMemo(() => {
    if (!chartData) return {};
    const build = (arr: number[], color: string, label: string, show: boolean) =>
      Object.fromEntries(
        (arr || []).map((f, i) => [
          `${label}_${i}`,
          {
            type: "line",
            xMin: f + PAD_FRAMES,
            xMax: f + PAD_FRAMES,
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

  // ====== Chart 資料與選項（延伸時間軸）======
  const { chartJsData, chartJsOptions, extendedCount } = useMemo(() => {
    if (!chartData) return { chartJsData: null, chartJsOptions: null, extendedCount: 0 };

    const N = chartData.video.frame_count;           // 真實幀數
    const labels = Array.from({ length: N + PAD_FRAMES * 2 }, (_, i) => i); // 0..N-1 中間，左右各 PAD_FRAMES 的空白區

    const computed = chartData.series.map((s) => {
      const { z } = zNormalize(s.y);
      return {
        id: s.id,
        label: s.label,
        unit: s.unit,
        raw: s.y,
        z,
        color: chartData.style?.[s.id] || "#7dd3fc",
      };
    });

    const datasets = computed.map((c) => ({
      label: c.label,
      data: padSeries(c.z, PAD_FRAMES, PAD_FRAMES), // 以 z 畫線，但兩端補 null
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
      layout: { padding: { left: 4, right: 4, top: 4, bottom: 2 } }, // 減留白
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            // 只顯示角度（不顯示 z）
            label: (ctx: any) => {
              const dsIdx = ctx.datasetIndex;
              const idx = ctx.dataIndex;
              const series = computed[dsIdx];
              // 把延伸後的索引換回真實幀
              const realFrame = idx - PAD_FRAMES;
              const raw =
                realFrame >= 0 && realFrame < (chartData?.video?.frame_count || 0)
                  ? series.raw?.[realFrame]
                  : null;
              return `${series.label}: ${raw?.toFixed?.(2) ?? "NA"} ${series.unit}`;
            },
          },
        },
        annotation: { annotations },
        zoom: {
          zoom: {
            wheel: { enabled: true, modifierKey: "ctrl" }, // 桌機 Ctrl+滾輪
            pinch: { enabled: true },                      // 手機雙指縮放
            mode: "x",
            onZoomStart: () => setIsUserPanning(true),
            onZoomComplete: (ctx: any) => {
              setIsUserPanning(false);
              const x = ctx.chart.scales.x;
              const centerIdx = Math.round((x.min + x.max) / 2);
              const frame = centerIdx - PAD_FRAMES; // 還原回真實幀
              seekToFrame(frame);
            },
          },
          pan: {
            enabled: true,
            mode: "x",
            onPanStart: () => setIsUserPanning(true),
            onPanComplete: (ctx: any) => {
              setIsUserPanning(false);
              const x = ctx.chart.scales.x;
              const centerIdx = Math.round((x.min + x.max) / 2);
              const frame = centerIdx - PAD_FRAMES;
              seekToFrame(frame);
            },
          },
          limits: { x: { min: 0, max: labels.length - 1 } },
        },
      },
      scales: {
        x: {
          title: { display: false },
          ticks: { autoSkip: true, maxRotation: 0, font: { size: 10 } },
          grid: { drawOnChartArea: true, color: "rgba(255,255,255,0.06)" },
          min: 0,                         // 初始視窗：讓中央指針指在第 0 幀
          max: PAD_FRAMES * 2,            // 也就是 [-PAD, +PAD] 的寬度
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
      // 點擊圖：跳轉至對應幀
      onClick: (evt: any, _els: any, chart: any) => {
        const xScale = chart.scales.x;
        const rect = chart.canvas.getBoundingClientRect();
        const idx = Math.round(xScale.getValueForPixel(evt.clientX - rect.left));
        const frame = idx - PAD_FRAMES;
        seekToFrame(frame);
      },
    };

    return { chartJsData: data, chartJsOptions: options, extendedCount: labels.length };
  }, [chartData, annotations, showSeries]);

  // 固定「中央指針」
  const centerPointerPlugin = {
    id: "centerPointer",
    afterDatasetsDraw(chart: any) {
      const { ctx, chartArea } = chart;
      if (!ctx || !chartArea) return;
      const cx = (chartArea.left + chartArea.right) / 2; // 固定中央
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, chartArea.top);
      ctx.lineTo(cx, chartArea.bottom);
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fb923c"; // 橘色
      ctx.stroke();
      ctx.restore();
    },
  };

  // 影片 ↔ 圖表 雙向同步
  function seekToFrame(frame: number) {
    if (!chartData || !videoRef.current) return;
    const N = chartData.video.frame_count;
    const f = Math.max(0, Math.min(N - 1, Math.round(frame)));
    const fps = fpsRef.current || 120;
    const t = f / fps;
    videoRef.current.currentTime = t;
    setCurrentFrame(f);
    // 將視窗中心設在 f（加上 pad 偏移）
    centerViewOnIndex(f + PAD_FRAMES);
  }

  // 讓圖表視窗中心對齊某個「延伸索引」（即 frame + PAD_FRAMES）
  function centerViewOnIndex(centerIdx: number) {
    const chart = chartRef.current;
    if (!chart || !chart.scales || !chart.scales.x) return;
    const x = chart.scales.x;
    // 維持目前視窗寬度（至少 10）
    const width = Math.max(10, (x.max ?? 0) - (x.min ?? 0));
    let newMin = centerIdx - width / 2;
    let newMax = centerIdx + width / 2;
    const lo = 0;
    const hi = (chart.data?.labels?.length ?? 1) - 1;
    if (newMin < lo) { newMax += lo - newMin; newMin = lo; }
    if (newMax > hi) { newMin -= newMax - hi; newMax = hi; }
    chart.options.scales.x.min = newMin;
    chart.options.scales.x.max = newMax;
    chart.update("none");
  }

  // 每 100ms 從影片回寫目前幀；若使用者在拖動/縮放，就不自動捲動
  useEffect(() => {
    if (!chartData || !videoRef.current) return;
    const timer = setInterval(() => {
      const fps = fpsRef.current || 120;
      const t = videoRef.current!.currentTime || 0;
      const f = Math.round(t * fps);
      setCurrentFrame(f);
      if (!isUserPanning) {
        centerViewOnIndex(f + PAD_FRAMES);
      }
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

                {/* 📈 圖表（圖＝播放軸｜中央指針固定｜兩端補空白｜平移縮放｜點擊跳轉） */}
                {pluginsReady && chartData && chartJsData && chartJsOptions ? (
                  <div className="h-72 sm:h-80 w-full bg-black/10 dark:bg-white/5 rounded-lg p-2 border border-zinc-700">
                    <Line
                      ref={chartRef}
                      data={chartJsData as any}
                      options={chartJsOptions as any}
                      plugins={[annotationPlugin, zoomPlugin, { ...centerPointerPlugin }]}
                    />
                    <p className="mt-2 text-xs text-zinc-400 text-left">
                      中央橘線＝播放指針。平移/縮放後，影片會跳到指針所指幀。手機：雙指縮放、拖曳平移；桌機：Ctrl+滾輪縮放、拖曳平移；點擊圖表可跳轉。
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
