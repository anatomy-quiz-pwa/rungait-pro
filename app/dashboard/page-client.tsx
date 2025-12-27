"use client"

import { useEffect, useState } from 'react'
import dynamicImport from 'next/dynamic'

// 完全避免 SSR，只在 client 端渲染
const DashboardClient = dynamicImport(() => import('./dashboard-client'), {
  ssr: false, // 完全禁用 SSR，只在 client 端載入
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-[#0B0F12]">
      <div className="text-center text-slate-400">
        <p>Loading dashboard...</p>
      </div>
    </div>
  ),
})

export default function DashboardPageClient() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0F12]">
        <div className="text-center text-slate-400">
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return <DashboardClient />
}

