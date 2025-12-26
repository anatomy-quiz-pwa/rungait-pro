import dynamicImport from 'next/dynamic'

// 動態載入 RunGaitMap，避免 SSR 問題
// 注意：在 Server Component 中不能使用 ssr: false
const RunGaitMap = dynamicImport(() => import('@/components/RunGaitMap'), {
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#0B0F12]">
      <div className="text-center text-slate-400">
        <p>Loading map...</p>
      </div>
    </div>
  ),
})

// 強制 dynamic rendering，避免 SSR pre-render
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function MapPage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <RunGaitMap />
    </div>
  )
}
