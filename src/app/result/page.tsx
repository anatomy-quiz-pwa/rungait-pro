"use client";

import { useSearchParams } from "next/navigation";
import JobResultView from "@/components/JobResultView";

export default function ResultPage() {
  const sp = useSearchParams();
  const jobId = sp.get("jobId");

  if (!jobId) {
    return (
      <main className="p-6 text-center">
        <p className="text-red-400">網址內沒有 jobId 參數。</p>
      </main>
    );
  }

  return <JobResultView jobId={jobId} />;
}
