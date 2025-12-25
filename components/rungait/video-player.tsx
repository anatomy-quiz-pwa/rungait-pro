"use client"

import type React from "react"

import type { PhaseData, GaitPhase } from "@/lib/types"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"
import { PhaseBar } from "./phase-bar"

interface VideoPlayerProps {
  videoUrl: string
  phases: PhaseData[]
  onPhaseChange?: (phase: GaitPhase) => void
  videoRef?: React.RefObject<HTMLVideoElement>
}

export function VideoPlayer({ videoUrl, phases, onPhaseChange, videoRef: externalVideoRef }: VideoPlayerProps) {
  const internalVideoRef = useRef<HTMLVideoElement>(null)
  const videoRef = externalVideoRef || internalVideoRef

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentPhase, setCurrentPhase] = useState<GaitPhase>("IC")
  const [videoError, setVideoError] = useState<string | null>(null)
  const [isValidUrl, setIsValidUrl] = useState(false)

  // 驗證 videoUrl 是否有效
  useEffect(() => {
    if (!videoUrl || videoUrl.trim() === "") {
      setIsValidUrl(false)
      setVideoError("影片 URL 無效或未設定")
      console.error("[VideoPlayer] videoUrl is empty or invalid:", videoUrl)
      return
    }

    // 基本 URL 格式驗證
    try {
      const url = new URL(videoUrl)
      if (!url.protocol.startsWith("http")) {
        setIsValidUrl(false)
        setVideoError("不支援的影片 URL 格式（需為 http/https）")
        console.error("[VideoPlayer] Invalid URL protocol:", videoUrl)
        return
      }
      setIsValidUrl(true)
      setVideoError(null)
      console.log("[VideoPlayer] Valid videoUrl:", videoUrl)
    } catch (e) {
      setIsValidUrl(false)
      setVideoError("無法解析影片 URL")
      console.error("[VideoPlayer] Failed to parse URL:", videoUrl, e)
    }
  }, [videoUrl])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isValidUrl) return

    const handleTimeUpdate = () => {
      if (!video.duration || isNaN(video.duration)) return
      setCurrentTime(video.currentTime)
      const percent = (video.currentTime / video.duration) * 100
      const phase = phases.find((p) => percent >= p.startPercent && percent <= p.endPercent)
      if (phase && phase.phase !== currentPhase) {
        setCurrentPhase(phase.phase)
        onPhaseChange?.(phase.phase)
      }
    }

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration)
        setVideoError(null)
      }
    }

    const handleError = (e: Event) => {
      console.error("[VideoPlayer] Video playback error:", e)
      const error = (video.error && video.error.code) ? {
        1: "MEDIA_ERR_ABORTED - 影片載入被中斷",
        2: "MEDIA_ERR_NETWORK - 網路錯誤",
        3: "MEDIA_ERR_DECODE - 影片解碼錯誤（可能格式不支援）",
        4: "MEDIA_ERR_SRC_NOT_SUPPORTED - 影片來源不支援（NotSupportedError）"
      }[video.error.code] : "未知的播放錯誤"
      setVideoError(error || "無法播放影片，請確認格式為 MP4 (H.264 + AAC)")
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("error", handleError)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("error", handleError)
    }
  }, [phases, currentPhase, onPhaseChange, videoRef, isValidUrl])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSliderChange = (value: number[]) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const skipFrames = (frames: number) => {
    if (!videoRef.current) return
    const frameTime = 1 / 30
    videoRef.current.currentTime += frames * frameTime
  }

  const jumpToPhase = (phase: GaitPhase) => {
    if (!videoRef.current) return
    const phaseData = phases.find((p) => p.phase === phase)
    if (phaseData) {
      const time = (phaseData.startPercent / 100) * duration
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  // 如果 URL 無效，顯示錯誤訊息
  if (!isValidUrl) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-red-500/50">
          <div className="text-center p-6 text-red-400">
            <p className="font-semibold mb-2">無法載入影片</p>
            <p className="text-sm">{videoError || "請確認影片 URL 是否正確"}</p>
            {videoUrl && (
              <p className="text-xs text-red-500/70 mt-2 break-all max-w-md">
                嘗試的 URL: {videoUrl}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        {videoError && (
          <div className="absolute top-2 left-2 right-2 z-10 bg-red-900/80 text-red-200 text-xs p-2 rounded border border-red-500/50">
            {videoError}
          </div>
        )}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          poster="/running-gait-analysis-video.jpg"
          crossOrigin="anonymous"
          playsInline
        />
      </div>

      <PhaseBar phases={phases} currentPhase={currentPhase} onPhaseClick={jumpToPhase} />

      <div className="space-y-3">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.01}
          onValueChange={handleSliderChange}
          className="w-full"
        />

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => skipFrames(-10)}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlay}
              className="bg-cyan-500 border-cyan-400 hover:bg-cyan-600 text-white"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => skipFrames(10)}
              className="bg-slate-800 border-slate-700 hover:bg-slate-700"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-slate-400">
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </div>
        </div>
      </div>
    </div>
  )
}
