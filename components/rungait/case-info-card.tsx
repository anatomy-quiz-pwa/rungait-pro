"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Edit, Copy, Check } from "lucide-react"
import { useI18n } from "@/lib/i18n/i18n-provider"
import type { CaseInfo } from "@/lib/types"

interface CaseInfoCardProps {
  caseInfo: CaseInfo
  onSave?: (notes: string) => void
}

export function CaseInfoCard({ caseInfo, onSave }: CaseInfoCardProps) {
  const { t } = useI18n()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [notes, setNotes] = useState(caseInfo.coachNotes || "")
  const [copied, setCopied] = useState(false)

  const handleSave = () => {
    onSave?.(notes)
    setIsEditOpen(false)
  }

  const handleCopyHeader = () => {
    const header = `${t("patientId")}: ${caseInfo.code} | ${caseInfo.age}${t("years")} | ${caseInfo.speedKph} km/h | ${caseInfo.cadence} spm | ${caseInfo.footwear}`
    navigator.clipboard.writeText(header)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Card className="p-6 bg-slate-900/50 border-slate-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-100">{t("caseInfo")}</h3>
            <p className="text-sm text-slate-400 mt-1">
              {caseInfo.dateISO ? new Date(caseInfo.dateISO).toLocaleDateString() : new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyHeader}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {t("copyHeader")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              {t("editNotes")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{t("patientId")}</span>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 font-mono">{caseInfo.code}</Badge>
            </div>
            {caseInfo.age && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{t("age")}</span>
                <span className="text-slate-100 font-medium">
                  {caseInfo.age} {t("years")}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{t("speed")}</span>
              <span className="text-slate-100 font-medium">{caseInfo.speedKph} km/h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{t("cadence")}</span>
              <span className="text-slate-100 font-medium">{caseInfo.cadence} spm</span>
            </div>
          </div>

          <div className="space-y-3">
            {caseInfo.stepLengthCm && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{t("stepLength")}</span>
                <span className="text-slate-100 font-medium">{caseInfo.stepLengthCm} cm</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{t("footwear")}</span>
              <span className="text-slate-100 font-medium text-right">{caseInfo.footwear}</span>
            </div>
            {caseInfo.inclinePct !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{t("incline")}</span>
                <span className="text-slate-100 font-medium">{caseInfo.inclinePct}%</span>
              </div>
            )}
          </div>
        </div>

        {caseInfo.coachNotes && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-2">{t("coachNotes")}</h4>
            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{caseInfo.coachNotes}</p>
          </div>
        )}
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">{t("editNotes")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("coachNotes")}
              rows={6}
              className="bg-slate-800 border-slate-700 text-slate-100"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-600">
              {t("saveNotes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
