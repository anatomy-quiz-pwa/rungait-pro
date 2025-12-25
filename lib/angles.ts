export type Pt = { x: number; y: number; z?: number; visibility?: number }

export function toVec(a: Pt, b: Pt) {
  return { x: b.x - a.x, y: b.y - a.y, z: (b.z ?? 0) - (a.z ?? 0) }
}

export function dot(u: any, v: any) {
  return u.x * v.x + u.y * v.y + (u.z ?? 0) * (v.z ?? 0)
}

export function norm(u: any) {
  return Math.sqrt(u.x * u.x + u.y * u.y + (u.z ?? 0) * (u.z ?? 0))
}

export function angleDeg(a: Pt, b: Pt, c: Pt) {
  const u = toVec(b, a)
  const v = toVec(b, c)
  const cos = Math.min(1, Math.max(-1, dot(u, v) / (norm(u) * norm(v) + 1e-8)))
  return (Math.acos(cos) * 180) / Math.PI
}

export function smooth(xs: number[], k = 2) {
  const result: number[] = []
  for (let i = 0; i < xs.length; i++) {
    const start = Math.max(0, i - k)
    const end = Math.min(xs.length, i + k + 1)
    const seg = xs.slice(start, end)
    result.push(seg.reduce((acc, val) => acc + val, 0) / seg.length)
  }
  return result
}


