"use client"

import dynamicImport from 'next/dynamic'

// 動態載入 RunGaitMap，避免 SSR 問題
// 使用 ssr: false 確保不會在 server 端執行
const RunGaitMap = dynamicImport(() => import('@/components/RunGaitMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#0B0F12]">
      <div className="text-center text-slate-400">
        <p>Loading map...</p>
      </div>
    </div>
  ),
})

export default function MapPage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <RunGaitMap />
    </div>
  )
}
