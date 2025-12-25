"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { readLS, writeLS, removeLS } from "@/lib/storage"

interface User {
  id: string
  email: string
  plan_id: string
  monthly_quota: number
  credits_extra: number
}

interface BillingInfo {
  used_count: number
  remaining: number
  monthly_quota: number
  credits_extra: number
}

interface AuthContextType {
  user: User | null
  userRole: "admin" | "clinician" | null
  billingInfo: BillingInfo | null
  login: (email: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  consumeAnalysis: (metadata: { filename: string; size: number }) => Promise<{ ok: boolean; remaining?: number }>
  refreshBilling: () => void
}

const ADMIN_ALLOWLIST = ["paopaopainting@gmail.com"]

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function safeJSONParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback
  try {
    return JSON.parse(json) as T
  } catch (error) {
    console.error("[Auth] JSON parse error:", error)
    return fallback
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<"admin" | "clinician" | null>(null)
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)

  useEffect(() => {
    const savedUser = readLS("auth_user")
    if (!savedUser) return
    const parsedUser = safeJSONParse<User | null>(savedUser, null)
    if (parsedUser) {
      setUser(parsedUser)
      loadBillingInfo(parsedUser)
      loadUserRole(parsedUser)
    }
  }, [])

  const loadUserRole = async (currentUser: User) => {
    const savedRole = readLS(`role_${currentUser.id}`)
    if (savedRole) {
      setUserRole(savedRole as "admin" | "clinician")
    } else {
      const role = ADMIN_ALLOWLIST.includes(currentUser.email) ? "admin" : "clinician"
      setUserRole(role)
      writeLS(`role_${currentUser.id}`, role)
    }
  }

  const loadBillingInfo = (currentUser: User) => {
    const usageKey = `usage_${currentUser.id}_${new Date().getMonth()}`
    const used = Number.parseInt(readLS(usageKey) || "0")
    const total = currentUser.monthly_quota + currentUser.credits_extra
    setBillingInfo({
      used_count: used,
      remaining: total - used,
      monthly_quota: currentUser.monthly_quota,
      credits_extra: currentUser.credits_extra,
    })
  }

  const login = async (email: string): Promise<{ success: boolean; message?: string }> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const mockUser: User = {
          id: `user_${Date.now()}`,
          email,
          plan_id: "free",
          monthly_quota: 5,
          credits_extra: 0,
        }

        setUser(mockUser)
        writeLS("auth_user", JSON.stringify(mockUser))
        loadBillingInfo(mockUser)

        await loadUserRole(mockUser)

        resolve({ success: true, message: "Login link sent to your email!" })
      }, 500)
    })
  }

  const logout = () => {
    setUser(null)
    setUserRole(null)
    setBillingInfo(null)
    removeLS("auth_user")
  }

  const consumeAnalysis = async (metadata: { filename: string; size: number }): Promise<{
    ok: boolean
    remaining?: number
  }> => {
    if (!user || !billingInfo) return { ok: false }

    if (billingInfo.remaining <= 0) {
      return { ok: false, remaining: 0 }
    }

    const usageKey = `usage_${user.id}_${new Date().getMonth()}`
    const currentUsage = Number.parseInt(readLS(usageKey) || "0")
    const newUsage = currentUsage + 1
    writeLS(usageKey, newUsage.toString())

    const usageRecord = {
      user_id: user.id,
      cost: 1,
      metadata,
      timestamp: new Date().toISOString(),
    }
    const allUsage = safeJSONParse(readLS("usage_records"), [])
    allUsage.push(usageRecord)
    writeLS("usage_records", JSON.stringify(allUsage))

    const total = user.monthly_quota + user.credits_extra
    setBillingInfo({
      used_count: newUsage,
      remaining: total - newUsage,
      monthly_quota: user.monthly_quota,
      credits_extra: user.credits_extra,
    })

    return { ok: true, remaining: total - newUsage }
  }

  const refreshBilling = () => {
    if (user) {
      loadBillingInfo(user)
    }
  }

  return (
    <AuthContext.Provider value={{ user, userRole, billingInfo, login, logout, consumeAnalysis, refreshBilling }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
