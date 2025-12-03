"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import dynamic from "next/dynamic";

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

const Line = dynamic(() => import("react-chartjs-2").then((m) => m.Line), {
  ssr: false,
});

// --- Types ---
type JobRow = {
  id: string;
  user_email: string;
  status: string;
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
  style: {
    [k: string]: any;
    events: Record<string, string>;
  };
};

export default function ResultPage() {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_RESULTS || "";
  const [job, setJob] = useState<JobRow | null>(null);
  const [chartJson, setChartJson] = useState<ChartJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chartRef = useRef<any>(null);

  const [currentFrame, setCurrentFrame] = useState(0);
  const secPerFrameRef = useRef<number | null>(null);
  const [isUserPanning, setIsUserPanning] = useState(false);

  const PAD = 120;

  // R2 靜態檔案（影片 / PNG / Excel）用的 URL builder
  function buildR2Url(path: string) {
    const cleanBase = base.replace(/\/+$/, "");
    let cleanPath = path.replace(/^\/+/, "");
    if (cleanPath.startsWith("runpose-results/")) {
      cleanPath = cleanPath.slice("runpose-results/".length);
    }
    const encodedPath = encodeURI(cleanPath).replace(/@/g, "%40");
    return `${cleanBase}/${encodedPath}`;
  }

  // --- Load job + chart.json ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("jobId");
    console.log("Result page jobId =", jobId);
    console.log("R2 base =", base);

    if (!jobId) {
      setErrorMsg("網址內沒有 jobId 參數。");
      setLoading(false);
      return;
    }

    loadJob(jobId);
    subscribeJob(jobId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setErrorMsg("找不到這個任務。");
        return;
      }

      console.log("🔎 job row =", data);
      setJob(data);

      if (data.result_json_r2) {
        const pathParam = encodeURIComponent(data.result_json_r2);
        const apiUrl = `/api/chart-json?path=${pathParam}`;
        console.log("Fetching chart JSON via API:", apiUrl);

        const res = await fetch(apiUrl);
        if (!res.ok) {
          console.error("❌ chart-json API 回傳錯誤：", res.status);
          setErrorMsg(`載入圖表資料失敗（HTTP ${res.status}）。`);
          return;
        }

        const json = (await res.json()) as ChartJSON;
        console.log("✅ chart.json loaded.");
        setChartJson(json);
      } else {
        console.warn("⚠️ 這個 job 沒有 result_json_r2");
      }
    } catch (e: any) {
      console.error("❌ loadJob 發生錯誤：", e);
      setErrorMsg(`載入資料時發生錯誤：${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  // =====⭐ Realtime：分析完成立刻刷新=====
  function subscribeJob(jobId: string) {
    supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", table: "jobs", schema: "public", filter: `id=eq.${jobId}` },
        (payload) => {
          if (payload.new.status === "done") {
            window.location.reload();
          }
        }
      )
      .subscribe();
  }

  // ===== 影片 loadedmetadata → 計算 secPerFrame =====
  useEffect(() => {
    if (!chartJson) return;
    const video = videoRef.current;
    if (!video) return;

    const onMeta = () => {
      const N = chartJson.video.frame_count;
      if (video.duration > 0) {
        secPerFrameRef.current = video.duration / N;
      }
    };

    video.addEventListener("loadedmetadata", onMeta);
    if (video.readyState >= 1) onMeta();

    return () => video.removeEventListener("loadedmetadata", onMeta);
  }, [chartJson]);

  // ===== ChartJS data + options =====
  const { data: chartData, options: chartOptions } = useMemo(() => {
    if (!chartJson) return { data: null, options: null };

    const N = chartJson.video.frame_count;
    const labels = Array.from({ length: N + PAD * 2 }, (_, i) => i);

    const datasets = chartJson.series.map((s) => ({
      label: s.label,
      data: [...Array(PAD).fill(null), ...s.y, ...Array(PAD).fill(null)],
      borderColor: chartJson.style[s.id] || "#7dd3fc",
      borderWidth: 1.8,
      tension: 0.25,
      spanGaps: true,
      pointRadius: 0,
      yAxisID: "y",
    }));

    const events = chartJson.events;
    const colors = chartJson.style?.events || {};

    const ann: Record<string, any> = {};

    const safeIC = colors?.IC || "#ff0000";
    const safeTO = colors?.TO || "#008000";
    const safeMS = colors?.M_stance || "#444";
    const safeMW = colors?.M_swing || "#444";

    function add(arr: number[], label: string, color: string) {
      arr?.forEach((f, i) => {
        ann[`${label}_${i}`] = {
          type: "line",
          xMin: f + PAD,
          xMax: f + PAD,
          borderColor: color,
          borderWidth: 1.2,
          borderDash: [4, 4],
          label: {
            display: true,
            content: label,
            position: "start",
          },
        };
      });
    }

    add(events.IC, "IC", safeIC);
    add(events.TO, "TO", safeTO);
    add(events.M_stance, "MS", safeMS);
    add(events.M_swing, "MW", safeMW);

    return {
      data: { labels, datasets },
      options: {
        responsive: true,
        animation: false,
        plugins: {
          legend: { display: false },
          // 這裡的 annotation/zoom 設定，沒有對應 plugin 時 Chart.js 會自動忽略，不會再掛掉
          annotation: { annotations: ann } as any,
          zoom: {
            zoom: {
              wheel: { enabled: true, modifierKey: "ctrl" },
              pinch: { enabled: true },
              mode: "x",
              onZoomStart: () => setIsUserPanning(true),
              onZoomComplete: () => setIsUserPanning(false),
            },
            pan: {
              enabled: true,
              mode: "x",
              onPanStart: () => setIsUserPanning(true),
              onPanComplete: () => setIsUserPanning(false),
            },
          },
        } as any,
        scales: {
          x: {
            ticks: {
              callback: (v: any) => {
                const frame = v - PAD;
                return frame >= 0 && frame < N ? frame : "";
              },
            },
          },
          y: {},
        },
        onClick: (evt: any, _els: any, chart: any) => {
          const xScale = chart.scales.x;
          const rect = chart.canvas.getBoundingClientRect();
          const idx = Math.round(
            xScale.getValueForPixel(evt.clientX - rect.left)
          );
          seekToFrame(idx - PAD);
        },
      } as any,
    };
  }, [chartJson]);

  // ===== 跳時間 =====
  function seekToFrame(frame: number) {
    if (!videoRef.current || !chartJson) return;
    const N = chartJson.video.frame_count;
    const f = Math.max(0, Math.min(N - 1, frame));

    const sec = secPerFrameRef.current;
    if (sec) videoRef.current.currentTime = f * sec;

    setCurrentFrame(f);
  }

  // ===== 影片 → Chart pointer =====
  useEffect(() => {
    if (!chartJson || !videoRef.current) return;
    const timer = setInterval(() => {
      const sec = videoRef.current!.currentTime;
      const f = secPerFrameRef.current
        ? Math.round(sec / secPerFrameRef.current)
        : 0;
      setCurrentFrame(f);
    }, 80);
    return () => clearInterval(timer);
  }, [chartJson]);

  // ========== UI ==========
  if (loading || !job) {
    return (
      <main className="p-6 text-center">
        <p>載入中…</p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">分析結果</h1>

      <p>使用者：{job.user_email}</p>

      {errorMsg && (
        <p className="text-sm text-red-400 whitespace-pre-wrap">{errorMsg}</p>
      )}

      {/* Video */}
      {job.result_video_r2 && base && (
        <>
          {console.log("🎬 Video URL:", buildR2Url(job.result_video_r2))}
          <video
            ref={videoRef}
            controls
            className="w-full rounded border"
            src={buildR2Url(job.result_video_r2)}
          />
        </>
      )}

      {/* Chart */}
      {chartData && chartOptions ? (
        <div className="w-full h-80">
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </div>
      ) : (
        <p>尚未取得圖表資料...</p>
      )}

      {/* Downloads */}
      <div className="flex gap-4 flex-wrap">
        {job.result_png_r2 && base && (
          <a
            href={buildR2Url(job.result_png_r2)}
            download
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            下載 PNG
          </a>
        )}
        {job.result_xlsx_r2 && base && (
          <a
            href={buildR2Url(job.result_xlsx_r2)}
            download
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            下載 Excel
          </a>
        )}
      </div>

      <Link href="/upload" className="text-sm text-zinc-400">
        ← 回上傳
      </Link>
    </main>
  );
}
