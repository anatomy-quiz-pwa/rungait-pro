"use client"

import type { GaitPhase, PhaseData } from "@/lib/types"
import { cn } from "@/lib/utils"

interface PhaseBarProps {
  phases: PhaseData[]
  currentPhase?: GaitPhase
  onPhaseClick?: (phase: GaitPhase) => void
}

const phaseColors: Record<GaitPhase, string> = {
  IC: "bg-cyan-500",
  LR: "bg-blue-500",
  MS: "bg-indigo-500",
  TS: "bg-purple-500",
  PSw: "bg-pink-500",
  ISw: "bg-rose-500",
  MidSw: "bg-orange-500",
  TSw: "bg-amber-500",
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

export function PhaseBar({ phases, currentPhase, onPhaseClick }: PhaseBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {phases.map((phaseData) => (
          <button
            key={phaseData.phase}
            onClick={() => onPhaseClick?.(phaseData.phase)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              "hover:scale-105 hover:shadow-lg",
              phaseColors[phaseData.phase],
              currentPhase === phaseData.phase ? "ring-2 ring-white ring-offset-2 ring-offset-[#0B0F12]" : "opacity-70",
            )}
          >
            {phaseData.phase}
          </button>
        ))}
      </div>

      {currentPhase && (
        <div className="text-sm text-slate-400">
          <span className="font-medium text-slate-200">{phaseLabels[currentPhase]}</span>
          {" · "}
          <span>
            {phases.find((p) => p.phase === currentPhase)?.startPercent}% -{" "}
            {phases.find((p) => p.phase === currentPhase)?.endPercent}% of gait cycle
          </span>
        </div>
      )}
    </div>
  )
}
