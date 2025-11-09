"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
import annotationPlugin from "chartjs-plugin-annotation";
import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip, annotationPlugin);

// ===== 型別定義 =====
type FileEntry = { bucket: string; path: string };
type ChartSeries = { id: string; label: string; unit: string; y: Array<number | null> };
type ChartJSON = {
  version: string;
  video: { fps_used: number; frame_count: number };
  series: ChartSeries[];
  events: { IC: number[]; TO: number[]; M_stance: number[]; M_swing: number[] };
  style?: Record<string, string>;
};

// ===== 主組件 =====
export default function ResultPage() {
  const [email, setEmail] = useState("");
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartJSON | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentFrame, setCurrentFrame] = useState<number>(0);

  // 事件開關
  const [showIC, setShowIC] = useState(true);
  const [showTO, setShowTO] = useState(true);
  const [showMs, setShowMs] = useState(true);
  const [showMw, setShowMw] = useState(true);

  // ===== 載入資料 =====
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
    } catch (err) {
      console.error("❌ 載入 chart.json 失敗:", err);
    }
  }

  // ===== 檔案下載 =====
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

  // ===== Z-score 正規化 =====
  function zNormalize(y: Array<number | null>) {
    const vals = y.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const std =
      Math.sqrt(vals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (vals.length || 1)) || 1;
    return { mean, std, z: y.map(v => (typeof v === "number" ? (v - mean) / std : null)) };
  }

  // ===== annotation 事件線 =====
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

  // ===== 圖表資料與選項 =====
  const { chartJsData, chartJsOptions } = useMemo(() => {
    if (!chartData) return { chartJsData: null, chartJsOptions: null };

    const labels = Array.from({ length: chartData.video.frame_count }, (_, i) => i);
    const computed = chartData.series.map(s => {
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

    const datasets = computed.map(c => ({
      label: `${c.label}`,
      data: c.z,
      borderColor: c.color,
      borderWidth: 1.8,
      pointRadius: 0,
      spanGaps: true,
      yAxisID: "z",
      tension: 0.25,
    }));

    const data = { labels, datasets };

    const options: any = {
      responsive: true,
      animation: false,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: (ctx: any) => {
              const ds = computed[ctx.datasetIndex];
              const raw = ds.raw?.[ctx.dataIndex];
              const z = ds.z?.[ctx.dataIndex];
              return `${ds.label}: ${raw?.toFixed?.(2) ?? "NA"} ${ds.unit} | z=${z?.toFixed?.(2) ?? "NA"}`;
            },
          },
        },
        annotation: { annotations },
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
    };

    return { chartJsData: data, chartJsOptions: options };
  }, [chartData, annotations]);

  // ===== 同步紅線 plugin =====
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

  // ===== 每 100 ms 同步影片位置 → currentFrame =====
  useEffect(() => {
    if (!chartData || !videoRef.current) return;
    const fps = chartData.video.fps_used || 120;
    const timer = setInterval(() => {
      const t = videoRef.current!.currentTime || 0;
      setCurrentFrame(Math.round(t * fps));
    }, 100);
    return () => clearInterval(timer);
  }, [chartData]);

  const baseBtn =
    "w-full py-3 rounded-lg font-semibold text-white transition inline-flex items-center justify-center shadow-md text-lg";

  // ======== Render ========
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

                {/* 事件開關 */}
                {chartData && (
                  <div className="flex gap-4 text-sm text-left mb-2">
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

                {/* 📈 圖表 */}
                {chartData && chartJsData && chartJsOptions ? (
                  <div className="h-80 w-full bg-black/10 dark:bg-white/5 rounded-lg p-3 border border-zinc-700">
                    <Line
                      data={chartJsData as any}
                      options={chartJsOptions as any}
                      plugins={[syncLinePlugin, annotationPlugin]}
                    />
                    <p className="mt-2 text-xs text-zinc-400 text-left">
                      曲線已做 Z-score 正規化（平均 0，±3σ）；紅虛線同步影片幀，勾選可開關事件線。
                    </p>
                  </div>
                ) : (
                  <p className="text-zinc-400">尚未取得圖表資料（chart.json）。</p>
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
