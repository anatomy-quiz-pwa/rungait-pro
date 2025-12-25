"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchCredits } from "@/lib/usage"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { Sparkles, ShoppingCart, TrendingUp } from "lucide-react"

export function CreditsBadge() {
  const { user, billingInfo } = useAuth()
  const [credits, setCredits] = useState<{
    points: number
    used: number
    quota: number
    extra: number
    plan: string
  } | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (user) {
      loadCredits()
    }
  }, [user, billingInfo])

  const loadCredits = async () => {
    const data = await fetchCredits()
    setCredits(data)
  }

  if (!user || !credits) return null

  const quotaPercent = credits.quota > 0 ? (credits.used / credits.quota) * 100 : 0
  const isLow = credits.points < 3

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full 
            bg-white/10 hover:bg-white/15 
            transition-colors border border-white/10
            ${isLow ? "border-amber-500/50 bg-amber-500/10" : ""}
          `}
          aria-label={`Credits: ${credits.points}`}
        >
          <Sparkles className={`h-4 w-4 ${isLow ? "text-amber-400" : "text-cyan-400"}`} />
          <span className="text-sm font-medium text-slate-100">{credits.points}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] bg-slate-900 border-slate-700 p-4" align="end">
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-100">Credits</span>
              <span className="text-lg font-bold text-cyan-400">{credits.points}</span>
            </div>
            <p className="text-xs text-slate-400">
              This month: {credits.used}/{credits.quota} • Extra: {credits.extra}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Monthly Quota</span>
              <span>
                {credits.used}/{credits.quota}
              </span>
            </div>
            <Progress value={quotaPercent} className="h-1.5" />
          </div>

          {isLow && (
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-400">Credits running low, consider adding more</p>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-slate-700">
            <Button
              size="sm"
              className="w-full bg-cyan-600 hover:bg-cyan-700 gap-2"
              onClick={() => {
                setOpen(false)
                alert("Payment feature not yet enabled. Please contact support@example.com for manual processing.")
              }}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Buy Credits
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-full bg-slate-800 hover:bg-slate-700 gap-2"
              onClick={() => {
                setOpen(false)
                alert("Upgrade feature not yet enabled. Please contact support@example.com for manual processing.")
              }}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Upgrade Plan
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
