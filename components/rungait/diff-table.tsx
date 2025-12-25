import type { AnalysisPacket, JointType } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUp, ArrowDown, Minus, CheckCircle2 } from "lucide-react"

interface DiffTableProps {
  beforeAnalysis: AnalysisPacket
  afterAnalysis: AnalysisPacket
}

const jointLabels: Record<JointType, string> = {
  ankle: "Ankle",
  knee: "Knee",
  hip: "Hip",
  pelvisTilt: "Pelvis Tilt",
  pelvisDrop: "Pelvis Drop",
  trunkLean: "Trunk Lean",
  footProg: "Foot Progression",
}

export function DiffTable({ beforeAnalysis, afterAnalysis }: DiffTableProps) {
  const calculateAverage = (jointData: any) => {
    const sum = jointData.angles.reduce((acc: number, point: any) => acc + point.angle, 0)
    return (sum / jointData.angles.length).toFixed(1)
  }

  const getEvaluation = (delta: number, normalRange: { min: number; max: number }) => {
    if (Math.abs(delta) < 2) return { status: "minimal", icon: Minus, color: "text-slate-400" }
    if (delta < 0) return { status: "improved", icon: CheckCircle2, color: "text-green-500" }
    if (delta > 0) return { status: "increased", icon: ArrowUp, color: "text-amber-500" }
    return { status: "minimal", icon: Minus, color: "text-slate-400" }
  }

  const rows = beforeAnalysis.joints
    .map((beforeJoint) => {
      const afterJoint = afterAnalysis.joints.find((j) => j.joint === beforeJoint.joint)
      if (!afterJoint) return null

      const beforeAvg = Number.parseFloat(calculateAverage(beforeJoint))
      const afterAvg = Number.parseFloat(calculateAverage(afterJoint))
      const delta = afterAvg - beforeAvg
      const evaluation = getEvaluation(delta, beforeJoint.normalRange)

      return {
        joint: beforeJoint.joint,
        before: beforeAvg,
        after: afterAvg,
        delta,
        normalRange: beforeJoint.normalRange,
        evaluation,
      }
    })
    .filter(Boolean)

  return (
    <div className="rounded-xl border border-slate-700 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
            <TableHead className="text-slate-300 font-semibold">Joint</TableHead>
            <TableHead className="text-center text-slate-300 font-semibold">Before</TableHead>
            <TableHead className="text-center text-slate-300 font-semibold">After</TableHead>
            <TableHead className="text-center text-slate-300 font-semibold">Change (Δ)</TableHead>
            <TableHead className="text-center text-slate-300 font-semibold">Normal Range</TableHead>
            <TableHead className="text-center text-slate-300 font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            if (!row) return null
            const Icon = row.evaluation.icon
            return (
              <TableRow key={row.joint} className="border-slate-700 hover:bg-slate-800/30">
                <TableCell className="font-medium text-slate-200">{jointLabels[row.joint]}</TableCell>
                <TableCell className="text-center text-red-400 font-mono">{row.before}°</TableCell>
                <TableCell className="text-center text-cyan-400 font-mono">{row.after}°</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {row.delta > 0 ? (
                      <ArrowUp className="h-4 w-4 text-amber-400" />
                    ) : row.delta < 0 ? (
                      <ArrowDown className="h-4 w-4 text-green-400" />
                    ) : (
                      <Minus className="h-4 w-4 text-slate-400" />
                    )}
                    <span className={`font-mono ${row.evaluation.color}`}>
                      {row.delta > 0 ? "+" : ""}
                      {row.delta.toFixed(1)}°
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center text-slate-400 text-sm">
                  {row.normalRange.min}° to {row.normalRange.max}°
                </TableCell>
                <TableCell className="text-center">
                  <Icon className={`h-5 w-5 mx-auto ${row.evaluation.color}`} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
