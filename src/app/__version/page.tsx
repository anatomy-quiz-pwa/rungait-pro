export const dynamic = 'force-dynamic';

export default function Version() {
  const commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'local';
  const buildTime = new Date().toISOString();
  
  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h1>Build Information</h1>
      <p>Commit: {commitSha.slice(0, 7)}</p>
      <p>Build Time: {buildTime}</p>
      <p>Environment: {process.env.NODE_ENV || 'development'}</p>
    </div>
  );
}

