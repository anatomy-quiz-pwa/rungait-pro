"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreditsBadge } from "@/components/billing/credits-badge"
import { PersonalView } from "@/components/library/personal-view"
import { PubmedView } from "@/components/library/pubmed-view"
import { StandardPdfView } from "@/components/library/standard-pdf-view"

export default function SourceContentPage() {
  const params = useParams()
  const router = useRouter()
  const sourceId = params.id as string

  const renderView = () => {
    switch (sourceId) {
      case "official":
        return <StandardPdfView />
      case "personal":
        return <PersonalView />
      case "pubmed":
        return <PubmedView />
      default:
        return (
          <div className="text-center py-12">
            <p className="text-slate-400">未知的資料庫類型</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F12] text-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/library")} className="hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="text-sm text-slate-400 mb-1">
                <span className="hover:text-cyan-400 cursor-pointer" onClick={() => router.push("/library")}>
                  Library
                </span>
                {" / "}
                <span className="text-slate-300">
                  {sourceId === "official" && "標準資料庫"}
                  {sourceId === "personal" && "我的資料庫"}
                  {sourceId === "pubmed" && "科學文獻資料庫"}
                </span>
              </div>
            </div>
          </div>
          <CreditsBadge />
        </div>

        {renderView()}
      </div>
    </div>
  )
}
