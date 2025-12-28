"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Map, Plus } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { useAuth } from "@/lib/auth-context"

export function MapTeaser() {
  const router = useRouter()
  const { t } = useI18n()
  const { user } = useAuth()

  const handleRegisterClick = () => {
    console.log('[MapTeaser] Register button clicked, user:', user ? 'logged in' : 'not logged in')
    
    if (!user) {
      // 如果未登入，先導向到首頁或登入頁面
      // 或者直接導向到註冊頁面，讓頁面自己處理認證檢查
      console.log('[MapTeaser] User not logged in, redirecting to /map/submit anyway')
    }
    
    try {
      router.push("/map/submit")
    } catch (error) {
      console.error('[MapTeaser] Navigation error:', error)
      // 如果 router.push 失敗，嘗試使用 window.location
      if (typeof window !== 'undefined') {
        window.location.href = '/map/submit'
      }
    }
  }

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
        <Button 
          onClick={() => {
            console.log('[MapTeaser] Browse Map button clicked')
            router.push("/map")
          }} 
          className="bg-cyan-600 hover:bg-cyan-700 gap-2"
        >
          <Map className="h-4 w-4" />
          {t("browseMap")}
        </Button>
        <Button
          variant="outline"
          onClick={handleRegisterClick}
          className="border-slate-600 hover:bg-slate-800 gap-2"
          type="button"
        >
          <Plus className="h-4 w-4" />
          {t("registerMyPlace")}
        </Button>
      </div>
    </Card>
  )
}
