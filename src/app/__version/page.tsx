export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Version() {
  const commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'local';
  const buildTime = new Date().toISOString();
  
  return (
    <div style={{ padding: 20, fontFamily: 'monospace', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1>Build Information</h1>
      <p><strong>Current Build SHA:</strong> {commitSha.slice(0, 7)}</p>
      <p><strong>Full SHA:</strong> {commitSha}</p>
      <p><strong>Build Time:</strong> {buildTime}</p>
      <p><strong>Environment:</strong> {process.env.NODE_ENV || 'development'}</p>
      <hr style={{ margin: '20px 0' }} />
      <p><strong>如果顯示 'local'，表示在本地開發環境</strong></p>
      <p><strong>如果顯示 commit SHA，表示已部署到 Vercel</strong></p>
    </div>
  );
}

