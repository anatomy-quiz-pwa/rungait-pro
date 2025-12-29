"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip);

// 動態載入外掛
let annotationPlugin: any = null;
let zoomPlugin: any = null;
const Line = dynamic(() => import("react-chartjs-2").then((m) => m.Line), { ssr: false });

// === Types ===
type JobRow = {
  id: string;
  user_email: string;
  status: string;
  subject_name?: string | null;
  user_tag?: string | null;

  result_video_r2: string | null;
  result_xlsx_r2: string | null;
  result_png_r2: string | null;
  result_json_r2: string | null;
  error_msg: string | null;
};

type ChartSeries = {
  id: string;
  label: string;
  unit: string;
  y: Array<number | null>;
};

type ChartJSON = {
  version: string;
  video: {
    width: number;
    height: number;
    fps_input: number;
    fps_used: number;
    frame_count: number;
    duration_sec: number;
  };
  series: ChartSeries[];
  events: {
    IC: number[];
    TO: number[];
    M_stance: number[];
    M_swing: number[];
  };
  style?: {
    [k: string]: any;
    events?: Record<string, string>;
  };
};

export default function JobResultView({
  jobId,
  backHref,
  backText,
}: {
  jobId: string;
  backHref?: string;
  backText?: string;
}) {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_RESULTS || "";
  const router = useRouter();

  const [job, setJob] = useState<JobRow | null>(null);
  const [chartJson, setChartJson] = useState<ChartJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  // 不用 fps 直接換算，而是用 duration / frame_count
  const secPerFrameRef = useRef<number | null>(null);

  // 讓中央指針能指到最左/最右幀
  const PAD_FRAMES = 120;

  // ✅ 登入檢查 gate
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ✅ 記錄登入者（可用來 debug / 顯示，不一定要用）
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);

  // ===== 動態載入 annotation / zoom 外掛 =====
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ default: anno }, { default: zoom }] = await Promise.all([
          import("chartjs-plugin-annotation"),
          import("chartjs-plugin-zoom"),
        ]);
        if (cancelled) return;
        annotationPlugin = anno;
        zoomPlugin = zoom;
        ChartJS.register(anno, zoom);
        setPluginsReady(true);
      } catch (e) {
        console.error("載入 Chart.js 外掛失敗：", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ===== 幫 R2 路徑組完整 URL =====
  function buildR2Url(path: string) {
    const cleanBase = base.replace(/\/+$/, "");
    let cleanPath = path.replace(/^\/+/, "");

    // 如果 worker 存的是 runpose-results/xxx，要把前綴拿掉，因為 base 已經指到 bucket 外層
    if (cleanPath.startsWith("runpose-results/")) {
      cleanPath = cleanPath.slice("runpose-results/".length);
    }

    const encodedPath = encodeURI(cleanPath).replace(/@/g, "%40");
    return `${cleanBase}/${encodedPath}`;
  }

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    (async () => {
      // ✅ 先檢查登入
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.replace("/login");
        return;
      }
      if (cancelled) return;

      setViewerEmail(data.user.email ?? null);
      setCheckingAuth(false);

      if (!jobId) {
        setErrorMsg("缺少 jobId。");
        setLoading(false);
        return;
      }

      // ✅ 先載入一次
      await loadJob(jobId);
      if (cancelled) return;

      // ✅ Realtime（可有可無）
      unsub = subscribeJob(jobId);

      // ✅ Polling fallback（保證會更新畫面）
      poll = setInterval(() => {
        loadJob(jobId);
      }, 2000);
    })();

    return () => {
      cancelled = true;
      if (unsub) unsub();
      if (poll) clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  async function loadJob(jobId: string) {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .maybeSingle();

      if (error) {
        console.error("❌ Supabase 讀取 job 失敗：", error);
        setErrorMsg("讀取任務資料失敗。");
        return;
      }

      if (!data) {
        setErrorMsg("找不到這個任務，或你沒有權限查看。");
        return;
      }

      setJob(data as any);

      if ((data as any).result_json_r2) {
        const pathParam = encodeURIComponent((data as any).result_json_r2);
        const apiUrl = `/api/chart-json?path=${pathParam}`;

        const res = await fetch(apiUrl);
        if (!res.ok) {
          console.error("❌ chart-json API 回傳錯誤：", res.status);
          setErrorMsg(`載入圖表資料失敗（HTTP ${res.status}）。`);
        } else {
          const json = (await res.json()) as ChartJSON;
          setChartJson(json);

          // 初始化每條曲線預設都顯示
          const init: Record<string, boolean> = {};
          (json.series || []).forEach((s) => (init[s.id] = true));
          setShowSeries(init);
        }
      } else {
        // 沒有 chart.json 不算錯，只是顯示提示
      }
    } catch (e: any) {
      console.error("❌ loadJob 發生錯誤：", e);
      setErrorMsg(`載入資料時發生錯誤：${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  function subscribeJob(jobId: string) {
    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", table: "jobs", schema: "public", filter: `id=eq.${jobId}` },
        (payload) => {
          if ((payload.new as any).status === "done") {
            window.location.reload();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // ===== 影片 loadedmetadata → 計算 secPerFrame（用 duration / frame_count） =====
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !chartJson) return;

    const onMeta = () => {
      const frames = chartJson.video.frame_count || 1;
      const dur = video.duration || 0;
      secPerFrameRef.current = dur > 0 ? dur / frames : null;

      // 初始：把視窗中心對在 frame 0（index = PAD_FRAMES）
      centerViewOnIndex(PAD_FRAMES);
      setCurrentFrame(0);
    };

    video.addEventListener("loadedmetadata", onMeta);
    if (video.readyState >= 1) onMeta();

    return () => video.removeEventListener("loadedmetadata", onMeta);
  }, [chartJson]);

  // ===== 小工具：z-normalize & padding =====
  function zNormalize(y: Array<number | null>) {
    const vals = y.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const std =
      Math.sqrt(vals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (vals.length || 1)) || 1;
    return { mean, std, z: y.map((v) => (typeof v === "number" ? (v - mean) / std : null)) };
  }

  function padSeries(y: Array<number | null>, padHead: number, padTail: number) {
    const front = Array(padHead).fill(null);
    const back = Array(padTail).fill(null);
    return [...front, ...y, ...back];
  }

  // ===== 建立事件線 annotation 設定 =====
  const annotations = useMemo(() => {
    if (!chartJson) return {};

    const events = chartJson.events || {};
    const colors = chartJson.style?.events || {};

    const colIC = colors.IC || "#ff0000";
    const colTO = colors.TO || "#00b050";
    const colMS = colors.M_stance || "#aaaaaa";
    const colMW = colors.M_swing || "#8888ff";

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
      ...build(events.IC || [], colIC, "IC", showIC),
      ...build(events.TO || [], colTO, "TO", showTO),
      ...build(events.M_stance || [], colMS, "Ms", showMs),
      ...build(events.M_swing || [], colMW, "Mw", showMw),
    };
  }, [chartJson, showIC, showTO, showMs, showMw]);

  // ===== seekToFrame / stepFrame / centerView =====
  function centerViewOnIndex(centerIdx: number) {
    const chart = chartRef.current;
    if (!chart || !chart.scales || !chart.scales.x) return;
    const x = chart.scales.x;
    const width = Math.max(10, (x.max ?? 0) - (x.min ?? 0));
    let newMin = centerIdx - width / 2;
    let newMax = centerIdx + width / 2;
    const lo = 0;
    const hi = (chart.data?.labels?.length ?? 1) - 1;
    if (newMin < lo) {
      newMax += lo - newMin;
      newMin = lo;
    }
    if (newMax > hi) {
      newMin -= newMax - hi;
      newMax = hi;
    }
    chart.options.scales.x.min = newMin;
    chart.options.scales.x.max = newMax;
    chart.update("none");
  }

  function seekToFrame(frame: number) {
    if (!chartJson || !videoRef.current) return;

    if (!Number.isFinite(frame)) {
      console.warn("seekToFrame 收到非數值 frame：", frame);
      return;
    }

    const N = chartJson.video.frame_count;
    const f = Math.max(0, Math.min(N - 1, Math.round(frame)));

    const secPerFrame = secPerFrameRef.current;
    if (secPerFrame && secPerFrame > 0) {
      const t = f * secPerFrame;
      if (Number.isFinite(t)) {
        videoRef.current.currentTime = t;
      }
    } else {
      const fps = chartJson.video.fps_used || 120;
      const t = f / fps;
      if (Number.isFinite(t)) {
        videoRef.current.currentTime = t;
      }
    }

    setCurrentFrame(f);
    centerViewOnIndex(f + PAD_FRAMES);
  }

  function stepFrame(delta: number) {
    if (!chartJson) return;
    const N = chartJson.video.frame_count;
    const next = Math.min(Math.max(currentFrame + delta, 0), N - 1);
    seekToFrame(next);
  }

  // ===== Chart.js data & options =====
  const { chartJsData, chartJsOptions } = useMemo(() => {
    if (!chartJson) return { chartJsData: null, chartJsOptions: null };

    const N = chartJson.video.frame_count;
    const labels = Array.from({ length: N + PAD_FRAMES * 2 }, (_, i) => i);

    const computed = chartJson.series.map((s) => {
      const { z } = zNormalize(s.y);
      return {
        id: s.id,
        label: s.label,
        unit: s.unit,
        raw: s.y,
        z,
        color: chartJson.style?.[s.id] || "#7dd3fc",
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
            label: (ctx: any) => {
              const dsIdx = ctx.datasetIndex;
              const idx = ctx.dataIndex;
              const realFrame = idx - PAD_FRAMES;
              const s = computed[dsIdx];
              const raw =
                realFrame >= 0 && realFrame < (chartJson?.video?.frame_count || 0)
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
            speed: 1,
            threshold: 0,
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
          ticks: {
            autoSkip: true,
            maxRotation: 0,
            font: { size: 10 },
            callback: (value: any) => {
              const v = Number(value);
              const real = v - PAD_FRAMES;
              if (!Number.isFinite(real)) return "";
              if (real < 0 || real >= N) return "";
              return real;
            },
          },
          grid: { drawOnChartArea: true, color: "rgba(255,255,255,0.06)" },
          min: 0,
          max: PAD_FRAMES * 2,
        },
        z: {
          type: "linear",
          position: "left",
          min: -3,
          max: 3,
          ticks: { display: false },
          grid: { drawOnChartArea: false },
        },
      },
      interaction: { mode: "nearest", intersect: false },
      maintainAspectRatio: false,
      onClick: (evt: any, _els: any, chart: any) => {
        const xScale = chart.scales.x;
        const rect = chart.canvas.getBoundingClientRect();
        const pixelX = evt.clientX - rect.left;
        const v = xScale.getValueForPixel(pixelX);

        if (!Number.isFinite(v)) return;

        const idx = Math.round(v);
        const frame = idx - PAD_FRAMES;
        if (frame < 0 || frame >= N) return;

        seekToFrame(frame);
      },
    };

    return { chartJsData: data, chartJsOptions: options };
  }, [chartJson, annotations, showSeries]);

  // 中央橘色指針 plugin
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

  // 影片 → 圖表同步（每 100ms）
  useEffect(() => {
    if (!chartJson || !videoRef.current) return;
    const timer = setInterval(() => {
      const video = videoRef.current!;
      const secPerFrame = secPerFrameRef.current;

      if (secPerFrame && secPerFrame > 0) {
        const f = Math.round(video.currentTime / secPerFrame);
        setCurrentFrame(f);
        if (!isUserPanning) centerViewOnIndex(f + PAD_FRAMES);
      } else {
        const fps = chartJson.video.fps_used || 120;
        const f = Math.round((video.currentTime || 0) * fps);
        setCurrentFrame(f);
        if (!isUserPanning) centerViewOnIndex(f + PAD_FRAMES);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [chartJson, isUserPanning]);

  // 鍵盤左右鍵控制
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") stepFrame(-1);
      else if (e.key === "ArrowRight") stepFrame(+1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentFrame, chartJson]);

  const baseBtn =
    "w-full py-3 rounded-lg font-semibold text-white transition inline-flex items-center justify-center shadow-md text-lg";

  if (checkingAuth) {
    return (
      <main className="p-6 text-center">
        <p>檢查登入狀態中…</p>
      </main>
    );
  }

  if (loading || !job) {
    return (
      <main className="p-6 text-center">
        <p>載入中…</p>
      </main>
    );
  }

  const title =
    (job.subject_name && job.subject_name.trim()) ||
    (job.user_tag && job.user_tag.trim()) ||
    "Your Analysis";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-6 text-center text-zinc-800 dark:text-zinc-200">
      <div className="bg-white/10 dark:bg-zinc-900 p-8 rounded-2xl shadow-lg w-full max-w-3xl border border-zinc-700">
        {backHref && (
          <div className="mb-4 text-left">
            <Link href={backHref} className="text-sm text-zinc-400 hover:text-blue-400 transition">
              {backText ?? "← Back to list"}
            </Link>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-6">{title}</h1>

        <p className="mb-3 text-zinc-400">
          使用者：<span className="text-white">{job.user_email}</span>
          {viewerEmail ? <span className="ml-2 text-white/40">(viewer: {viewerEmail})</span> : null}
        </p>

        <p className="mb-3">
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

        {errorMsg && (
          <p className="mb-4 text-sm text-red-400 whitespace-pre-wrap">{errorMsg}</p>
        )}

        {job.status === "done" ? (
            <div className="mt-6">
                {/* 兩欄：md 以上左右並列；小螢幕自動上下 */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">

                {/* 左欄：影片 */}
                <div className="md:col-span-2">
                    {job.result_video_r2 && base ? (
                    <video
                        ref={videoRef}
                        controls
                        src={buildR2Url(job.result_video_r2)}
                        className="w-full rounded-lg shadow-md border border-zinc-700"
                    />
                    ) : (
                    <div className="rounded-lg border border-zinc-700 bg-black/10 dark:bg-white/5 p-4 text-zinc-400">
                        尚未有影片可預覽
                    </div>
                    )}
                </div>

                {/* 右欄：checkbox + 圖表 + 幀控制 + 下載 */}
                <div className="md:col-span-4">
                    {/* Series checkbox */}
                    {chartJson && (
                    <div className="rounded-lg border border-zinc-700 bg-black/10 dark:bg-white/5 p-3">
                        <div className="text-sm font-semibold mb-2 text-left">曲線顯示</div>
                        <div className="flex flex-wrap gap-4 text-sm text-left">
                        {chartJson.series.map((s) => (
                            <label key={s.id} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={showSeries[s.id] !== false}
                                onChange={() =>
                                setShowSeries((prev) => ({
                                    ...prev,
                                    [s.id]: !(prev[s.id] !== false),
                                }))
                                }
                            />
                            {s.label}
                            </label>
                        ))}
                        </div>
                    </div>
                    )}

                    {/* 事件 checkbox */}
                    {chartJson && (
                    <div className="rounded-lg border border-zinc-700 bg-black/10 dark:bg-white/5 p-3">
                        <div className="text-sm font-semibold mb-2 text-left">事件顯示</div>
                        <div className="flex flex-wrap gap-4 text-sm text-left">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={showIC} onChange={() => setShowIC((v) => !v)} /> IC
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={showTO} onChange={() => setShowTO((v) => !v)} /> TO
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={showMs} onChange={() => setShowMs((v) => !v)} /> M-stance
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={showMw} onChange={() => setShowMw((v) => !v)} /> M-swing
                        </label>
                        </div>
                    </div>
                    )}

                    {/* 圖表 */}
                    {pluginsReady && chartJson && chartJsData && chartJsOptions ? (
                    <div className="rounded-lg border border-zinc-700 bg-black/10 dark:bg-white/5 p-2">
                        <div className="h-72 sm:h-80 w-full">
                        <Line
                            ref={chartRef}
                            data={chartJsData as any}
                            options={chartJsOptions as any}
                            plugins={[
                            ...(annotationPlugin ? [annotationPlugin] : []),
                            ...(zoomPlugin ? [zoomPlugin] : []),
                            centerPointerPlugin,
                            ]}
                        />
                        </div>
                        <p className="mt-2 text-xs text-zinc-400 text-left">
                        中央橘線＝播放指針。平移/縮放後，影片會跳到指針所指幀。
                        手機：雙指縮放、拖曳平移；桌機：Ctrl+滾輪縮放、拖曳平移；點擊圖表可跳轉。
                        </p>
                    </div>
                    ) : (
                    <div className="rounded-lg border border-zinc-700 bg-black/10 dark:bg-white/5 p-4 text-zinc-400">
                        {pluginsReady ? "尚未取得圖表資料（chart.json）。" : "載入圖表外掛中…"}
                    </div>
                    )}

                    {/* 幀控制按鈕 */}
                    {chartJson && (
                    <div className="flex items-center justify-center gap-4">
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
                    )}

                    {/* 下載按鈕 */}
                    <div className="flex gap-3 flex-wrap">
                    {job.result_png_r2 && base && (
                        <a
                        href={buildR2Url(job.result_png_r2)}
                        download
                        className={`${baseBtn} bg-blue-600 hover:bg-blue-700 text-base w-auto px-4 py-2`}
                        >
                        下載 PNG
                        </a>
                    )}
                    {job.result_xlsx_r2 && base && (
                        <a
                        href={buildR2Url(job.result_xlsx_r2)}
                        download
                        className={`${baseBtn} bg-green-600 hover:bg-green-700 text-base w-auto px-4 py-2`}
                        >
                        下載 Excel
                        </a>
                    )}
                    </div>
                </div>
                </div>
            </div>
            ) : job.status === "failed" ? (
          <p className="text-red-400">❌ 分析失敗：{job.error_msg ?? "請重新上傳影片。"}</p>
        ) : (
          <p className="text-yellow-400">⏳ 分析中，請稍後再試。</p>
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
