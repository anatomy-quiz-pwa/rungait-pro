'use client'

import { readLS, writeLS } from "@/lib/storage"
import type { AnalysisPacketWithMeta, CaseMeta } from "./types"
import { createMockAnalysis } from "./mock-data"

// Simulated backend - replace with Supabase when ready
export async function getAnalysisWithMeta(id: string): Promise<AnalysisPacketWithMeta> {
  // 確保只在瀏覽器環境執行
  if (typeof window === 'undefined') {
    const analysis = createMockAnalysis(id)
    return {
      ...analysis,
      case_meta: {},
      library_sources: ["official"],
    }
  }

  const analysis = createMockAnalysis(id)

  // Try to load case_meta from localStorage
  const key = `case_meta_${id}`
  const saved = readLS(key)
  const case_meta = saved ? JSON.parse(saved) : {}

  // Load library sources
  const sourcesKey = `analysis_sources_${id}`
  const savedSources = readLS(sourcesKey)
  const library_sources = savedSources ? JSON.parse(savedSources) : ["official"]

  return {
    ...analysis,
    case_meta,
    library_sources,
  }
}

export async function updateCaseMeta(id: string, meta: CaseMeta): Promise<void> {
  if (typeof window === 'undefined') return
  const key = `case_meta_${id}`
  writeLS(key, JSON.stringify(meta))
}

export async function reanalyzeWithLibraries(id: string, selectedSources: string[]): Promise<void> {
  if (typeof window === 'undefined') return
  // Save selected sources for this analysis
  const key = `analysis_sources_${id}`
  writeLS(key, JSON.stringify(selectedSources))

  // In real implementation, this would trigger backend reprocessing
  console.log("[v0] Reanalyze with sources:", selectedSources)
}
