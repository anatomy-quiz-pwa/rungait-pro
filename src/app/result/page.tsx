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

let annotationPlugin: any = null;
let zoomPlugin: any = null;

const Line = dynamic(() => import("react-chartjs-2").then(m => m.Line), {
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
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_RESULTS!;
  const [job, setJob] = useState<JobRow | null>(null);
  const [chartJson, setChartJson] = useState<ChartJSON | null>(null);
  const [loading, setLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chartRef = useRef<any>(null);

  const [currentFrame, setCurrentFrame] = useState(0);
  const secPerFrameRef = useRef<number | null>(null);
  const [isUserPanning, setIsUserPanning] = useState(false);

  const PAD = 120;

  // --- Load job + chart.json ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("jobId");
    if (!jobId) return;

    loadJob(jobId);
    subscribeJob(jobId);
  }, []);

  async function loadJob(jobId: string) {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    if (data) {
      setJob(data);
      if (data.result_json_r2 && base) {
        const encoded = encodeURI(data.result_json_r2);
        const url = `${base}/${encoded}`;
        console.log("Fetching chart JSON:", url);

        const res = await fetch(url);
        const json = await res.json();
        setChartJson(json);
      }
    }
    setLoading(false);
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

    // ----- event lines -----
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
          annotation: { annotations: ann } as any,
          tooltip: { mode: "index", intersect: false },
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
          const idx = Math.round(xScale.getValueForPixel(evt.clientX - rect.left));
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

      {/* Video */}
      {job.result_video_r2 && (
        <video
          ref={videoRef}
          controls
          className="w-full rounded border"
          src={`${base}/${job.result_video_r2}`}
        />
      )}

      {/* Chart */}
      {chartData && chartOptions ? (
        <div className="w-full h-80">
          <Line
            ref={chartRef}
            data={chartData}
            options={chartOptions}
            plugins={[annotationPlugin, zoomPlugin]}
          />
        </div>
      ) : (
        <p>尚未取得圖表資料...</p>
      )}

      {/* Downloads */}
      <div className="flex gap-4 flex-wrap">
        {job.result_png_r2 && (
          <a
            href={`${base}/${job.result_png_r2}`}
            download
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            下載 PNG
          </a>
        )}
        {job.result_xlsx_r2 && (
          <a
            href={`${base}/${job.result_xlsx_r2}`}
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
