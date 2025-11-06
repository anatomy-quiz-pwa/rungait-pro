'use client';

export default function VersionBadge() {
  const commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'local';
  const shortSha = commitSha.slice(0, 7);
  
  return (
    <div className="fixed bottom-2 right-2 text-xs text-slate-400 dark:text-slate-500 font-mono bg-black/10 dark:bg-white/10 px-2 py-1 rounded backdrop-blur-sm">
      Build: {shortSha}
    </div>
  );
}

