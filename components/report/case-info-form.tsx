"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Check } from "lucide-react"
import type { CaseMeta } from "@/lib/types"
import { updateCaseMeta } from "@/lib/analysis"
import { useI18n } from "@/lib/i18n/i18n-provider"

interface CaseInfoFormProps {
  analysisId: string
  initialData?: CaseMeta
}

export function CaseInfoForm({ analysisId, initialData = {} }: CaseInfoFormProps) {
  const { t } = useI18n()
  const [formData, setFormData] = useState<CaseMeta>(initialData)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedTime, setSavedTime] = useState<string>()

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateCaseMeta(analysisId, formData)
      setSaved(true)
      setSavedTime(new Date().toLocaleTimeString())
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Failed to save case meta:", error)
      alert("儲存失敗，請重試")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">{t("caseInfoCard")}</h3>
        {savedTime && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Check className="h-4 w-4" />
            {t("savedAt").replace("{0}", savedTime)}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code">{t("patientCode")}</Label>
            <Input
              id="code"
              value={formData.code || ""}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="P001"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t("patientName")}</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="張三"
              className="bg-slate-800 border-slate-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sex">{t("sex")}</Label>
            <Select value={formData.sex || ""} onValueChange={(v) => setFormData({ ...formData, sex: v as "M" | "F" })}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="選擇性別" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">{t("male")}</SelectItem>
                <SelectItem value="F">{t("female")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">{t("age")}</Label>
            <Input
              id="age"
              type="number"
              value={formData.age || ""}
              onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) || null })}
              placeholder="30"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="training_freq">{t("trainingFreq")}</Label>
            <Input
              id="training_freq"
              type="number"
              value={formData.training_freq_per_week || ""}
              onChange={(e) => setFormData({ ...formData, training_freq_per_week: Number(e.target.value) || null })}
              placeholder="3"
              className="bg-slate-800 border-slate-700"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="diagnosis">{t("diagnosis")}</Label>
          <Input
            id="diagnosis"
            value={formData.diagnosis || ""}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            placeholder="膝關節炎"
            className="bg-slate-800 border-slate-700"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal">{t("runningGoal")}</Label>
          <Input
            id="goal"
            value={formData.goal || ""}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            placeholder="改善跑姿，減少疼痛"
            className="bg-slate-800 border-slate-700"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="occupation">{t("occupation")}</Label>
          <Input
            id="occupation"
            value={formData.occupation || ""}
            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            placeholder="軟體工程師"
            className="bg-slate-800 border-slate-700"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="other_sports">{t("otherSports")}</Label>
          <Input
            id="other_sports"
            value={formData.other_sports || ""}
            onChange={(e) => setFormData({ ...formData, other_sports: e.target.value })}
            placeholder="游泳、騎車"
            className="bg-slate-800 border-slate-700"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">{t("notesPlaceholder")}</Label>
          <Textarea
            id="note"
            value={formData.note || ""}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="其他備註資訊..."
            rows={3}
            className="bg-slate-800 border-slate-700"
          />
        </div>

        <Button onClick={handleSave} disabled={saving || saved} className="w-full bg-cyan-500 hover:bg-cyan-600">
          {saved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              {t("savedAt").replace("{0}", savedTime || "")}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "儲存中..." : t("saveCaseInfo")}
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
