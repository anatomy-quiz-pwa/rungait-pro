"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import type { GaitPhase, JointType, EvidenceLevel } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const phaseLabels: Record<GaitPhase, string> = {
  IC: "IC",
  LR: "LR",
  MS: "MS",
  TS: "TS",
  PSw: "PSw",
  ISw: "ISw",
  MidSw: "MidSw",
  TSw: "TSw",
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

interface EvidenceFiltersProps {
  phases: GaitPhase[]
  joints: JointType[]
  evidenceLevel: EvidenceLevel | "all"
  searchQuery: string
  onPhasesChange: (phases: GaitPhase[]) => void
  onJointsChange: (joints: JointType[]) => void
  onEvidenceLevelChange: (level: EvidenceLevel | "all") => void
  onSearchChange: (query: string) => void
}

export function EvidenceFilters({
  phases,
  joints,
  evidenceLevel,
  searchQuery,
  onPhasesChange,
  onJointsChange,
  onEvidenceLevelChange,
  onSearchChange,
}: EvidenceFiltersProps) {
  const allPhases: GaitPhase[] = ["IC", "LR", "MS", "TS", "PSw", "ISw", "MidSw", "TSw"]
  const allJoints: JointType[] = ["ankle", "knee", "hip", "pelvisTilt", "pelvisDrop", "trunkLean", "footProg"]

  const togglePhase = (phase: GaitPhase) => {
    if (phases.includes(phase)) {
      onPhasesChange(phases.filter((p) => p !== phase))
    } else {
      onPhasesChange([...phases, phase])
    }
  }

  const toggleJoint = (joint: JointType) => {
    if (joints.includes(joint)) {
      onJointsChange(joints.filter((j) => j !== joint))
    } else {
      onJointsChange([...joints, joint])
    }
  }

  return (
    <div className="space-y-4 p-4 bg-slate-900/30 rounded-lg border border-slate-700">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Author, year, DOI..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Evidence Level</Label>
          <Select
            value={evidenceLevel}
            onValueChange={(value) => onEvidenceLevelChange(value as EvidenceLevel | "all")}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="consensus">Consensus</SelectItem>
              <SelectItem value="systematic">Systematic Review</SelectItem>
              <SelectItem value="clinical">Clinical Study</SelectItem>
              <SelectItem value="single-study">Single Study</SelectItem>
              <SelectItem value="expert-opinion">Expert Opinion</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Filter by Phase</Label>
        <div className="flex flex-wrap gap-2">
          {allPhases.map((phase) => (
            <Badge
              key={phase}
              onClick={() => togglePhase(phase)}
              className={
                phases.includes(phase)
                  ? "cursor-pointer bg-cyan-500 text-white border-cyan-400 hover:bg-cyan-600"
                  : "cursor-pointer bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
              }
            >
              {phaseLabels[phase]}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Filter by Joint</Label>
        <div className="flex flex-wrap gap-2">
          {allJoints.map((joint) => (
            <Badge
              key={joint}
              onClick={() => toggleJoint(joint)}
              className={
                joints.includes(joint)
                  ? "cursor-pointer bg-cyan-500 text-white border-cyan-400 hover:bg-cyan-600"
                  : "cursor-pointer bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
              }
            >
              {jointLabels[joint]}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
