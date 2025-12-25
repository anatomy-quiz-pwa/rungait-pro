"use client"

import { AppHeader } from "@/components/rungait/app-header"
import { VideoTrimEditor } from "@/components/trim/video-trim-editor"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard } from "lucide-react"

export default function TrimPage() {
  const { t } = useI18n()
  const { user, billingInfo } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  if (!user) {
    return null
  }

  const availableCredits = billingInfo?.remaining || 0

  return (
    <div className="min-h-screen bg-[#0B0F12] text-slate-100">
      <AppHeader />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-slate-100">{t("trimTitle")}</h1>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700">
              <CreditCard className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-slate-300">
                {t("needCredits")} ({availableCredits} {t("remaining")})
              </span>
            </div>
          </div>

          <Alert className="bg-blue-500/10 border-blue-500/20 mt-4">
            <AlertDescription className="text-blue-300 text-sm">
              <p className="mb-1">{t("clipHint1")}</p>
              <p>{t("clipHint2")}</p>
            </AlertDescription>
          </Alert>
        </div>

        <VideoTrimEditor />
      </div>
    </div>
  )
}
