"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/i18n-provider"
import type { AnalysisPacket, LiteratureNorm } from "@/lib/types"
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { ExternalLink } from "lucide-react"

interface NormsCompareProps {
  packet: AnalysisPacket
  norms: LiteratureNorm[]
}

export function NormsCompare({ packet, norms }: NormsCompareProps) {
  const { t } = useI18n()

  // Mock comparison data - in production, this would come from actual database queries
  const comparisonData = [
    {
      joint: "Ankle",
      userValue: 22,
      literatureMin: 15,
      literatureMax: 30,
      literatureMean: 22.5,
      cohortMean: 21.8,
    },
    {
      joint: "Knee",
      userValue: 45,
      literatureMin: 35,
      literatureMax: 55,
      literatureMean: 45,
      cohortMean: 44.2,
    },
    {
      joint: "Hip",
      userValue: 35,
      literatureMin: 25,
      literatureMax: 45,
      literatureMean: 35,
      cohortMean: 34.5,
    },
  ]

  // Mock literature reference
  const primaryReference = {
    author: "Novacheck et al.",
    year: 1998,
    doi: "10.1016/S0966-6362(98)00017-1",
  }

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-700 print:bg-white print:text-black print:border-gray-300">
      <h3 className="text-xl font-semibold mb-4 print:text-black">{t("dbCompare")}</h3>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="joint" stroke="#94a3b8" />
          <YAxis
            stroke="#94a3b8"
            label={{ value: "Degrees (°)", angle: -90, position: "insideLeft", fill: "#94a3b8" }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
            labelStyle={{ color: "#e2e8f0" }}
          />
          <Legend />

          {/* Literature range as bars */}
          <Bar dataKey="literatureMin" stackId="range" fill="#334155" name="Literature Min" />
          <Bar
            dataKey={(data) => data.literatureMax - data.literatureMin}
            stackId="range"
            fill="#475569"
            name="Normal Range"
          />

          {/* Literature and cohort means */}
          <Line
            type="monotone"
            dataKey="literatureMean"
            stroke="#06b6d4"
            strokeWidth={2}
            name="Literature Mean"
            dot={{ fill: "#06b6d4", r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="cohortMean"
            stroke="#8b5cf6"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Cohort Mean"
            dot={{ fill: "#8b5cf6", r: 4 }}
          />

          {/* User's actual value */}
          <Line
            type="monotone"
            dataKey="userValue"
            stroke="#10b981"
            strokeWidth={3}
            name="Your Value"
            dot={{ fill: "#10b981", r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-6 space-y-3 text-sm">
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <span className="font-medium text-slate-200 print:text-black">{t("similarAvg")} </span>
          <span className="text-slate-300 print:text-gray-700">
            Ankle 21.8°, Knee 44.2°, Hip 34.5° (n=127 runners, speed-matched cohort)
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-slate-200 print:text-black">{t("ref")} </span>
              <span className="text-slate-300 print:text-gray-700">
                {primaryReference.author} ({primaryReference.year})
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              onClick={() => window.open(`https://doi.org/${primaryReference.doi}`, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              DOI
            </Button>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-cyan-900/20 border border-cyan-700/30">
          <p className="text-sm text-cyan-300">{t("backToCourse")}</p>
        </div>
      </div>
    </Card>
  )
}
