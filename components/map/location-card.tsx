"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Upload, Award } from "lucide-react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/i18n-provider"
import type { LocationRow } from "@/lib/types"
import Image from "next/image"

interface LocationCardProps {
  location: LocationRow
}

export function LocationCard({ location }: LocationCardProps) {
  const router = useRouter()
  const { t } = useI18n()

  return (
    <Card className="p-4 bg-slate-900/50 border-slate-700 hover:border-cyan-500/30 transition-all">
      {location.photo_urls && location.photo_urls.length > 0 && (
        <div className="aspect-video bg-slate-800 rounded-lg mb-3 overflow-hidden relative">
          <Image src={location.photo_urls[0] || "/placeholder.svg"} alt={location.name} fill className="object-cover" />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-100">{location.name}</h3>
          {location.allow_public && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
              <Award className="h-3 w-3" />
              {t("freeSite")}
            </Badge>
          )}
        </div>

        {location.city && (
          <div className="flex items-center gap-1 text-sm text-slate-400">
            <MapPin className="h-3.5 w-3.5" />
            <span>{location.city}</span>
          </div>
        )}

        {location.address && <p className="text-xs text-slate-500">{location.address}</p>}

        {location.treadmill_type && (
          <Badge variant="outline" className="text-xs border-slate-600">
            {location.treadmill_type}
          </Badge>
        )}

        {location.contact && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Phone className="h-3 w-3" />
            <span>{location.contact}</span>
          </div>
        )}

        <Button
          size="sm"
          className="w-full bg-cyan-600 hover:bg-cyan-700 gap-2 mt-3"
          onClick={() => router.push("/analyze")}
        >
          <Upload className="h-3.5 w-3.5" />
          {t("goToUpload")}
        </Button>
      </div>
    </Card>
  )
}
