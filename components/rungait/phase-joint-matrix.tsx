import type { Finding, GaitPhase, JointType } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PhaseJointMatrixProps {
  findings: Finding[]
}

const phaseOrder: GaitPhase[] = ["IC", "LR", "MS", "TS", "PSw", "ISw", "MidSw", "TSw"]
const jointLabels: Record<JointType, string> = {
  ankle: "Ankle",
  knee: "Knee",
  hip: "Hip",
  pelvisTilt: "Pelvis Tilt",
  pelvisDrop: "Pelvis Drop",
  trunkLean: "Trunk Lean",
  footProg: "Foot Prog",
}

export function PhaseJointMatrix({ findings }: PhaseJointMatrixProps) {
  const getFinding = (phase: GaitPhase, joint: JointType) => {
    return findings.find((f) => f.phase === phase && f.joint === joint)
  }

  const StatusIcon = ({ status }: { status: "normal" | "warning" | "abnormal" }) => {
    switch (status) {
      case "normal":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "abnormal":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  return (
    <TooltipProvider>
      <div className="rounded-xl border border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-800/50 hover:bg-slate-800/50">
              <TableHead className="text-slate-300 font-semibold">Joint</TableHead>
              {phaseOrder.map((phase) => (
                <TableHead key={phase} className="text-center text-slate-300 font-semibold">
                  {phase}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(jointLabels).map(([joint, label]) => (
              <TableRow key={joint} className="border-slate-700 hover:bg-slate-800/30">
                <TableCell className="font-medium text-slate-200">{label}</TableCell>
                {phaseOrder.map((phase) => {
                  const finding = getFinding(phase, joint as JointType)
                  return (
                    <TableCell key={phase} className="text-center">
                      {finding ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center justify-center gap-2">
                              <StatusIcon status={finding.status} />
                              <span className="text-sm text-slate-300">{finding.value}°</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-slate-800 border-slate-700">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{finding.description}</p>
                              <p className="text-xs text-slate-400">
                                Normal: {finding.normalRange.min}° to {finding.normalRange.max}°
                              </p>
                              {finding.citation && (
                                <p className="text-xs text-cyan-400">
                                  {finding.citation.author} ({finding.citation.year})
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
