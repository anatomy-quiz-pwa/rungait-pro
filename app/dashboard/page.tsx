"use client"

// 強制動態渲染，避免 SSR 問題
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useState, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/rungait/app-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { getMockAnalyses } from "@/lib/mock-data"
import { AnalysesList } from "@/components/dashboard/analyses-list"

// 直接 import，但確保在 useEffect 中使用
import { fetchCredits } from "@/lib/usage"

// 動態載入 MyLocations 以避免 SSR 問題
const MyLocations = dynamic(() => import("@/components/dashboard/my-locations").then(mod => ({ default: mod.MyLocations })), {
  ssr: false
})
import {
  BarChart3,
  Clock,
  CreditCard,
  FileText,
  Filter,
  TrendingUp,
  Upload,
  Calendar,
  Gauge,
  ShoppingCart,
} from "lucide-react"
import Image from "next/image"

export default function DashboardPage() {
  const { user, billingInfo } = useAuth()
  const { t } = useI18n()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [speedFilter, setSpeedFilter] = useState<[number, number]>([0, 20])
  const [credits, setCredits] = useState<{ balance: number } | null>(null)

  const analyses = getMockAnalyses()

  useEffect(() => {
    if (user) {
      loadCredits()
    }
  }, [user, billingInfo])

  const loadCredits = async () => {
    // 確保只在瀏覽器環境執行
    if (typeof window === 'undefined') return
    
    try {
      const data = await fetchCredits()
      setCredits({ balance: data.points || 0 })
    } catch (error) {
      console.error('Failed to load credits:', error)
      setCredits({ balance: 0 })
    }
  }

  const filteredAnalyses = useMemo(() => {
    return analyses.filter((analysis) => {
      if (searchQuery && !analysis.footwear.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      const speedKph = analysis.speed * 3.6
      if (speedKph < speedFilter[0] || speedKph > speedFilter[1]) {
        return false
      }
      return true
    })
  }, [analyses, searchQuery, speedFilter])

  if (!user) {
    router.push("/")
    return null
  }

  const quotaPercent = billingInfo
    ? (billingInfo.used_count / (billingInfo.monthly_quota + billingInfo.credits_extra)) * 100
    : 0

  const lastAnalysis = analyses[0]

  return (
    <div className="min-h-screen bg-[#0B0F12]">
      <AppHeader />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Card with Credits Display */}
        <Card className="p-6 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-700/30 mb-8">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">
            {t("welcome")}, {user.email}!
          </h2>
          <p className="text-slate-300 mb-4">
            {t("youHave")} <span className="text-cyan-400 font-bold text-2xl">{credits?.balance ?? 0}</span>{" "}
            {t("points")}。{t("eachAnalysis")} <span className="font-semibold">5</span> {t("points")}。
          </p>
          <div className="flex gap-3">
            <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2" onClick={() => router.push("/analyze")}>
              <Upload className="h-4 w-4" />
              {t("uploadVideo")}
            </Button>
            <Button
              variant="outline"
              className="border-slate-600 hover:bg-slate-800 gap-2 bg-transparent"
              onClick={() => alert("購買點數功能尚未啟用")}
            >
              <ShoppingCart className="h-4 w-4" />
              {t("buyCredits")}
            </Button>
          </div>
        </Card>

        {/* My Analyses Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-100 mb-4">{t("myAnalyses")}</h2>
          <AnalysesList />
        </div>

        {/* My Locations Section */}
        <div className="mb-12">
          <MyLocations />
        </div>

        {/* Usage Card */}
        <Card className="p-6 bg-slate-900/50 border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">{t("thisMonthUsage")}</h3>
              <p className="text-sm text-slate-400">
                {billingInfo?.used_count || 0} / {(billingInfo?.monthly_quota || 0) + (billingInfo?.credits_extra || 0)}
              </p>
            </div>
          </div>
          <Progress value={quotaPercent} className="h-2 mb-2" />
          <p className="text-xs text-slate-400">
            {billingInfo?.remaining || 0} {t("remaining")}
          </p>
        </Card>

        {/* Plan Card */}
        <Card className="p-6 bg-slate-900/50 border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">{t("plan")}</h3>
              <p className="text-sm text-slate-400">{user.plan_id || "Free"}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700"
            onClick={() => alert("升級方案功能尚未啟用，請聯繫 support@example.com")}
          >
            {t("upgradePlan")}
          </Button>
        </Card>

        {/* Last Analysis Card */}
        <Card className="p-6 bg-slate-900/50 border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">{t("lastAnalysis")}</h3>
              <p className="text-sm text-slate-400">
                {lastAnalysis ? new Date(lastAnalysis.createdAt).toLocaleDateString() : "N/A"}
              </p>
            </div>
          </div>
          {lastAnalysis && (
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700"
              onClick={() => router.push(`/report/${lastAnalysis.id}`)}
            >
              {t("openReport")}
            </Button>
          )}
        </Card>

        {/* History Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-100">{t("uploadHistory")}</h2>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <Input
                  placeholder={t("search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 bg-slate-900 border-slate-700 text-slate-100"
                />
              </div>
            </div>

            {filteredAnalyses.length === 0 ? (
              <Card className="p-12 bg-slate-900/30 border-slate-700 text-center">
                <Upload className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">{t("noAnalyses")}</h3>
                <p className="text-slate-500 mb-4">{t("startByUploading")}</p>
                <Button className="bg-cyan-500 hover:bg-cyan-600">
                  <Upload className="h-4 w-4 mr-2" />
                  {t("uploadVideo")}
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAnalyses.map((analysis) => (
                  <Card
                    key={analysis.id}
                    className="p-4 bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="aspect-video bg-slate-800 rounded-lg mb-3 overflow-hidden relative">
                      <Image
                        src={analysis.thumbnailUrl || "/running-analysis-thumbnail.jpg"}
                        alt="Analysis thumbnail"
                        fill
                        className="object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-cyan-500/90 text-white border-0">
                        #{analysis.id}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Gauge className="h-3.5 w-3.5" />
                          <span>{(analysis.speed * 3.6).toFixed(1)} km/h</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span>{analysis.cadence} spm</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{new Date(analysis.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500">{analysis.footwear}</p>

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
            )}
          </div>

          {/* Billing Box */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-slate-900/50 border-slate-700 sticky top-20">
              <h3 className="text-xl font-semibold text-slate-100 mb-4">{t("billingDetails")}</h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{t("plan")}</span>
                  <span className="text-slate-100 font-medium">{user.plan_id || "Free"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{t("monthlyQuota")}</span>
                  <span className="text-slate-100 font-medium">{billingInfo?.monthly_quota || 3}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{t("extraCredits")}</span>
                  <span className="text-slate-100 font-medium">{billingInfo?.credits_extra || 0}</span>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">Usage</span>
                    <span className="text-sm text-slate-400">
                      {billingInfo?.used_count || 0} /{" "}
                      {(billingInfo?.monthly_quota || 0) + (billingInfo?.credits_extra || 0)}
                    </span>
                  </div>
                  <Progress value={quotaPercent} className="h-2" />
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700" onClick={() => alert("升級方案功能尚未啟用")}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {t("upgradePlan")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700"
                  onClick={() => alert("購買點數功能尚未啟用")}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {t("buyCredits")}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
