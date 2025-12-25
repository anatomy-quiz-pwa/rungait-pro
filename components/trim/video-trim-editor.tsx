"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, Scissors, Sparkles, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { TimelineRange } from "./timeline-range"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { useRouter } from "next/navigation"
import {
  trimVideo,
  estimateOutputSize,
  formatDuration,
  formatFileSize,
  type CompressionPreset,
} from "@/lib/video-client"
import { consumeOneCredit } from "@/lib/credits"

export function VideoTrimEditor() {
  const { t } = useI18n()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [startSec, setStartSec] = useState(0)
  const [endSec, setEndSec] = useState(10)
  const [preset, setPreset] = useState<CompressionPreset>("fast720")
  const [compressing, setCompressing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null)
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.size > 500 * 1024 * 1024) {
      setError("File exceeds 500MB, please select a smaller file")
      return
    }

    if (!selectedFile.type.startsWith("video/")) {
      setError("Please select a valid video file")
      return
    }

    setFile(selectedFile)
    setError(null)
    setCompressedBlob(null)
    setCompressedUrl(null)

    const url = URL.createObjectURL(selectedFile)
    setVideoUrl(url)

    const video = document.createElement("video")
    video.src = url
    video.preload = "metadata"
    video.onloadedmetadata = () => {
      const videoDuration = video.duration
      setDuration(videoDuration)

      if (videoDuration >= 12) {
        const center = videoDuration / 2
        setStartSec(Math.max(0, center - 5))
        setEndSec(Math.min(videoDuration, center + 5))
      } else {
        setStartSec(0)
        setEndSec(Math.min(videoDuration, 10))
      }

      URL.revokeObjectURL(url)
    }
    video.onerror = (e) => {
      console.error("[v0] Video load error:", e)
      setError("Failed to load video. Please try a different file.")
      URL.revokeObjectURL(url)
    }
  }

  const handleSetIn = () => {
    if (videoRef.current) {
      setStartSec(videoRef.current.currentTime)
    }
  }

  const handleSetOut = () => {
    if (videoRef.current) {
      setEndSec(videoRef.current.currentTime)
    }
  }

  const handleReset = () => {
    setStartSec(0)
    setEndSec(Math.min(duration, 10))
    if (videoRef.current) {
      videoRef.current.currentTime = 0
    }
  }

  const handleCompress = async () => {
    if (!file) {
      setError(t("selectFile"))
      return
    }

    const clipDuration = endSec - startSec
    if (clipDuration > 10) {
      setError(t("tooLong"))
      return
    }

    setCompressing(true)
    setError(null)
    setProgress(0)

    try {
      const blob = await trimVideo(file, {
        startSec,
        endSec,
        preset,
        onProgress: (p) => setProgress(p),
      })

      if (blob) {
        setCompressedBlob(blob)
        const url = URL.createObjectURL(blob)
        setCompressedUrl(url)
      }
    } catch (err: any) {
      console.error("[v0] Compression error:", err)
      setError(t("compressionError") + ": " + err.message)
    } finally {
      setCompressing(false)
    }
  }

  const handleSubmit = async () => {
    if (!compressedBlob) {
      setError(t("selectFile"))
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const balance = await consumeOneCredit({
        filename: file?.name || "trimmed-clip.mp4",
        size: compressedBlob.size,
      })

      setTimeout(() => {
        router.push("/analyze")
      }, 1500)
    } catch (err: any) {
      setSubmitting(false)
      if (err.message === "INSUFFICIENT_CREDITS") {
        setError("點數不足，請購買更多點數")
      } else {
        setError("提交失敗，請重試")
      }
    }
  }

  const selectedDuration = endSec - startSec
  const isValidDuration = selectedDuration > 0 && selectedDuration <= 10
  const estimatedSize = estimateOutputSize(selectedDuration, preset)

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-6 bg-slate-900/50 border-slate-700 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">{t("uploadVideo")}</h3>
          <p className="text-sm text-slate-400 mb-4">{t("videoHint")}</p>

          {!file ? (
            <label
              htmlFor="video-file"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-colors bg-slate-800/30"
            >
              <Upload className="h-10 w-10 text-slate-400 mb-3" />
              <p className="text-sm text-slate-400">{t("dragDropVideo")}</p>
              <p className="text-xs text-slate-500 mt-2">MP4, MOV, AVI (max 500MB)</p>
              <input
                id="video-file"
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="video/*"
                onChange={handleFileSelect}
              />
            </label>
          ) : (
            <div className="space-y-4">
              {videoUrl && <video ref={videoRef} src={videoUrl} controls className="w-full rounded-lg bg-black" />}

              <div className="space-y-3">
                <TimelineRange
                  duration={duration}
                  startSec={startSec}
                  endSec={endSec}
                  onChange={(start, end) => {
                    setStartSec(start)
                    setEndSec(end)
                  }}
                />

                <div className="grid grid-cols-3 gap-2">
                  <Button size="sm" variant="outline" onClick={handleSetIn} className="text-xs bg-transparent">
                    {t("setIn")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleSetOut} className="text-xs bg-transparent">
                    {t("setOut")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleReset} className="text-xs bg-transparent">
                    {t("reset")}
                  </Button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">
                    {t("selectedDuration").replace("{0}", formatDuration(selectedDuration))}
                  </span>
                  {!isValidDuration && <span className="text-red-400">{t("tooLong")}</span>}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null)
                  setVideoUrl(null)
                  setCompressedBlob(null)
                  setCompressedUrl(null)
                }}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("selectFile")}
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 bg-slate-900/50 border-slate-700 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">{t("compressionPreset")}</h3>

          <Alert className="bg-blue-500/10 border-blue-500/20 mb-4">
            <AlertDescription className="text-blue-400 text-sm space-y-1">
              <p>{t("trimGuidance")}</p>
              <p>{t("trimGuidance2")}</p>
              <p>{t("trimGuidance3")}</p>
            </AlertDescription>
          </Alert>

          <RadioGroup value={preset} onValueChange={(v) => setPreset(v as CompressionPreset)} className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="fast720" id="fast720" />
              <Label htmlFor="fast720" className="text-slate-300 cursor-pointer">
                {t("presetFast")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="small540" id="small540" />
              <Label htmlFor="small540" className="text-slate-300 cursor-pointer">
                {t("presetSmall")}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cutOnly" id="cutOnly" />
              <Label htmlFor="cutOnly" className="text-slate-300 cursor-pointer">
                {t("presetCut")}
              </Label>
            </div>
          </RadioGroup>

          <div className="mt-4 text-sm text-slate-400">
            <p>
              {t("estimatedSize")}: <span className="font-medium text-cyan-400">{estimatedSize}</span>
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {!compressedBlob ? (
            <Button
              onClick={handleCompress}
              disabled={!file || !isValidDuration || compressing}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              {compressing ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  {t("compressing").replace("{0}", progress.toString())}
                </>
              ) : (
                <>
                  <Scissors className="h-4 w-4 mr-2" />
                  {t("compress")}
                </>
              )}
            </Button>
          ) : (
            <>
              <Alert className="bg-emerald-500/10 border-emerald-500/20">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <AlertDescription className="text-emerald-400">
                  {t("compressionComplete")}
                  <div className="mt-2 text-xs space-y-1">
                    <p>{t("actualDuration").replace("{0}", formatDuration(selectedDuration))}</p>
                    <p>{t("actualSize").replace("{0}", formatFileSize(compressedBlob.size))}</p>
                  </div>
                </AlertDescription>
              </Alert>

              {compressedUrl && (
                <div>
                  <p className="text-sm font-medium text-slate-300 mb-2">{t("previewClip")}</p>
                  <video
                    key={compressedUrl}
                    src={compressedUrl}
                    controls
                    className="w-full rounded-lg bg-black"
                    preload="metadata"
                    onError={(e) => {
                      console.error("[v0] Compressed video playback error:", e)
                      setError("Cannot play compressed video. Browser may not support the codec.")
                    }}
                  />
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                    {t("creatingAnalysis")}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t("submitAnalysis")} (5 {t("points")})
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setCompressedBlob(null)
                  setCompressedUrl(null)
                }}
                className="w-full"
              >
                {t("reset")}
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
