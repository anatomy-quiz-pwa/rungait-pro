"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface TimelineRangeProps {
  duration: number
  startSec: number
  endSec: number
  onChange: (start: number, end: number) => void
  className?: string
}

export function TimelineRange({ duration, startSec, endSec, onChange, className }: TimelineRangeProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<"start" | "end" | "range" | null>(null)
  const [dragOffset, setDragOffset] = useState(0)

  const startPercent = (startSec / duration) * 100
  const endPercent = (endSec / duration) * 100

  const handleMouseDown = (type: "start" | "end" | "range", e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(type)

    if (type === "range" && trackRef.current) {
      const rect = trackRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const rangeStart = (startPercent / 100) * rect.width
      setDragOffset(clickX - rangeStart)
    }
  }

  useEffect(() => {
    if (!dragging || !trackRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = trackRef.current!.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const newTime = (x / rect.width) * duration

      if (dragging === "start") {
        const newStart = Math.max(0, Math.min(newTime, endSec - 1))
        onChange(newStart, endSec)
      } else if (dragging === "end") {
        const newEnd = Math.max(startSec + 1, Math.min(newTime, duration))
        onChange(startSec, newEnd)
      } else if (dragging === "range") {
        const rangeDuration = endSec - startSec
        const adjustedX = x - dragOffset
        const newStart = Math.max(0, Math.min((adjustedX / rect.width) * duration, duration - rangeDuration))
        const newEnd = newStart + rangeDuration
        onChange(newStart, newEnd)
      }
    }

    const handleMouseUp = () => {
      setDragging(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [dragging, startSec, endSec, duration, onChange, dragOffset])

  return (
    <div className={cn("relative h-16 bg-slate-800 rounded-lg overflow-hidden", className)}>
      <div ref={trackRef} className="absolute inset-0 cursor-pointer">
        <div className="absolute inset-y-0 left-0 right-0 bg-slate-700" />

        <div
          className="absolute inset-y-0 bg-cyan-500/30 border-l-2 border-r-2 border-cyan-400 cursor-move"
          style={{
            left: `${startPercent}%`,
            right: `${100 - endPercent}%`,
          }}
          onMouseDown={(e) => handleMouseDown("range", e)}
        >
          <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium pointer-events-none">
            {(endSec - startSec).toFixed(1)}s
          </div>
        </div>

        <div
          className="absolute top-0 bottom-0 w-3 -ml-1.5 bg-cyan-400 rounded cursor-ew-resize hover:bg-cyan-300 transition-colors z-10"
          style={{ left: `${startPercent}%` }}
          onMouseDown={(e) => handleMouseDown("start", e)}
        />

        <div
          className="absolute top-0 bottom-0 w-3 -mr-1.5 bg-cyan-400 rounded cursor-ew-resize hover:bg-cyan-300 transition-colors z-10"
          style={{ left: `${endPercent}%` }}
          onMouseDown={(e) => handleMouseDown("end", e)}
        />
      </div>

      <div className="absolute bottom-1 left-2 text-xs text-slate-400">0:00</div>
      <div className="absolute bottom-1 right-2 text-xs text-slate-400">{duration.toFixed(1)}s</div>
    </div>
  )
}
