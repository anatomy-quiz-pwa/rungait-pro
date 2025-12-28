"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AppHeader } from "@/components/rungait/app-header"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GooglePlaceSearch } from "@/components/map/google-place-search"
import { ManualLocationForm } from "@/components/map/manual-location-form"
import { useEffect } from "react"

export default function SubmitPageClient() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useI18n()

  useEffect(() => {
    if (!user) {
      console.log('[SubmitPageClient] User not logged in, redirecting to home')
      // 延遲一下再重定向，讓用戶看到提示
      const timer = setTimeout(() => {
        router.push("/")
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0F12] flex items-center justify-center">
        <div className="text-center text-slate-400">
          <p>請先登入以註冊場地...</p>
          <p className="text-sm mt-2">正在導向到首頁...</p>
        </div>
      </div>
    )
  }

  const handleSuccess = () => {
    router.push("/map")
  }

  return (
    <div className="min-h-screen bg-[#0B0F12]">
      <AppHeader />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-4 text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100">{t("registerMyPlace")}</h1>
          <p className="text-slate-400 mt-2">
            登記您的跑步機場地，審核通過後若選擇開放將自動獲得 5 點數
          </p>
        </div>

        <Tabs defaultValue="google" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900/50">
            <TabsTrigger value="google">搜尋 Google 商家</TabsTrigger>
            <TabsTrigger value="manual">手動新增（地圖選點）</TabsTrigger>
          </TabsList>
          
          <TabsContent value="google" className="mt-6">
            <GooglePlaceSearch onSuccess={handleSuccess} />
          </TabsContent>
          
          <TabsContent value="manual" className="mt-6">
            <ManualLocationForm onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

