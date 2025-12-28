// src/app/job/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type JobDetail = {
  id: string;
  created_at: string;
  status: string | null;
  is_sample: boolean;
  original_video_r2: string | null;
  result_video_r2: string | null;
  result_xlsx_r2: string | null;
  result_png_r2: string | null;
  start_time: number | null;
  end_time: number | null;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params; // ✅ Next.js 16 正確寫法

  return <JobDetailClient id={id} />;
}

/* -------------------------------------------------- */
/* Client Component：原本的邏輯全部搬到這裡 */
/* -------------------------------------------------- */

function JobDetailClient({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id, created_at, status, is_sample, original_video_r2, result_video_r2, result_xlsx_r2, result_png_r2, start_time, end_time"
        )
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setErr(error.message);
        setJob(null);
      } else {
        setJob((data ?? null) as JobDetail | null);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Analysis Detail</h1>
            <p className="mt-2 text-sm text-white/70">
              單筆分析結果頁（後續可串影片、圖表、報告）。
            </p>
          </div>
          <Link href="/single" className="text-sm text-[#38bdf8] hover:underline">
            ← Back to list
          </Link>
        </div>

        {loading && <div className="mt-8 text-white/70">載入中...</div>}

        {!loading && err && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            讀取失敗：{err}
          </div>
        )}

        {!loading && !err && !job && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            找不到這筆分析，或你沒有權限觀看。
          </div>
        )}

        {!loading && job && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold">
                {job.is_sample ? "Sample" : "Your Job"}
              </div>
              {job.status && (
                <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-xs text-white/70">
                  {job.status}
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-3 text-sm text-white/80">
              <Row k="Job ID" v={job.id} />
              <Row k="Created" v={new Date(job.created_at).toLocaleString()} />
              <Row k="Original video" v={job.original_video_r2 ?? "--"} />
              <Row k="Result video" v={job.result_video_r2 ?? "--"} />
              <Row k="Result xlsx" v={job.result_xlsx_r2 ?? "--"} />
              <Row k="Result png" v={job.result_png_r2 ?? "--"} />
              <Row
                k="Trim"
                v={
                  job.start_time != null && job.end_time != null
                    ? `${job.start_time}s → ${job.end_time}s`
                    : "--"
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 border-b border-white/10 pb-2">
      <div className="text-white/60">{k}</div>
      <div className="col-span-2 break-words">{v}</div>
    </div>
  );
}
