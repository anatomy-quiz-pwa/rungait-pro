"use client"

import type React from "react"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { fetchCredits } from "@/lib/credits"
import { UpgradeDialog } from "@/components/rungait/upgrade-dialog"
import { useAnalysisStore } from "@/lib/analysisStore"

interface UploadVideoButtonProps {
  label?: string
  className?: string
  onFallbackPick?: (file: File) => void
  showIcon?: boolean
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function UploadVideoButton({
  label = "Upload Video",
  className = "",
  onFallbackPick,
  showIcon = true,
  variant = "default",
  size = "lg",
}: UploadVideoButtonProps) {
  const router = useRouter()
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const uploadedPublicUrl = useAnalysisStore((s) => s.uploadedPublicUrl)
  const setPending = useAnalysisStore((s) => s.setPending)
  const clearUploaded = useAnalysisStore((s) => s.clearUploaded)
  const setStatus = useAnalysisStore((s) => s.setStatus)
  const setProgress = useAnalysisStore((s) => s.setProgress)
  const setError = useAnalysisStore((s) => s.setError)

  async function handleClick() {
    if (uploadedPublicUrl) return
    if (busy) return
    setBusy(true)

    console.log("[v0] Upload button clicked")

    try {
      // 1) Auth check
      if (!user) {
        console.log("[v0] No user, showing login prompt")
        setShowLoginPrompt(true)
        setTimeout(() => setShowLoginPrompt(false), 3000)
        setBusy(false)
        return
      }

      console.log("[v0] User authenticated:", user.email)

      // 2) Credits check
      const { balance } = await fetchCredits()
      console.log("[v0] Credits balance:", balance)

      if ((balance ?? 0) < 5) {
        console.log("[v0] Insufficient credits, showing upgrade dialog")
        setShowUpgradeDialog(true)
        setBusy(false)
        return
      }

      setError(null)
      setProgress(0)
      setStatus("picking")
      console.log("[v0] Opening file picker for analyze flow")
      fileRef.current?.click()
    } catch (e) {
      console.error("[v0] Upload CTA failed:", e)
      alert("Unable to start upload. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      console.log("[v0] File selected:", f.name)
      onFallbackPick?.(f)
      clearUploaded()
      setError(null)
      setProgress(0)
      setStatus("clipping")
      setPending(f)
      router.push("/analyze?mode=clip")
    }
    e.currentTarget.value = "" // reset
  }

  return (
    <>
      <div className="inline-flex flex-col items-center gap-2">
        <Button
          type="button"
          onClick={handleClick}
          disabled={busy || Boolean(uploadedPublicUrl)}
          variant={variant}
          size={size}
          className={`gap-3 ${variant === "default" ? "bg-cyan-600 hover:bg-cyan-700" : ""} ${className}`}
          aria-label="Upload video for analysis"
        >
          {showIcon && !uploadedPublicUrl && <Upload className="h-5 w-5" />}
          {uploadedPublicUrl ? "已上傳 ✓" : busy ? "Preparing..." : label}
        </Button>

        {showLoginPrompt && <p className="text-sm text-amber-400 animate-pulse">Please login first to upload videos</p>}

        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/quicktime,video/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      <UpgradeDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} />
    </>
  )
}
