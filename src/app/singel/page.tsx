// src/app/single/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type JobRow = {
  id: string;
  created_at: string;
  status: string | null;
  is_sample: boolean;
  start_time: number | null;
  end_time: number | null;
  original_video_r2: string | null;
  result_video_r2: string | null;
};

export default function SinglePage() {
  const [loading, setLoading] = useState(true);
  const [mustLogin, setMustLogin] = useState(false);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      const { data: u } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!u.user) {
        setMustLogin(true);
        setLoading(false);
        return;
      }

      // 讀 jobs：RLS 會自動限制，只回 sample + 自己的
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id, created_at, status, is_sample, start_time, end_time, original_video_r2, result_video_r2"
        )
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setErr(error.message);
        setJobs([]);
      } else {
        setJobs((data ?? []) as JobRow[]);
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Single Analysis</h1>
            <p className="mt-2 text-sm text-white/70">
              這裡會列出範例（Sample）以及你帳號曾經上傳並分析過的影片紀錄。
            </p>
          </div>
          <Link
            href="/upload"
            className="rounded-xl bg-[#0ea5e9] px-4 py-2 text-sm font-medium text-black hover:opacity-90"
          >
            Upload New Video
          </Link>
        </div>

        {loading && <div className="mt-8 text-white/70">載入中...</div>}

        {!loading && mustLogin && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-semibold">需要登入</div>
            <p className="mt-2 text-sm text-white/70">
              請先登入後再查看你的分析清單。
            </p>
            <div className="mt-4">
              <Link
                href="/login"
                className="rounded-xl bg-[#0ea5e9] px-4 py-2 text-sm font-medium text-black hover:opacity-90"
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}

        {!loading && err && (
          <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            讀取失敗：{err}
          </div>
        )}

        {!loading && !mustLogin && !err && (
          <div className="mt-8 space-y-3">
            {jobs.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
                目前沒有任何分析紀錄。你可以先上傳一段影片開始分析。
              </div>
            ) : (
              jobs.map((j) => (
                <Link
                  key={j.id}
                  href={`/job/${j.id}`}
                  className="block rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-semibold">
                          {j.is_sample ? "Sample Analysis" : "Your Analysis"}
                        </div>
                        {j.status && (
                          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-xs text-white/70">
                            {j.status}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-white/60">
                        Created: {new Date(j.created_at).toLocaleString()}
                        {j.start_time != null && j.end_time != null
                          ? ` · Trim: ${j.start_time}s → ${j.end_time}s`
                          : ""}
                      </div>
                    </div>
                    <div className="text-sm text-[#38bdf8]">Open →</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
