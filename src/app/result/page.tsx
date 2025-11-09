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

let annotationPlugin: any = null;
let zoomPlugin: any = null;

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
  const [showSeries, setShowSeries] = useState<Record<string, boolean>>({});
  const [currentFrame, setCurrentFrame] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chartRef = useRef<any>(null);
  const autoScroll = useRef(true);

  // --- 初始化外掛 ---
  useEffect(() => {
    (async () => {
      const [{ default: anno }, { default: zoom }] = await Promise.all([
        import("chartjs-plugin-annotation"),
        import("chartjs-plugin-zoom"),
      ]);
      annotationPlugin = anno;
      zoomPlugin = zoom;
      ChartJS.register(annotationPlugin, zoomPlugin);
      setPluginsReady(true);
    })();
  }, []);

  // --- 載入最新 job ---
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
    const { data } = await supabase
      .from("jobs")
      .select("id,user_email,status,result_signed_url,result_json,error_msg")
      .eq("user_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

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

  async function loadChartJSON(bucket: string, path: string) {
    const { data } = await supabase.storage.from(bucket).download(path);
    const json: ChartJSON = JSON.parse(await data.text());
    setChartData(json);
    const vis: Record<string, boolean> = {};
    json.series.forEach((s) => (vis[s.id] = true));
    setShowSeries(vis);
  }

  // --- Z-score ---
  function zNormalize(y: Array<number | null>) {
    const vals = y.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const std =
      Math.sqrt(vals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (vals.length || 1)) || 1;
    return { mean, std, z: y.map((v) => (typeof v === "number" ? (v - mean) / std : null)) };
  }

  // --- Chart 資料 ---
  const { chartJsData, chartJsOptions } = useMemo(() => {
    if (!chartData) return { chartJsData: null, chartJsOptions: null };
    const labels = Array.from({ length: chartData.video.frame_count }, (_, i) => i);
    const computed = chartData.series.map((s) => {
      const { z } = zNormalize(s.y);
      return {
        id: s.id,
        label: s.label,
        unit: s.unit,
        z,
        color: chartData.style?.[s.id] || "#999",
      };
    });

    const datasets = computed.map((c) => ({
      label: c.label,
      data: c.z,
      borderColor: c.color,
      borderWidth: 1.5,
      pointRadius: 0,
      spanGaps: true,
      hidden: showSeries[c.id] === false,
    }));

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
      layout: { padding: { left: 10, right: 10, bottom: 5, top: 5 } },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#ccc" } },
        y: {
          min: -3,
          max: 3,
          ticks: { stepSize: 1, color: "#ccc" },
          title: { display: false },
        },
      },
      maintainAspectRatio: false,
      onPanComplete: (ctx: any) => {
        const xScale = ctx.chart.scales.x;
        const midValue = Math.round((xScale.min + xScale.max) / 2);
        seekToFrame(midValue);
      },
      onZoomComplete: (ctx: any) => {
        const xScale = ctx.chart.scales.x;
        const midValue = Math.round((xScale.min + xScale.max) / 2);
        seekToFrame(midValue);
      },
    };
    return { chartJsData: { labels, datasets }, chartJsOptions: options };
  }, [chartData, showSeries]);

  // --- 紅色指針固定中間 ---
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

  // --- seek 影片 ---
  function seekToFrame(frame: number) {
    if (!chartData || !videoRef.current) return;
    const fps = chartData.video.fps_used || 120;
    const t = Math.max(0, Math.min(frame / fps, videoRef.current.duration || 0));
    videoRef.current.currentTime = t;
    setCurrentFrame(frame);
  }

  // --- 影片播放帶動圖表 ---
  useEffect(() => {
    if (!chartData || !videoRef.current || !chartRef.current) return;
    const fps = chartData.video.fps_used || 120;
    const chart = chartRef.current;
    const timer = setInterval(() => {
      const t = videoRef.current!.currentTime || 0;
      const frame = Math.round(t * fps);
      setCurrentFrame(frame);

      if (autoScroll.current && chart.chart) {
        const xScale = chart.chart.scales.x;
        const range = xScale.max - xScale.min;
        const center = (xScale.min + xScale.max) / 2;
        const diff = frame - center;
        if (Math.abs(diff) > range * 0.3) {
          const shift = diff * 0.05;
          xScale.options.min = (xScale.min + shift) as any;
          xScale.options.max = (xScale.max + shift) as any;
          chart.chart.update("none");
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
                {job.result_signed_url && (
                  <video
                    ref={videoRef}
                    controls
                    src={job.result_signed_url}
                    className="w-full rounded-lg border border-zinc-700"
                  />
                )}

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

                {pluginsReady && chartData && chartJsData && chartJsOptions ? (
                  <div className="h-72 w-full bg-black/10 rounded-lg p-2 border border-zinc-700">
                    <Line
                      ref={chartRef}
                      data={chartJsData as any}
                      options={chartJsOptions as any}
                      plugins={[zoomPlugin, centerPointerPlugin]}
                    />
                    <p className="text-xs text-zinc-400 mt-1 text-left">
                      中央紅線＝目前影片幀。<br />
                      拖曳／縮放圖表會改變影片時間，播放時圖表會自動向前移動。
                    </p>
                  </div>
                ) : (
                  <p className="text-zinc-400">尚未取得圖表資料。</p>
                )}

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
