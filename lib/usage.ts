'use client'

import { readLS } from "@/lib/storage"

interface CreditsData {
  points: number
  used: number
  quota: number
  extra: number
  plan: string
}

interface AnalysisRow {
  id: string
  video_url: string | null
  created_at: string
  speed_kph: number
  cadence_spm: number
  step_length_cm: number
}

export async function fetchCredits(): Promise<CreditsData> {
  // 確保只在瀏覽器環境執行
  if (typeof window === 'undefined') {
    return { points: 0, used: 0, quota: 0, extra: 0, plan: "free" }
  }
  
  // Simulated backend that reads from localStorage
  // Can be replaced with real Supabase queries when ready
  const savedUser = readLS("auth_user")

  if (!savedUser) {
    return { points: 0, used: 0, quota: 0, extra: 0, plan: "free" }
  }

  const user = JSON.parse(savedUser)
  const usageKey = `usage_${user.id}_${new Date().getMonth()}`
  const used = Number.parseInt(readLS(usageKey) || "0")
  const quota = user.monthly_quota || 0
  const extra = user.credits_extra || 0

  // Calculate available points: (quota - used) + extra
  const points = Math.max(0, quota - used) + extra

  return {
    points,
    used,
    quota,
    extra,
    plan: user.plan_id || "free",
  }
}

export async function listMyAnalyses(): Promise<AnalysisRow[]> {
  // 確保只在瀏覽器環境執行
  if (typeof window === 'undefined') {
    return []
  }
  
  // Simulated backend - replace with real Supabase query
  const savedUser = readLS("auth_user")
  if (!savedUser) return []

  // Mock data for demonstration
  return [
    {
      id: "1",
      video_url: "/running-gait-analysis-video.jpg",
      created_at: new Date().toISOString(),
      speed_kph: 12.5,
      cadence_spm: 170,
      step_length_cm: 120,
    },
    {
      id: "2",
      video_url: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      speed_kph: 11.8,
      cadence_spm: 165,
      step_length_cm: 115,
    },
  ]
}
