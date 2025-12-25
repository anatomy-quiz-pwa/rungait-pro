"use client"

import { Card } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function AnalyticsCharts() {
  const { t } = useI18n()

  // Mock data
  const dailyUploads = [
    { date: "01/01", count: 5 },
    { date: "01/02", count: 8 },
    { date: "01/03", count: 12 },
    { date: "01/04", count: 7 },
    { date: "01/05", count: 15 },
  ]

  const salesStats = [
    { date: "12月", amount: 5000 },
    { date: "1月", amount: 8500 },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 bg-slate-900/50 border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">{t("dailyUploads")}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={dailyUploads}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
            <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6 bg-slate-900/50 border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">{t("salesStats")}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={salesStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} />
            <Bar dataKey="amount" fill="#06b6d4" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
