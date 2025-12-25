export type Phase = "IC" | "LR" | "MSt" | "TSt" | "PSw" | "ISw" | "MSw" | "TSw"

export type FrameAngles = {
  t: number
  hip: number
  knee: number
  ankle: number
  side: "left" | "right"
  yAnkle: number
}

export function detectInitialContact(frames: FrameAngles[], fps: number) {
  const y = frames.map((f) => f.yAnkle)
  const vy = y.map((value, idx) => (idx ? (value - y[idx - 1]) * fps : 0))
  const indices: number[] = []
  for (let i = 2; i < y.length - 2; i++) {
    const isLocalMin = y[i] < y[i - 1] && y[i] <= y[i + 1]
    const zeroCrossing = vy[i - 1] < 0 && vy[i] >= 0
    if (isLocalMin && zeroCrossing) {
      if (!indices.length || i - indices[indices.length - 1] > fps * 0.3) indices.push(i)
    }
  }
  return indices
}

export function segmentPhases(frames: FrameAngles[], fps: number, side: "left" | "right") {
  const ic = detectInitialContact(frames, fps)
  const cuts = [0, 0.12, 0.31, 0.5, 0.62, 0.75, 0.87, 1]
  const names: Phase[] = ["IC", "LR", "MSt", "TSt", "PSw", "ISw", "MSw", "TSw"]

  const cycles = []
  for (let c = 0; c < ic.length - 1; c++) {
    const startIdx = ic[c]
    const endIdx = ic[c + 1]
    const len = endIdx - startIdx
    const phases = names.map((name, idx) => {
      const segStart = Math.round(startIdx + len * (idx === 0 ? 0 : cuts[idx - 1]))
      const segEnd = Math.round(startIdx + len * cuts[idx])
      return { name, startIdx: segStart, endIdx: segEnd }
    })
    cycles.push({ startIdx, endIdx, phases, side })
  }
  return cycles
}


