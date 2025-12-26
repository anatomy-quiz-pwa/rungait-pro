"use client"

import dynamicImport from 'next/dynamic'

// 完全避免 SSR，只在 client 端渲染
// 使用 ssr: false 確保不會在 server 端執行
const DashboardClient = dynamicImport(() => import('./dashboard-client'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-[#0B0F12]">
      <div className="text-center text-slate-400">
        <p>Loading dashboard...</p>
      </div>
    </div>
  ),
})

export default function DashboardPage() {
  return <DashboardClient />
}
