import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react"
import type { GaitPhase } from "./phase-bar"

interface FindingCardProps {
  phase: GaitPhase
  finding: string
  confidence: number
  features: Array<{ name: string; value: string; reference: string }>
  status?: "OK" | "Warning" | "Risk"
}

const phaseLabels: Record<GaitPhase, string> = {
  IC: "Initial Contact",
  LR: "Loading Response",
  MS: "Mid Stance",
  TS: "Terminal Stance",
  PSw: "Pre-Swing",
  ISw: "Initial Swing",
  MidSw: "Mid Swing",
  TSw: "Terminal Swing",
}

export function FindingCard({ phase, finding, confidence, features, status = "OK" }: FindingCardProps) {
  const statusConfig = {
    OK: { icon: CheckCircle, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/20" },
    Warning: { icon: AlertTriangle, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/20" },
    Risk: { icon: AlertCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/20" },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{phaseLabels[phase]}</CardTitle>
              <Badge variant="outline" className="mt-1 font-mono text-xs">
                {phase}
              </Badge>
            </div>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {confidence}% confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{finding}</p>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Triggering Features</p>
          <div className="space-y-2">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm">
                <span className="font-medium">{feature.name}</span>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-900 dark:text-slate-50">{feature.value}</span>
                  <span className="text-slate-500 dark:text-slate-400">vs</span>
                  <span className="text-slate-500 dark:text-slate-400">{feature.reference}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

