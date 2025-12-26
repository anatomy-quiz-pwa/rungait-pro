import dynamicImport from 'next/dynamic'

// 完全避免 SSR，只在 client 端渲染
// 注意：在 Server Component 中不能使用 ssr: false
const DashboardClient = dynamicImport(() => import('./dashboard-client'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-[#0B0F12]">
      <div className="text-center text-slate-400">
        <p>Loading dashboard...</p>
      </div>
    </div>
  ),
})

// 強制 dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function DashboardPage() {
  return <DashboardClient />
}
