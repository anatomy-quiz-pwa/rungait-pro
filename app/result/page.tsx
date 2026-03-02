"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import JobResultView from "@/components/JobResultView"

function ResultContent() {
  const sp = useSearchParams()
  const jobId = sp.get("jobId")

  if (!jobId) {
    return (
      <main className="p-6 text-center">
        <p className="text-red-400">網址內沒有 jobId 參數。</p>
      </main>
    )
  }

  return <JobResultView jobId={jobId} backHref="/single" backText="← Back to list" />
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6 text-center">
          <p>載入中…</p>
        </main>
      }
    >
      <ResultContent />
    </Suspense>
  )
}
