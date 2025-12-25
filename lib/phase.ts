import type { GaitPhase, JointType, PhaseData } from "@/lib/types"

export type PhaseWindow = { start: number; end: number }

export const PHASES: GaitPhase[] = ["IC", "LR", "MS", "TS", "PSw", "ISw", "MidSw", "TSw"]

export const JOINT_LABELS: Record<JointType, string> = {
  ankle: "Ankle",
  knee: "Knee",
  hip: "Hip",
  pelvisTilt: "Pelvis Tilt",
  pelvisDrop: "Pelvis Drop",
  trunkLean: "Trunk Lean",
  footProg: "Foot Progression",
}

export function getPhaseWindows(phases: PhaseData[]): Record<GaitPhase, PhaseWindow> {
  const windows: Partial<Record<GaitPhase, PhaseWindow>> = {}

  phases.forEach((phase, index) => {
    const nextPhase = phases[index + 1]
    windows[phase.phase] = {
      start: phase.startPercent,
      end: nextPhase ? nextPhase.startPercent : 100,
    }
  })

  // Fill missing phases with zero windows
  PHASES.forEach((ph) => {
    if (!windows[ph]) {
      windows[ph] = { start: 0, end: 0 }
    }
  })

  return windows as Record<GaitPhase, PhaseWindow>
}

export function sliceSeries<T extends { percent: number }>(arr: T[], win: PhaseWindow): T[] {
  return arr.filter((s) => s.percent >= win.start && s.percent <= win.end)
}

export interface PhaseStats {
  min: number
  max: number
  mean: number
  peak: number
  range: number
}

export function basicStats(values: number[]): PhaseStats {
  if (!values.length) {
    return { min: Number.NaN, max: Number.NaN, mean: Number.NaN, peak: Number.NaN, range: Number.NaN }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const peak = Math.abs(min) > Math.abs(max) ? min : max
  const range = max - min

  return { min, max, mean, peak, range }
}
