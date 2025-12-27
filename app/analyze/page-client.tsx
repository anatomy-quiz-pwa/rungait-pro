"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { supabaseBrowser } from "@/lib/supabase-browser"
import { angleDeg, smooth } from "@/lib/angles"
import { segmentPhases, type FrameAngles } from "@/lib/gait"
import { useAnalysisStore } from "@/lib/analysisStore"
import { getHealth } from "@/lib/api"
import { checkLastUpload } from "@/lib/checkUpload"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import ClipModal from "@/components/ClipModal"
import AuthBadge from "@/components/AuthBadge"
import AnalysisStatusBar from "@/components/AnalysisStatusBar"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts"

type TrimRange = { start: number; end: number }
type VisionModule = typeof import("@mediapipe/tasks-vision")
let cachedVision: VisionModule | null = null

async function loadVision(): Promise<VisionModule> {
  if (cachedVision) return cachedVision
  if (typeof window === "undefined") {
    throw new Error("Vision module can only be loaded in the browser")
  }
  cachedVision = await import("@mediapipe/tasks-vision")
  return cachedVision
}

export default function AnalyzePageClient() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-300">載入中…</div>}>
      <AnalyzeInner />
    </Suspense>
  )
}

function AnalyzeInner() {
  const [ready, setReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [angles, setAngles] = useState<FrameAngles[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [clipFile, setClipFile] = useState<File | null>(null)
  const [clipOpen, setClipOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [checkingLast, setCheckingLast] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const manualInputRef = useRef<HTMLInputElement>(null)

  const pendingFile = useAnalysisStore((s) => s.pendingFile)
  const setPending = useAnalysisStore((s) => s.setPending)
  const setUploaded = useAnalysisStore((s) => s.setUploaded)
  const clearUploaded = useAnalysisStore((s) => s.clearUploaded)
  const uploadedPublicUrl = useAnalysisStore((s) => s.uploadedPublicUrl)
  const setStatus = useAnalysisStore((s) => s.setStatus)
  const setProgress = useAnalysisStore((s) => s.setProgress)
  const setStoreError = useAnalysisStore((s) => s.setError)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { FilesetResolver } = await loadVision()
        await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm")
        if (!cancelled) setReady(true)
      } catch (error) {
        console.error(error)
        setErrorMsg("無法載入姿勢模型，請稍後再試。")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!pendingFile) return
    setClipFile(pendingFile)
    setClipOpen(true)
    setPending(null)
    setStoreError(null)
    setProgress(0)
    setStatus("clipping")
  }, [pendingFile, setPending, setProgress, setStatus, setStoreError])

  async function ensureAuthed() {
    const supabase = supabaseBrowser()
    const { data } = await supabase.auth.getUser()
    if (!data.user) throw new Error("請先到 /auth 登入再開始分析")
    return data.user
  }

  async function handleFile(file: File, range: TrimRange | null) {
    const user = await ensureAuthed()
    const supabase = supabaseBrowser()
    setProcessing(true)
    setAngles([])
    setSummary(null)
    setErrorMsg(null)
    setStoreError(null)
    setStatus("uploading")
    setProgress(5)

    try {
      const ext = file.name.split(".").pop() || "mp4"
      const path = `user-${user.id}/${Date.now()}.${ext}`
      const uploadRes = await supabase.storage.from("videos").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "video/mp4",
      })
      if (uploadRes.error) throw uploadRes.error

      const { data: pub } = supabase.storage.from("videos").getPublicUrl(uploadRes.data.path)
      const publicUrl = pub.publicUrl
      setUploaded(publicUrl)
      setProgress(30)

      const { data: insertVideo, error: videoErr } = await supabase
        .from("videos")
        .insert({
          user_id: user.id,
          storage_path: uploadRes.data.path,
          public_url: publicUrl,
        })
        .select("id")
        .single()
      if (videoErr) throw videoErr
      const videoId = insertVideo.id as number

      const { FilesetResolver, PoseLandmarker, DrawingUtils } = await loadVision()
      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
      )
      const landmarker = await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) throw new Error("無法建立分析視圖")

      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas context 建立失敗")

      const objectUrl = URL.createObjectURL(file)
      video.src = objectUrl

      await new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(null)
      })

      const start = range ? Math.max(0, range.start) : 0
      const end = range ? Math.min(video.duration, range.end) : video.duration
      if (end <= start) throw new Error("剪輯區間無效")

      const fps = 30
      const startFrame = Math.floor(start * fps)
      const endFrame = Math.floor(end * fps)
      const totalFrames = Math.floor(video.duration * fps)

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const drawer = new DrawingUtils(ctx)

      const frames: FrameAngles[] = []
      const framesToProcess = Math.max(1, Math.min(endFrame, totalFrames - 1) - startFrame + 1)
      let processedFrames = 0

      setStatus("analyzing")

      for (let i = startFrame; i <= Math.min(endFrame, totalFrames - 1); i++) {
        const t = i / fps
        video.currentTime = t
        await new Promise((resolve) => {
          video.onseeked = () => resolve(null)
        })
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const result = await landmarker.detectForVideo(canvas, t)
        const lm = result?.landmarks?.[0]
        if (!lm) continue

        const hip = lm[24]
        const shoulder = lm[12]
        const knee = lm[26]
        const ankle = lm[28]

        const kneeAngle = angleDeg(hip, knee, ankle)
        const hipAngle = angleDeg(shoulder, hip, knee)
        const ankleAngle = angleDeg(knee, ankle, { x: ankle.x, y: ankle.y + 0.1, z: ankle.z })

        frames.push({ t, hip: hipAngle, knee: kneeAngle, ankle: ankleAngle, side: "left", yAnkle: ankle.y })
        drawer.drawLandmarks(lm, { color: "deepskyblue", radius: 2 })
        drawer.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, { color: "deepskyblue" })

        processedFrames += 1
        if (processedFrames % 3 === 0) {
          const pct = 30 + (processedFrames / framesToProcess) * 60
          setProgress(Math.min(90, pct))
        }
      }

      URL.revokeObjectURL(objectUrl)

      const hipSeries = smooth(frames.map((f) => f.hip), 2)
      const kneeSeries = smooth(frames.map((f) => f.knee), 2)
      const ankleSeries = smooth(frames.map((f) => f.ankle), 2)
      frames.forEach((f, idx) => {
        f.hip = hipSeries[idx]
        f.knee = kneeSeries[idx]
        f.ankle = ankleSeries[idx]
      })

      const cycles = segmentPhases(frames, fps, "left")
      const phaseSummary = (cycles.at(0)?.phases ?? []).map((phase) => {
        const seg = frames.slice(phase.startIdx, phase.endIdx)
        const median = (values: number[]) => {
          if (!values.length) return null
          const sorted = [...values].sort((a, b) => a - b)
          return sorted[Math.floor(sorted.length / 2)]
        }
        return {
          phase: phase.name,
          hip: median(seg.map((s) => s.hip)),
          knee: median(seg.map((s) => s.knee)),
          ankle: median(seg.map((s) => s.ankle)),
        }
      })

      setAngles(frames)
      setSummary({ fps, cycles, phaseSummary, start, end })
      setStatus("saving")
      setProgress(95)

      const supabase = supabaseBrowser()
      const { error: analysisError } = await supabase.from("analysis_results").insert({
        user_id: user.id,
        video_id: videoId,
        method: "on-device",
        fps,
        side: "left",
        phase_summary: phaseSummary,
        time_series: frames,
      })
      if (analysisError) console.error(analysisError)
      setProgress(100)
      setStatus("done")
    } catch (error) {
      console.error(error)
      setErrorMsg(error instanceof Error ? error.message : "分析失敗，請稍後再試。")
      setStoreError(error instanceof Error ? error.message : "分析失敗")
      setStatus("error")
      setProgress(0)
    } finally {
      setProcessing(false)
    }
  }

  const readyText = ready ? (processing ? "分析中…" : "模型已就緒") : "初始化模型中…"

  const handleManualPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    clearUploaded()
    setClipFile(file)
    setClipOpen(true)
    setStatus("clipping")
    setProgress(0)
    setStoreError(null)
    e.currentTarget.value = ""
  }

  const handleClipConfirm = async ({ start, end, file }: { start: number; end: number; file: File }) => {
    setClipOpen(false)
    setStatus("uploading")
    setProgress(5)
    setStoreError(null)
    await handleFile(file, { start, end })
    setClipFile(null)
  }

  const handleClipClose = () => {
    setClipOpen(false)
    setClipFile(null)
    setStatus("idle")
    setProgress(0)
  }

  const handleCheckLast = async () => {
    setCheckingLast(true)
    try {
      const record = await checkLastUpload()
      if (!record) {
        alert("目前查無上傳紀錄。請先完成一次分析。")
      } else {
        alert(
          `最近一筆上傳：#${record.id}\n時間：${new Date(record.created_at).toLocaleString()}\nURL：${record.public_url}`,
        )
      }
    } catch (error: any) {
      alert(`查詢失敗：${error.message ?? error}`)
    } finally {
      setCheckingLast(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0F12] text-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold">Running Gait Analysis</h1>
            <p className="text-slate-400 text-sm mt-1">
              登入狀態：<AuthBadge />
            </p>
            {uploadedPublicUrl && (
              <p className="text-xs text-emerald-400 mt-1 break-all">影片已上傳：{uploadedPublicUrl}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = await getHealth()
                  alert(`後端健康檢查：${JSON.stringify(res)}`)
                } catch (error) {
                  alert(`健康檢查失敗：${error}`)
                }
              }}
              className="border-slate-700 text-sm"
            >
              測試後端 API
            </Button>
            <Button
              variant="outline"
              onClick={handleCheckLast}
              disabled={checkingLast}
              className="border-slate-700 text-sm"
            >
              {checkingLast ? "查詢中…" : "查詢最近上傳"}
            </Button>
          </div>
        </div>

        <AnalysisStatusBar />

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button
            variant="secondary"
            onClick={() => manualInputRef.current?.click()}
            className="bg-cyan-700/60 hover:bg-cyan-600 text-white text-sm"
            disabled={processing}
          >
            選擇本機影片
          </Button>
          <span className="text-xs text-slate-400">
            或回首頁點「Upload Video」帶影片進來。剪輯完成後會自動開始分析。
          </span>
          <input
            ref={manualInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/*"
            className="hidden"
            onChange={handleManualPick}
          />
        </div>

        {errorMsg && (
          <Card className="p-4 bg-red-900/30 border-red-600 text-sm text-red-200 mb-6">
            <p>{errorMsg}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4 bg-slate-900/50 border-slate-700">
            <video ref={videoRef} controls className="w-full rounded mb-3 bg-black" />
            <canvas ref={canvasRef} className="w-full rounded border border-slate-800" />
            <p className="text-xs text-slate-400 mt-3">{readyText}</p>
          </Card>

          <Card className="p-4 bg-slate-900/50 border-slate-700">
            <h2 className="text-lg font-semibold mb-3">角度曲線</h2>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={angles.map((a) => ({ t: a.t, hip: a.hip, knee: a.knee, ankle: a.ankle }))}>
                  <XAxis dataKey="t" tickFormatter={(v: number) => v.toFixed(1)} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="hip" stroke="#22d3ee" dot={false} />
                  <Line type="monotone" dataKey="knee" stroke="#f97316" dot={false} />
                  <Line type="monotone" dataKey="ankle" stroke="#a855f7" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {summary?.phaseSummary?.length ? (
              <div className="mt-4">
                <h3 className="font-semibold mb-2 text-sm">第一個週期相位統計（°，中位數）</h3>
                <table className="w-full text-xs border border-slate-700 rounded overflow-hidden">
                  <thead className="bg-slate-800/70">
                    <tr>
                      <th className="px-2 py-1 text-left font-medium">Phase</th>
                      <th className="px-2 py-1 text-right font-medium">Hip</th>
                      <th className="px-2 py-1 text-right font-medium">Knee</th>
                      <th className="px-2 py-1 text-right font-medium">Ankle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.phaseSummary.map((phase: any) => (
                      <tr key={phase.phase} className="border-t border-slate-800/70">
                        <td className="px-2 py-1">{phase.phase}</td>
                        <td className="px-2 py-1 text-right">
                          {phase.hip == null ? "—" : phase.hip.toFixed(1)}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {phase.knee == null ? "—" : phase.knee.toFixed(1)}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {phase.ankle == null ? "—" : phase.ankle.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-4">尚未取得完整週期，可再上傳長一些的片段。</p>
            )}
          </Card>
        </div>
      </div>

      <ClipModal file={clipFile} open={clipOpen} onClose={handleClipClose} onConfirm={handleClipConfirm} minLengthSec={1.5} />
    </main>
  )
}
