"use client";

import JobResultView from "@/components/JobResultView";

export default function JobDetailPage({ params }: { params: { id: string } }) {
  return (
    <JobResultView
      jobId={params.id}
      backHref="/single"
      backText="← Back to list"
    />
  );
}
