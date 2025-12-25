"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Activity, BarChart3, FileText, Library } from "lucide-react"
import { FeatureCard } from "@/components/home/feature-card"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { useState } from "react"
import { HeroCTA } from "@/components/home/hero-cta"
import { MapTeaser } from "@/components/home/map-teaser"
import { getHealth } from "@/lib/api"

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useI18n()
  const [healthResult, setHealthResult] = useState<string>("尚未測試")
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)

  const handleHealthCheck = async () => {
    try {
      setIsCheckingHealth(true)
      const data = await getHealth()
      setHealthResult(`OK: ${data.ok}, ts=${data.ts}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      setHealthResult(`ERROR: ${message}`)
    } finally {
      setIsCheckingHealth(false)
    }
  }

  const features = [
    {
      icon: Activity,
      title: "Single Analysis",
      description: "Upload and analyze a single running video with detailed biomechanical assessment",
      action: () => router.push("/analyze"),
      color: "cyan",
    },
    {
      icon: BarChart3,
      title: "Before/After Comparison",
      description: "Compare two analyses to track progress and measure improvements over time",
      action: () => router.push("/compare"),
      color: "blue",
    },
    {
      icon: FileText,
      title: "Clinical Reports",
      description: "Generate print-friendly clinical reports with findings and recommendations",
      action: () => router.push("/report/1"),
      color: "purple",
    },
    {
      icon: Library,
      title: "Analysis Library",
      description: "Browse and manage your saved gait analyses in one organized place",
      action: () => router.push("/library"),
      color: "pink",
    },
  ]

  return (
    <div className="min-h-screen bg-[#0B0F12] text-slate-100">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-balance">Running Gait Analysis</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto text-pretty mb-8">
            Clinical-grade biomechanical assessment for coaches, clinicians, and athletes
          </p>

          <HeroCTA />

          <div className="mt-6 flex flex-col items-center gap-3">
            <Button
              onClick={handleHealthCheck}
              disabled={isCheckingHealth}
              className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
            >
              {isCheckingHealth ? "檢查中..." : "測試後端 /api/health"}
            </Button>
            <p className="text-sm text-slate-400">結果：{healthResult}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card
                key={feature.title}
                className="p-6 bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer group"
                onClick={feature.action}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                    <Icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                    <Button
                      variant="ghost"
                      className="mt-4 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 p-0 h-auto"
                    >
                      Get Started →
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <section className="mt-16 mb-20 px-4 md:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-2 text-white text-balance">{t("brandTitle")}</h2>
          <p className="text-slate-400 mb-10 max-w-3xl mx-auto text-pretty">{t("brandSubtitle")}</p>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <FeatureCard icon="💡" title={t("feature1Title")} text={t("feature1Text")} />
            <FeatureCard icon="📄" title={t("feature2Title")} text={t("feature2Text")} />
            <FeatureCard icon="🔬" title={t("feature3Title")} text={t("feature3Text")} />
            <FeatureCard icon="🌍" title={t("feature4Title")} text={t("feature4Text")} />
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              onClick={() => router.push("/report/1")}
              className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
            >
              {t("exploreReport")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push("/library")}
              className="px-6 py-2 rounded-lg border border-white/20 hover:bg-white/10 text-slate-100 font-medium transition-colors"
            >
              {t("seeExampleCase")}
            </Button>
          </div>
        </section>

        <section className="mb-16">
          <MapTeaser />
        </section>

        {/* 🔍 測試後端 API 區塊 */}
        <div className="mt-16 flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-3 text-slate-200">Debug: 後端 API 狀態檢查</h2>
          <button
            onClick={async () => {
              try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/health`)
                const data = await res.json()
                alert(`✅ 後端回應成功！ok=${data.ok}, ts=${data.ts}`)
              } catch (e) {
                alert(`❌ 錯誤：${e}`)
              }
            }}
            className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
          >
            測試後端 /api/health
          </button>
          <p className="text-xs text-slate-500 mt-2">
            NEXT_PUBLIC_API_BASE_URL = {process.env.NEXT_PUBLIC_API_BASE_URL}
          </p>
        </div>
      </div>
    </div>
  )
}
