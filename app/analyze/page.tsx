// Server Component wrapper - 強制動態渲染以避免 SSG
import AnalyzePageClient from './page-client'

// 強制動態渲染，避免 SSG 階段嘗試 prerender
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AnalyzePage() {
  return <AnalyzePageClient />
}
