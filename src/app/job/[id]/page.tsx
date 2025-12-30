// src/app/job/[id]/page.tsx
import JobResultView from "@/components/JobResultView";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <JobResultView
      jobId={id}
      backHref="/single"
      backText="← Back to list"
    />
  );
}
