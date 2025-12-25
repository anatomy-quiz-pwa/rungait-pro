"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { UploadVideoButton } from "@/components/upload/upload-video-button"

export function HeroCTA() {
  const router = useRouter()
  const { t } = useI18n()

  return (
    <div className="flex flex-col items-center gap-4 mb-12">
      <div className="flex flex-col sm:flex-row gap-4">
        <UploadVideoButton label={t("loginUpload")} />

        <Button
          size="lg"
          variant="outline"
          onClick={() => router.push("/map")}
          className="border-cyan-600 text-cyan-400 hover:bg-cyan-600/10 text-lg px-8 py-6 gap-3"
        >
          <MapPin className="h-5 w-5" />
          {t("findTreadmill")}
        </Button>
      </div>
    </div>
  )
}
