"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { submitLocation } from "@/lib/map"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LocationFormProps {
  onSuccess?: () => void
}

export function LocationForm({ onSuccess }: LocationFormProps) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    address: "",
    treadmill_type: "non-motorized",
    allow_public: false,
    contact: "",
    note: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await submitLocation(formData)
      alert(t("submitSuccess"))
      onSuccess?.()
    } catch (error) {
      alert("提交失敗，請重試")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-700">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("locationName")} *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="bg-slate-800 border-slate-700"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">{t("city")}</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="treadmill_type">{t("treadmillType")}</Label>
            <Select
              value={formData.treadmill_type}
              onValueChange={(value) => setFormData({ ...formData, treadmill_type: value })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="non-motorized">{t("nonMotorized")}</SelectItem>
                <SelectItem value="motorized">{t("motorized")}</SelectItem>
                <SelectItem value="other">{t("other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">{t("address")}</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="bg-slate-800 border-slate-700"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact">{t("contactInfo")}</Label>
          <Input
            id="contact"
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            className="bg-slate-800 border-slate-700"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">{t("notes")}</Label>
          <Textarea
            id="note"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="bg-slate-800 border-slate-700"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="allow_public">{t("allowPublic")}</Label>
            <p className="text-xs text-slate-400">審核通過後將自動贈送 5 點</p>
          </div>
          <Switch
            id="allow_public"
            checked={formData.allow_public}
            onCheckedChange={(checked) => setFormData({ ...formData, allow_public: checked })}
          />
        </div>

        <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("submit")}
        </Button>
      </form>
    </Card>
  )
}
