"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { myLocations } from "@/lib/map"
import type { LocationRow } from "@/lib/types"
import { MapPin, Plus, Clock, CheckCircle, XCircle } from "lucide-react"

export function MyLocations() {
  const router = useRouter()
  const { t } = useI18n()
  const [locations, setLocations] = useState<LocationRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    const data = await myLocations()
    setLocations(data)
    setLoading(false)
  }

  if (loading) {
    return <div className="text-slate-400">{t("loading")}...</div>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t("approved")}
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            {t("rejected")}
          </Badge>
        )
      default:
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            {t("pending")}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-100">{t("myLocations")}</h3>
        <Button onClick={() => router.push("/map/submit")} className="bg-cyan-600 hover:bg-cyan-700 gap-2">
          <Plus className="h-4 w-4" />
          {t("registerMyPlace")}
        </Button>
      </div>

      {locations.length === 0 ? (
        <Card className="p-8 bg-slate-900/30 border-slate-700 text-center">
          <MapPin className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">尚未登記任何場地</p>
          <Button onClick={() => router.push("/map/submit")} className="bg-cyan-600 hover:bg-cyan-700">
            {t("registerMyPlace")}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <Card key={location.id} className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-slate-100">{location.name}</h4>
                {getStatusBadge(location.status)}
              </div>
              {location.city && <p className="text-sm text-slate-400 mb-1">{location.city}</p>}
              {location.allow_public && (
                <Badge variant="outline" className="text-xs border-emerald-600 text-emerald-400">
                  公開場地
                </Badge>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
