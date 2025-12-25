"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppHeader } from "@/components/rungait/app-header"
import { LocationForm } from "@/components/map/location-form"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SubmitLocationPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useI18n()

  if (!user) {
    router.push("/")
    return null
  }

  return (
    <div className="min-h-screen bg-[#0B0F12]">
      <AppHeader />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 text-slate-400 hover:text-slate-200">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100">{t("registerMyPlace")}</h1>
          <p className="text-slate-400 mt-2">登記您的跑步機場地，審核通過後若選擇開放將自動獲得 5 點數</p>
        </div>

        <LocationForm onSuccess={() => router.push("/dashboard")} />
      </div>
    </div>
  )
}
