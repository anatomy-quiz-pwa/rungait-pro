"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Map, Plus } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-provider"

export function MapTeaser() {
  const router = useRouter()
  const { t } = useI18n()

  return (
    <Card className="p-8 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-700/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <Map className="h-6 w-6 text-cyan-400" />
        </div>
        <h3 className="text-2xl font-bold text-slate-100">{t("runGaitMap")}</h3>
      </div>
      <p className="text-slate-300 mb-6 leading-relaxed">{t("mapTeaser")}</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => router.push("/map")} className="bg-cyan-600 hover:bg-cyan-700 gap-2">
          <Map className="h-4 w-4" />
          {t("browseMap")}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/map/submit")}
          className="border-slate-600 hover:bg-slate-800 gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("registerMyPlace")}
        </Button>
      </div>
    </Card>
  )
}
