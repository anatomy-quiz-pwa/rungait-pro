"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { listMyAnalyses } from "@/lib/usage"
import type { AnalysisRow } from "@/lib/types"
import { FileText, Calendar, Gauge, TrendingUp, Upload } from "lucide-react"
import Image from "next/image"

export function AnalysesList() {
  const router = useRouter()
  const { t } = useI18n()
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalyses()
  }, [])

  const loadAnalyses = async () => {
    const data = await listMyAnalyses()
    setAnalyses(data)
    setLoading(false)
  }

  if (loading) {
    return <div className="text-slate-400">{t("loading")}...</div>
  }

  if (analyses.length === 0) {
    return (
      <Card className="p-12 bg-slate-900/30 border-slate-700 text-center">
        <Upload className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-300 mb-2">尚無分析</h3>
        <p className="text-slate-500 mb-4">開始上傳您的第一支影片</p>
        <Button className="bg-cyan-500 hover:bg-cyan-600" onClick={() => router.push("/analyze")}>
          <Upload className="h-4 w-4 mr-2" />
          {t("uploadVideo")}
        </Button>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {analyses.map((analysis) => (
        <Card
          key={analysis.id}
          className="p-4 bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-colors"
        >
          <div className="aspect-video bg-slate-800 rounded-lg mb-3 overflow-hidden relative">
            <Image
              src={analysis.video_url || "/running-analysis-thumbnail.jpg"}
              alt="Analysis thumbnail"
              fill
              className="object-cover"
            />
            <Badge className="absolute top-2 right-2 bg-cyan-500/90 text-white border-0">#{analysis.id}</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              {analysis.speed_kph && (
                <div className="flex items-center gap-1 text-slate-400">
                  <Gauge className="h-3.5 w-3.5" />
                  <span>{analysis.speed_kph.toFixed(1)} km/h</span>
                </div>
              )}
              {analysis.cadence_spm && (
                <div className="flex items-center gap-1 text-slate-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>{analysis.cadence_spm} spm</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700"
              onClick={() => router.push(`/report/${analysis.id}`)}
            >
              <FileText className="h-4 w-4 mr-2" />
              {t("openReport")}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
