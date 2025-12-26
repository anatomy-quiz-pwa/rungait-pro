'use client'

import { readLS, writeLS } from "@/lib/storage"

export interface CreditsInfo {
  balance: number
  lastUpdatedISO?: string
}

export async function fetchCredits(): Promise<CreditsInfo> {
  // 確保只在瀏覽器環境執行
  if (typeof window === 'undefined') {
    return { balance: 0 }
  }
  
  // Simulated backend - replace with real Supabase when ready
  const savedUser = readLS("auth_user")
  if (!savedUser) return { balance: 0 }

  const user = JSON.parse(savedUser)
  const usageKey = `usage_${user.id}_${new Date().getMonth()}`
  const used = Number.parseInt(readLS(usageKey) || "0")
  const quota = user.monthly_quota || 3
  const extra = user.credits_extra || 0

  const balance = Math.max(0, quota - used) + extra

  return {
    balance,
    lastUpdatedISO: new Date().toISOString(),
  }
}

export async function consumeOneCredit(meta: Record<string, any>): Promise<number> {
  // 確保只在瀏覽器環境執行
  if (typeof window === 'undefined') {
    throw new Error("Not available on the server")
  }
  
  // Simulated backend - replace with Supabase RPC call
  const savedUser = readLS("auth_user")
  if (!savedUser) throw new Error("Not authenticated")

  const user = JSON.parse(savedUser)
  const usageKey = `usage_${user.id}_${new Date().getMonth()}`
  const used = Number.parseInt(readLS(usageKey) || "0")

  const credits = await fetchCredits()
  if (credits.balance < 1) {
    throw new Error("INSUFFICIENT_CREDITS")
  }

  writeLS(usageKey, String(used + 1))

  return credits.balance - 1
}

export async function grantRewardIfNeeded(locId: string) {
  // Placeholder – reward is executed server-side on approval
  console.log("[v0] Grant reward for location:", locId)
}
