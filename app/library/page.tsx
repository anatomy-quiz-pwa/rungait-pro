"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Save, Sparkles } from "lucide-react"
import { SourceCard } from "@/components/library/source-card"
import { CreditsBadge } from "@/components/billing/credits-badge"
import { listLibrarySources, loadUserLibrarySelection, saveUserLibrarySelection } from "@/lib/library"
import { fetchCredits } from "@/lib/credits"
import type { LibrarySource, CreditsInfo } from "@/lib/types"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { useAuth } from "@/lib/auth-context"

export default function LibraryPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const router = useRouter()

  const [sources, setSources] = useState<LibrarySource[]>([])
  const [selection, setSelection] = useState<Map<string, boolean>>(new Map())
  const [credits, setCredits] = useState<CreditsInfo>({ balance: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const loadData = async () => {
      const [sourcesData, selectionData, creditsData] = await Promise.all([
        listLibrarySources(),
        loadUserLibrarySelection(),
        fetchCredits(),
      ])

      setSources(sourcesData)
      setSelection(selectionData)
      setCredits(creditsData)
      setLoading(false)
    }

    loadData()
  }, [user, router])

  const handleToggle = async (sourceId: string, selected: boolean) => {
    const newSelection = new Map(selection)
    newSelection.set(sourceId, selected)
    setSelection(newSelection)

    // Auto-save individual selection
    try {
      await saveUserLibrarySelection(sourceId, selected)
    } catch (error) {
      console.error("Failed to save selection:", error)
    }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      // Save all selections
      for (const [sourceId, selected] of selection.entries()) {
        await saveUserLibrarySelection(sourceId, selected)
      }
      alert(t("save") + " ✓")
    } catch (error) {
      console.error("Failed to save:", error)
      alert("儲存失敗")
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateReport = () => {
    const selectedSources = Array.from(selection.entries())
      .filter(([_, selected]) => selected)
      .map(([id]) => id)

    const paidSources = selectedSources.filter((id) => {
      const source = sources.find((s) => s.id === id)
      return source && source.cost > 0
    })

    const totalCost = paidSources.reduce((sum, id) => {
      const source = sources.find((s) => s.id === id)
      return sum + (source?.cost || 0)
    }, 0)

    if (totalCost > 0 && credits.balance < totalCost) {
      alert(`點數不足。需要 ${totalCost} 點，目前剩餘 ${credits.balance} 點。`)
      return
    }

    // Navigate to latest analysis report with selected sources
    // In real implementation, this would create a new analysis or update existing one
    router.push("/report/sample-001")
  }

  const handleViewSource = (sourceId: string) => {
    alert(`查看 ${sourceId} 的內容（開發中）`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F12] flex items-center justify-center">
        <div className="text-slate-400">載入中...</div>
      </div>
    )
  }

  const selectedCount = Array.from(selection.values()).filter(Boolean).length
  const totalCost = Array.from(selection.entries())
    .filter(([_, selected]) => selected)
    .reduce((sum, [id]) => {
      const source = sources.find((s) => s.id === id)
      return sum + (source?.cost || 0)
    }, 0)

  return (
    <div className="min-h-screen bg-[#0B0F12] text-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("libraryTitle")}</h1>
            <p className="text-slate-400">{t("libraryHint")}</p>
          </div>
          <CreditsBadge />
        </div>

        {totalCost > 0 && (
          <Card className="p-4 bg-amber-500/10 border-amber-500/30 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-amber-200 font-medium mb-1">{t("paidDatabaseNote")}</p>
                <p className="text-amber-300">
                  {t("willCost").replace("{0}", totalCost.toString())} （目前餘額：{credits.balance} 點）
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              selected={selection.get(source.id) || false}
              onToggle={(selected) => handleToggle(source.id, selected)}
              onView={() => handleViewSource(source.id)}
            />
          ))}
        </div>

        <Card className="p-6 bg-slate-900/50 border-slate-700">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">
                {t("sourcesSelected").replace("{0}", selectedCount.toString())}
              </p>
              <div className="flex gap-2">
                {Array.from(selection.entries())
                  .filter(([_, selected]) => selected)
                  .map(([id]) => {
                    const source = sources.find((s) => s.id === id)
                    return (
                      <Badge key={id} className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                        {source?.title}
                      </Badge>
                    )
                  })}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSaveAll}
                disabled={saving}
                className="bg-slate-800 border-slate-700 hover:bg-slate-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "儲存中..." : t("saveSelections")}
              </Button>
              <Button
                onClick={handleGenerateReport}
                disabled={selectedCount === 0}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {t("useSelected")}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
