"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip } from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip);

export default function ChartPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bucket = params.get("bucket");
    const path = params.get("path");
    if (bucket && path) loadChart(bucket, path);
  }, []);

  async function loadChart(bucket: string, path: string) {
    try {
      const { data, error } = await supabase.storage.from(bucket).download(path);
      if (error) throw error;
      const json = JSON.parse(await data.text());
      setData(json);
    } catch (err: any) {
      console.error("❌ 無法讀取 JSON", err);
      setError(err.message);
    }
  }

  if (error) return <p className="text-red-400">{error}</p>;
  if (!data) return <p className="text-zinc-400">載入中...</p>;

  const chartData = {
    labels: Array.from({ length: data.video.frame_count }, (_, i) => i),
    datasets: data.series.map((s: any) => ({
      label: s.label,
      data: s.y,
      borderColor: data.style?.[s.id] || "gray",
      borderWidth: 1.6,
      fill: false,
      tension: 0.2,
    })),
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Kinematic Angles" },
    },
    scales: {
      x: { title: { display: true, text: "Frame" } },
      y: { title: { display: true, text: "Angle (°)" } },
    },
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black p-6 text-zinc-800 dark:text-zinc-200">
      <h1 className="text-2xl font-bold mb-4">📈 互動式角度圖表</h1>
      <div className="bg-white/10 dark:bg-zinc-900 p-6 rounded-xl shadow-lg border border-zinc-700">
        <Line data={chartData} options={options} />
      </div>
    </main>
  );
}
