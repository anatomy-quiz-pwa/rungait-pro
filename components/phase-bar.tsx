"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type GaitPhase = "IC" | "LR" | "MS" | "TS" | "PSw" | "ISw" | "MidSw" | "TSw"

interface PhaseBarProps {
  currentPhase?: GaitPhase
  onPhaseClick?: (phase: GaitPhase) => void
  className?: string
}

const phases: GaitPhase[] = ["IC", "LR", "MS", "TS", "PSw", "ISw", "MidSw", "TSw"]

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

export function PhaseBar({ currentPhase, onPhaseClick, className }: PhaseBarProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {phases.map((phase) => (
        <Button
          key={phase}
          variant={currentPhase === phase ? "default" : "outline"}
          size="sm"
          onClick={() => onPhaseClick?.(phase)}
          className={cn("font-mono text-xs", currentPhase === phase && "bg-primary text-primary-foreground")}
          title={phaseLabels[phase]}
        >
          {phase}
        </Button>
      ))}
    </div>
  )
}

