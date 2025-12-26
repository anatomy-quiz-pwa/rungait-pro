import RunGaitMap from '@/components/RunGaitMap'

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
