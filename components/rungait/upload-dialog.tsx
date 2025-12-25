"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, AlertCircle, CreditCard, Sparkles, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useState } from "react"
import { UpgradeDialog } from "./upgrade-dialog"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { consumeOneCredit } from "@/lib/credits"

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadSuccess?: (file: File) => void
}

export function UploadDialog({ open, onOpenChange, onUploadSuccess }: UploadDialogProps) {
  const { user, billingInfo } = useAuth()
  const { t } = useI18n()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [newBalance, setNewBalance] = useState<number | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)
    setUploadSuccess(false)

    try {
      const balance = await consumeOneCredit({
        filename: file.name,
        size: file.size,
      })

      setTimeout(() => {
        setUploading(false)
        setUploadSuccess(true)
        setNewBalance(balance)
        setUploadedFile(file)
      }, 1500)
    } catch (err: any) {
      setUploading(false)
      if (err.message === "INSUFFICIENT_CREDITS") {
        setShowUpgrade(true)
      } else {
        setError("上傳失敗，請重試")
      }
    }
  }

  const handleGoToReport = () => {
    if (uploadedFile) {
      onUploadSuccess?.(uploadedFile)
      onOpenChange(false)
      resetDialog()
    }
  }

  const handleUploadNext = () => {
    resetDialog()
  }

  const resetDialog = () => {
    setUploadSuccess(false)
    setNewBalance(null)
    setUploadedFile(null)
    setError(null)
  }

  const handleCheckoutStarter = () => {
    alert("付款功能尚未啟用，請稍後再試！\n或聯繫我們：support@yourbrand.com")
  }

  const handleCheckoutPro = () => {
    alert("付款功能尚未啟用，請稍後再試！\n或聯繫我們：support@yourbrand.com")
  }

  const handleBuyCredits = () => {
    alert("付款功能尚未啟用，請稍後再試！\n或聯繫我們：support@yourbrand.com")
  }

  if (!user) {
    return null
  }

  const availableCredits = billingInfo?.remaining || 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <Upload className="h-5 w-5 text-cyan-400" />
              Upload Running Video
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {t("need5")} ({availableCredits} {t("remaining")})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {uploadSuccess && newBalance !== null ? (
              <div className="space-y-4">
                <Alert className="bg-emerald-500/10 border-emerald-500/20">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <AlertDescription className="text-emerald-400">
                    {t("afterConsume").replace("{0}", String(newBalance))}
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button onClick={handleGoToReport} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                    {t("goReport")}
                  </Button>
                  <Button
                    onClick={handleUploadNext}
                    variant="outline"
                    className="flex-1 bg-slate-800 border-slate-700 hover:bg-slate-700"
                  >
                    {t("uploadNext")}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {billingInfo && (
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-300">{t("currentUsage")}</span>
                      <span className="text-lg font-bold text-cyan-400">
                        {availableCredits} {t("points")}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {t("eachAnalysis")} 5 {t("points")}
                    </div>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <label
                    htmlFor="video-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-colors bg-slate-800/30"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-400">
                        <span className="font-semibold text-cyan-400">Click to select</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-500 mt-1">MP4, MOV, AVI (max 500MB)</p>
                    </div>
                    <input
                      id="video-upload"
                      type="file"
                      className="hidden"
                      accept="video/*"
                      onChange={handleFileSelect}
                      disabled={uploading || availableCredits < 5}
                    />
                  </label>

                  {uploading && (
                    <div className="flex items-center gap-2 text-sm text-cyan-400">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span>Processing upload...</span>
                    </div>
                  )}
                </div>

                {billingInfo && availableCredits < 10 && (
                  <Alert className="bg-amber-500/10 border-amber-500/20">
                    <CreditCard className="h-4 w-4 text-amber-400" />
                    <AlertDescription className="text-amber-400 text-sm">
                      點數即將用盡！目前剩餘 {availableCredits} 點數。建議購買更多點數。
                    </AlertDescription>
                  </Alert>
                )}

                <div className="pt-2 flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                    {t("cancel")}
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                    onClick={() => setShowUpgrade(true)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {t("buyCredits")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {billingInfo && (
        <UpgradeDialog
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          usage={{
            used: billingInfo.used_count,
            quota: billingInfo.monthly_quota,
            extra: billingInfo.credits_extra,
          }}
          onCheckoutStarter={handleCheckoutStarter}
          onCheckoutPro={handleCheckoutPro}
          onBuyCredits={handleBuyCredits}
        />
      )}
    </>
  )
}
