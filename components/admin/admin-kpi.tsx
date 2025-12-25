import { Card } from "@/components/ui/card"
import { ArrowUp, ArrowDown, Activity } from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  linkHref?: string
}

export function AdminKPI({ title, value, subtitle, icon: Icon, trend, trendValue }: KPICardProps) {
  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-100">{value}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-lg bg-cyan-500/10">
          <Icon className="h-6 w-6 text-cyan-400" />
        </div>
      </div>

      {trend && trendValue && (
        <div className="mt-4 flex items-center gap-2">
          {trend === "up" && <ArrowUp className="h-4 w-4 text-green-400" />}
          {trend === "down" && <ArrowDown className="h-4 w-4 text-red-400" />}
          {trend === "neutral" && <Activity className="h-4 w-4 text-slate-400" />}
          <span
            className={cn(
              "text-sm font-medium",
              trend === "up" && "text-green-400",
              trend === "down" && "text-red-400",
              trend === "neutral" && "text-slate-400",
            )}
          >
            {trendValue}
          </span>
        </div>
      )}
    </Card>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
