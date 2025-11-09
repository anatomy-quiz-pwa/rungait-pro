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
  Legend,
  Tooltip,
} from "chart.js";

let annotationPlugin: any = null;
let zoomPlugin: any = null;
const Line = dynamic(() => import("react-chartjs-2").then((m) => m.Line), { ssr: false });
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip);

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
  const [loading, setLoading] = useState(true);

  const [chartData, setChartData] = useState<ChartJSON | null>(null);
  const [pluginsReady, setPluginsReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chartRef = useRef<any>(null);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [isUserPanning, setIsUserPanning] = useState(false);

  const [showIC, setShowIC] = useState(true);
  const [showTO, setShowTO] = useState(true);
  const [showMs, setShowMs] = useState(true);
  const [showMw, setShowMw] = useState(true);
  const [showSeries, setShowSeries] = useState<Record<string, boolean>>({});

  // 這裡不再用 fps 直接換算，而是用影片 duration / frame_count
  const secPerFrameRef = useRef<number | null>(null);

  // 讓中央指針能指到最左/最右幀
  const PAD_FRAMES = 120;

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
      .select("id, user_email, status, result_signed_url, result_json, error_msg, video_fps")
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

      const init: Record<string, boolean> = {};
      (json.series || []).forEach((s) => (init[s.id] = true));
      setShowSeries(init);
    } catch (err) {
      console.error("❌ 載入 chart.json 失敗:", err);
    }
  }

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

  function zNormalize(y: Array<number | null>) {
    const vals = y.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const std =
      Math.sqrt(vals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (vals.length || 1)) || 1;
    return { mean, std, z: y.map((v) => (typeof v === "number" ? (v - mean) / std : null)) };
  }

  function padSeries(y: Array<number | null>, pad: number, tailPad: number) {
    const front = Array(pad).fill(null);
    const back = Array(tailPad).fill(null);
    return [...front, ...y, ...back];
  }

  // 載到影片 metadata 後，建立 time↔frame 的換算（與 FPS 無關）
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !chartData) return;

    const onMeta = () => {
      const frames = chartData.video.frame_count || 1;
      const dur = video.duration || 0;
      // 容錯：若 duration 取不到，維持 null（會 fallback 到舊 fps 模式，但大多數瀏覽器都會有 duration）
      secPerFrameRef.current = dur > 0 ? dur / frames : null;

      // 初始：把視窗中心對在 frame 0（即 index = PAD）
      centerViewOnIndex(PAD_FRAMES);
      setCurrentFrame(0);
    };

    video.addEventListener("loadedmetadata", onMeta);
    // 若已加載過 metadata（例如硬重新整理後快取），直接觸發一次
    if (video.readyState >= 1) onMeta();

    return () => video.removeEventListener("loadedmetadata", onMeta);
  }, [chartData]);

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

  const { chartJsData, chartJsOptions } = useMemo(() => {
    if (!chartData) return { chartJsData: null, chartJsOptions: null };

    const N = chartData.video.frame_count;
    const labels = Array.from({ length: N + PAD_FRAMES * 2 }, (_, i) => i);

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
      data: padSeries(c.z, PAD_FRAMES, PAD_FRAMES),
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
      layout: { padding: { left: 4, right: 4, top: 4, bottom: 2 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            // 只顯示角度
            label: (ctx: any) => {
              const dsIdx = ctx.datasetIndex;
              const idx = ctx.dataIndex;
              const realFrame = idx - PAD_FRAMES;
              const s = computed[dsIdx];
              const raw =
                realFrame >= 0 && realFrame < (chartData?.video?.frame_count || 0)
                  ? s.raw?.[realFrame]
                  : null;
              return `${s.label}: ${raw?.toFixed?.(2) ?? "NA"} ${s.unit}`;
            },
          },
        },
        annotation: { annotations },
        zoom: {
          zoom: {
            wheel: { enabled: true, modifierKey: "ctrl" },
            pinch: { enabled: true },
            mode: "x",
            onZoomStart: () => setIsUserPanning(true),
            onZoomComplete: (ctx: any) => {
              setIsUserPanning(false);
              const x = ctx.chart.scales.x;
              const centerIdx = Math.round((x.min + x.max) / 2);
              const frame = centerIdx - PAD_FRAMES;
              seekToFrame(frame);
            },
          },
          pan: {
            enabled: true,
            mode: "x",
            speed: 1,         // ← 拖動靈敏度提升，1px 也能動
            threshold: 0,     // ← 沒有最小啟動距離
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
          ticks: {
            autoSkip: true,
            maxRotation: 0,
            font: { size: 10 },
            // 把 PAD_FRAMES 抵銷，顯示真實幀號；超界顯示空白
            callback: (value: any) => {
              const v = Number(value);
              const real = v - PAD_FRAMES;
              if (!Number.isFinite(real)) return "";
              if (real < 0 || real >= N) return ""; // 隱藏補空白區的刻度
              return real;
            },
          },
          grid: { drawOnChartArea: true, color: "rgba(255,255,255,0.06)" },
          min: 0,
          max: PAD_FRAMES * 2, // 初始視窗 [-PAD, +PAD]
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
      onClick: (evt: any, _els: any, chart: any) => {
        const xScale = chart.scales.x;
        const rect = chart.canvas.getBoundingClientRect();
        const idx = Math.round(xScale.getValueForPixel(evt.clientX - rect.left));
        const frame = idx - PAD_FRAMES;
        seekToFrame(frame);
      },
    };

    return { chartJsData: data, chartJsOptions: options };
  }, [chartData, annotations, showSeries]);

  const centerPointerPlugin = {
    id: "centerPointer",
    afterDatasetsDraw(chart: any) {
      const { ctx, chartArea } = chart;
      if (!ctx || !chartArea) return;
      const cx = (chartArea.left + chartArea.right) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, chartArea.top);
      ctx.lineTo(cx, chartArea.bottom);
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fb923c";
      ctx.stroke();
      ctx.restore();
    },
  };

  function seekToFrame(frame: number) {
    if (!chartData || !videoRef.current) return;
    const N = chartData.video.frame_count;
    const f = Math.max(0, Math.min(N - 1, Math.round(frame)));

    const secPerFrame = secPerFrameRef.current;
    if (secPerFrame && secPerFrame > 0) {
      videoRef.current.currentTime = f * secPerFrame;
    } else {
      // Fallback：極少數取不到 duration 的情況才會用（不建議，但保底）
      const fps = chartData.video.fps_used || 120;
      videoRef.current.currentTime = f / fps;
    }

    setCurrentFrame(f);
    centerViewOnIndex(f + PAD_FRAMES);
  }
  function stepFrame(delta: number) {
    if (!chartData) return;
    const N = chartData.video.frame_count;
    const next = Math.min(Math.max(currentFrame + delta, 0), N - 1);
    seekToFrame(next);
  }

  function centerViewOnIndex(centerIdx: number) {
    const chart = chartRef.current;
    if (!chart || !chart.scales || !chart.scales.x) return;
    const x = chart.scales.x;
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

  // 由影片 → 圖表：每 100ms 回寫目前幀；若使用者在拖動/縮放，就不自動捲動
  useEffect(() => {
    if (!chartData || !videoRef.current) return;
    const timer = setInterval(() => {
      const video = videoRef.current!;
      if (!video) return;
      const secPerFrame = secPerFrameRef.current;

      if (secPerFrame && secPerFrame > 0) {
        const f = Math.round(video.currentTime / secPerFrame);
        setCurrentFrame(f);
        if (!isUserPanning) centerViewOnIndex(f + PAD_FRAMES);
      } else {
        // Fallback：少數情況取不到 duration
        const fps = chartData.video.fps_used || 120;
        const f = Math.round((video.currentTime || 0) * fps);
        setCurrentFrame(f);
        if (!isUserPanning) centerViewOnIndex(f + PAD_FRAMES);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [chartData, isUserPanning]);

  // 鍵盤控制左右鍵（全域監聽）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") stepFrame(-1);
      else if (e.key === "ArrowRight") stepFrame(+1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentFrame, chartData]);


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
                {job.result_signed_url && (
                  <video
                    ref={videoRef}
                    controls
                    src={job.result_signed_url}
                    className="w-full rounded-lg shadow-md border border-zinc-700"
                  />
                )}

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

                {pluginsReady && chartData && chartJsData && chartJsOptions ? (
                  <div className="h-72 sm:h-80 w-full bg-black/10 dark:bg-white/5 rounded-lg p-2 border border-zinc-700">
                    <Line
                      ref={chartRef}
                      data={chartJsData as any}
                      options={chartJsOptions as any}
                      plugins={[annotationPlugin, zoomPlugin, {
                        id: "centerPointer",
                        afterDatasetsDraw(chart: any) {
                          const { ctx, chartArea } = chart;
                          if (!ctx || !chartArea) return;
                          const cx = (chartArea.left + chartArea.right) / 2;
                          ctx.save();
                          ctx.beginPath();
                          ctx.moveTo(cx, chartArea.top);
                          ctx.lineTo(cx, chartArea.bottom);
                          ctx.setLineDash([4, 4]);
                          ctx.lineWidth = 2;
                          ctx.strokeStyle = "#fb923c";
                          ctx.stroke();
                          ctx.restore();
                        },
                      }]}
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

                {/* 新增：左右箭頭按鈕 */}
                <div className="flex items-center justify-center gap-4 mt-3">
                  <button
                    onClick={() => stepFrame(-1)}
                    className="px-3 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600"
                  >
                    ← 上一幀
                  </button>
                  <span className="text-sm text-zinc-400">目前幀：{currentFrame}</span>
                  <button
                    onClick={() => stepFrame(+1)}
                    className="px-3 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600"
                  >
                    下一幀 →
                  </button>
                </div>

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
