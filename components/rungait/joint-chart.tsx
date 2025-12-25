"use client"

import type { JointData, JointType } from "@/lib/types"
import type { PhaseWindow } from "@/lib/phase"
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceArea,
} from "recharts"

interface JointChartProps {
  jointData: JointData
  compareData?: JointData
  phaseWindow?: PhaseWindow
  phaseLabel?: string
}

const jointLabels: Record<JointType, string> = {
  ankle: "Ankle Angle",
  knee: "Knee Angle",
  hip: "Hip Angle",
  pelvisTilt: "Pelvis Tilt",
  pelvisDrop: "Pelvis Drop",
  trunkLean: "Trunk Lean",
  footProg: "Foot Progression",
}

export function JointChart({ jointData, compareData, phaseWindow, phaseLabel }: JointChartProps) {
  const data = jointData.angles.map((point, idx) => ({
    percent: point.percent,
    angle: point.angle,
    compareAngle: compareData?.angles[idx]?.angle,
    normalMin: jointData.normalRange.min,
    normalMax: jointData.normalRange.max,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">{jointLabels[jointData.joint]}</h3>
          {phaseLabel && (
            <p className="text-sm text-slate-400 mt-1">
              Phase: {phaseLabel} — Joint: {jointLabels[jointData.joint]}
            </p>
          )}
        </div>
        <div className="text-sm text-slate-400">
          Normal range: {jointData.normalRange.min}° to {jointData.normalRange.max}°
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="normalRange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="percent"
            label={{ value: "Gait Cycle (%)", position: "insideBottom", offset: -5, fill: "#94a3b8" }}
            stroke="#475569"
            tick={{ fill: "#94a3b8" }}
          />
          <YAxis
            label={{ value: "Angle (°)", angle: -90, position: "insideLeft", fill: "#94a3b8" }}
            stroke="#475569"
            tick={{ fill: "#94a3b8" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#f1f5f9",
            }}
          />
          {phaseWindow && (
            <ReferenceArea
              x1={phaseWindow.start}
              x2={phaseWindow.end}
              fill="#06b6d4"
              fillOpacity={0.15}
              stroke="#06b6d4"
              strokeOpacity={0.3}
            />
          )}
          <Area type="monotone" dataKey="normalMax" stroke="none" fill="url(#normalRange)" fillOpacity={1} />
          <Area type="monotone" dataKey="normalMin" stroke="none" fill="#0B0F12" fillOpacity={1} />
          <Line type="monotone" dataKey="angle" stroke="#06b6d4" strokeWidth={2} dot={false} name="Current" />
          {compareData && (
            <Line
              type="monotone"
              dataKey="compareAngle"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
              name="Before"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-cyan-500" />
          <span className="text-slate-300">{compareData ? "After" : "Current"}</span>
        </div>
        {compareData && (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-0.5 bg-red-500"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, #ef4444 0, #ef4444 5px, transparent 5px, transparent 10px)",
              }}
            />
            <span className="text-slate-300">Before</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-6 h-3 bg-cyan-500 opacity-10 border border-cyan-500 border-opacity-20" />
          <span className="text-slate-400">Normal Range</span>
        </div>
      </div>
    </div>
  )
}
