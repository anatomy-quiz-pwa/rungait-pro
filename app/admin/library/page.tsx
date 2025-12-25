"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { StandardPdfAdmin } from "@/components/admin/library/standard-pdf-admin"
import { PubmedAdmin } from "@/components/admin/library/pubmed-admin"
import { PersonalOverview } from "@/components/admin/library/personal-overview"

export default function AdminLibraryPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && mounted) {
      if (!user) {
        router.push("/")
      } else if (userRole !== "admin") {
        router.push("/dashboard")
      }
    }
  }, [user, userRole, loading, mounted, router])

  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-[#0B0F12] flex items-center justify-center">
        <div className="text-slate-400">載入中...</div>
      </div>
    )
  }

  if (!user || userRole !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0B0F12] text-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">資料庫管理中心</h1>
          <p className="text-slate-400">統一管理標準資料庫、PubMed 推薦、個人資料庫</p>
        </div>

        <Tabs defaultValue="standard" className="space-y-6">
          <TabsList className="bg-slate-900 border-slate-700">
            <TabsTrigger
              value="standard"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              標準資料庫 PDF
            </TabsTrigger>
            <TabsTrigger
              value="pubmed"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              PubMed 推薦
            </TabsTrigger>
            <TabsTrigger
              value="personal"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              個人資料庫概覽
            </TabsTrigger>
          </TabsList>

          <TabsContent value="standard">
            <StandardPdfAdmin />
          </TabsContent>

          <TabsContent value="pubmed">
            <PubmedAdmin />
          </TabsContent>

          <TabsContent value="personal">
            <PersonalOverview />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
