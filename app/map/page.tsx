"use client"

import { useEffect, useState } from 'react'
import dynamicImport from 'next/dynamic'

// 動態載入 RunGaitMap，完全避免 SSR 問題
const RunGaitMap = dynamicImport(() => import('@/components/RunGaitMap'), {
  ssr: false, // 完全禁用 SSR，只在 client 端載入
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#0B0F12]">
      <div className="text-center text-slate-400">
        <p>Loading map...</p>
      </div>
    </div>
  ),
})

export default function MapPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0B0F12]">
        <div className="text-center text-slate-400">
          <p>Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <RunGaitMap />
    </div>
  )
}
