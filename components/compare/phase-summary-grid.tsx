import type { GaitPhase, JointType } from "@/lib/types"
import type { PhaseStats } from "@/lib/phase"
import { JOINT_LABELS } from "@/lib/phase"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PhaseSummaryGridProps {
  phases: GaitPhase[]
  stats: Record<GaitPhase, { after: PhaseStats; before: PhaseStats }>
  activeJoint: JointType
  norms?: Record<GaitPhase, { min: number; max: number }>
}

export function PhaseSummaryGrid({ phases, stats, activeJoint, norms }: PhaseSummaryGridProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-100">Per-Phase Summary — {JOINT_LABELS[activeJoint]}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {phases.map((phase) => {
          const phaseStat = stats[phase]
          if (!phaseStat) return null

          const norm = norms?.[phase]
          const afterMean = phaseStat.after.mean
          const beforeMean = phaseStat.before.mean
          const improvement = beforeMean - afterMean

          return (
            <Card key={phase} className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">{phase}</Badge>
                {improvement !== 0 && (
                  <Badge
                    variant="outline"
                    className={
                      improvement > 0 ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"
                    }
                  >
                    {improvement > 0 ? "↓" : "↑"} {Math.abs(improvement).toFixed(1)}°
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-slate-400">After</div>
                  <div className="text-slate-200 font-medium">
                    Mean: {afterMean.toFixed(1)}° · Peak: {phaseStat.after.peak.toFixed(1)}°
                  </div>
                </div>

                <div>
                  <div className="text-slate-400">Before</div>
                  <div className="text-slate-200 font-medium">
                    Mean: {beforeMean.toFixed(1)}° · Peak: {phaseStat.before.peak.toFixed(1)}°
                  </div>
                </div>

                {norm && (
                  <div className="pt-2 border-t border-slate-700">
                    <div className="text-slate-400 text-xs">
                      Normal: {norm.min}° – {norm.max}°
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
