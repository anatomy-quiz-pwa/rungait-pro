"use client"

import { useState, useCallback } from "react"
import type { AnalysisPacket } from "@/lib/types"
import { createMockAnalysis } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, FileVideo, Loader2, AlertCircle } from "lucide-react"

/**
 * 跑步生物力學 A/B 智慧分析引擎
 * 上傳 Before/After 影片，呼叫後端 API 取得分析 JSON，並以 parseRunningJson 更新狀態。
 */
export default function ReportGenerator() {
  const [beforeAnalysis, setBeforeAnalysis] = useState<AnalysisPacket | null>(null)
  const [afterAnalysis, setAfterAnalysis] = useState<AnalysisPacket | null>(null)
  const [beforeFile, setBeforeFile] = useState<File | null>(null)
  const [afterFile, setAfterFile] = useState<File | null>(null)
  const [beforeLoading, setBeforeLoading] = useState(false)
  const [afterLoading, setAfterLoading] = useState(false)
  const [beforeError, setBeforeError] = useState<string | null>(null)
  const [afterError, setAfterError] = useState<string | null>(null)

  /**
   * 將後端 API 回傳的 JSON 解析為 AnalysisPacket 格式
   */
  const parseRunningJson = useCallback((raw: unknown): AnalysisPacket => {
    if (!raw || typeof raw !== "object") {
      throw new Error("無效的 JSON 格式")
    }
    const obj = raw as Record<string, unknown>

    // 若後端已回傳 AnalysisPacket 相容格式，直接轉型
    if (obj.joints && Array.isArray(obj.joints) && obj.phases && Array.isArray(obj.phases)) {
      return obj as unknown as AnalysisPacket
    }

    // 若後端回傳不同格式（例如 joints 為陣列、phases 為陣列），嘗試轉換
    const id = String(obj.id ?? obj.job_id ?? Date.now())
    const phases = Array.isArray(obj.phases)
      ? (obj.phases as Array<{ phase: string; startFrame?: number; endFrame?: number; startPercent?: number; endPercent?: number }>).map(
          (p, i, arr) => ({
            phase: p.phase as AnalysisPacket["phases"][0]["phase"],
            startFrame: p.startFrame ?? 0,
            endFrame: p.endFrame ?? 100,
            startPercent: p.startPercent ?? (i * 100) / arr.length,
            endPercent: p.endPercent ?? ((i + 1) * 100) / arr.length,
          })
        )
      : createMockAnalysis().phases

    const joints = Array.isArray(obj.joints)
      ? (obj.joints as Array<{ joint: string; angles?: Array<{ frame?: number; percent?: number; angle?: number }>; normalRange?: { min?: number; max?: number } }>).map(
          (j) => ({
            joint: j.joint as AnalysisPacket["joints"][0]["joint"],
            angles:
              j.angles?.map((a, i) => ({
                frame: a.frame ?? i * 3,
                percent: a.percent ?? i,
                angle: typeof a.angle === "number" ? a.angle : 0,
              })) ?? [],
            normalRange: {
              min: j.normalRange?.min ?? -20,
              max: j.normalRange?.max ?? 20,
            },
          })
        )
      : createMockAnalysis().joints

    return {
      id,
      videoUrl: String(obj.video_url ?? obj.videoUrl ?? ""),
      speed: Number(obj.speed ?? 3.0),
      cadence: Number(obj.cadence ?? 170),
      footwear: String(obj.footwear ?? "unknown"),
      phases,
      joints,
      findings: Array.isArray(obj.findings) ? (obj.findings as AnalysisPacket["findings"]) : [],
      citations: Array.isArray(obj.citations) ? (obj.citations as AnalysisPacket["citations"]) : [],
      aiSummary: String(obj.ai_summary ?? obj.aiSummary ?? ""),
      datasetVersion: String(obj.dataset_version ?? obj.datasetVersion ?? "unknown"),
      modelVersion: String(obj.model_version ?? obj.modelVersion ?? "unknown"),
      createdAt: String(obj.created_at ?? obj.createdAt ?? new Date().toISOString()),
    }
  }, [])

  /**
   * 上傳影片到後端 API，取得 JSON 後呼叫 parseRunningJson 更新狀態
   */
  const handleVideoSubmit = useCallback(
    async (file: File, slot: "before" | "after") => {
      const setLoading = slot === "before" ? setBeforeLoading : setAfterLoading
      const setError = slot === "before" ? setBeforeError : setAfterError
      const setAnalysis = slot === "before" ? setBeforeAnalysis : setAfterAnalysis
      const setFile = slot === "before" ? setBeforeFile : setAfterFile

      setLoading(true)
      setError(null)
      setFile(file)

      const apiUrl = process.env.NEXT_PUBLIC_ANALYZE_API_URL || ""

      if (!apiUrl) {
        setError("未設定 NEXT_PUBLIC_ANALYZE_API_URL，使用模擬資料")
        setAnalysis(createMockAnalysis(slot === "before" ? "before" : "after"))
        setLoading(false)
        return
      }

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("video", file)

        const res = await fetch(apiUrl, {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        })

        if (!res.ok) {
          const errText = await res.text()
          throw new Error(errText || `API 錯誤 ${res.status}`)
        }

        const json = await res.json()
        const packet = parseRunningJson(json)
        setAnalysis(packet)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "上傳或分析失敗"
        setError(msg)
        setAnalysis(null)
      } finally {
        setLoading(false)
      }
    },
    [parseRunningJson]
  )

  const handleBeforeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleVideoSubmit(file, "before")
  }

  const handleAfterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleVideoSubmit(file, "after")
  }

  const handleReset = () => {
    setBeforeAnalysis(null)
    setAfterAnalysis(null)
    setBeforeFile(null)
    setAfterFile(null)
    setBeforeError(null)
    setAfterError(null)
  }

  return (
    <div className="min-h-screen bg-[#0B0F12] text-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">跑步生物力學 A/B 智慧分析</h1>
          <p className="text-slate-400 mt-1">上傳 Before / After 影片，取得分析結果並產生比較報告</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-slate-900/50 border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-red-500/30 text-red-300 border-red-500/50">Before</Badge>
              {beforeAnalysis && (
                <span className="text-sm text-slate-400">
                  {beforeAnalysis.speed} m/s · {beforeAnalysis.cadence} spm
                </span>
              )}
            </div>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-colors">
              {beforeLoading ? (
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
              ) : (
                <Upload className="w-10 h-10 text-slate-500 mb-2" />
              )}
              <span className="text-sm text-slate-400">
                {beforeFile ? beforeFile.name : "點擊上傳 Before 影片"}
              </span>
              <input
                type="file"
                className="hidden"
                accept="video/mp4,video/quicktime,video/x-msvideo,.mp4,.mov,.avi"
                onChange={handleBeforeChange}
                disabled={beforeLoading}
              />
            </label>
            {beforeError && (
              <div className="mt-3 flex items-center gap-2 text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {beforeError}
              </div>
            )}
            {beforeAnalysis && (
              <div className="mt-3 flex items-center gap-2 text-cyan-400 text-sm">
                <FileVideo className="w-4 h-4 shrink-0" />
                分析完成
              </div>
            )}
          </Card>

          <Card className="p-6 bg-slate-900/50 border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-cyan-500/30 text-cyan-300 border-cyan-500/50">After</Badge>
              {afterAnalysis && (
                <span className="text-sm text-slate-400">
                  {afterAnalysis.speed} m/s · {afterAnalysis.cadence} spm
                </span>
              )}
            </div>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-cyan-500/50 transition-colors">
              {afterLoading ? (
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
              ) : (
                <Upload className="w-10 h-10 text-slate-500 mb-2" />
              )}
              <span className="text-sm text-slate-400">
                {afterFile ? afterFile.name : "點擊上傳 After 影片"}
              </span>
              <input
                type="file"
                className="hidden"
                accept="video/mp4,video/quicktime,video/x-msvideo,.mp4,.mov,.avi"
                onChange={handleAfterChange}
                disabled={afterLoading}
              />
            </label>
            {afterError && (
              <div className="mt-3 flex items-center gap-2 text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {afterError}
              </div>
            )}
            {afterAnalysis && (
              <div className="mt-3 flex items-center gap-2 text-cyan-400 text-sm">
                <FileVideo className="w-4 h-4 shrink-0" />
                分析完成
              </div>
            )}
          </Card>
        </div>

        {(beforeAnalysis || afterAnalysis) && (
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="border-slate-600"
              onClick={() => (window.location.href = "/compare")}
            >
              前往 Compare 頁面檢視
            </Button>
            <Button variant="ghost" className="text-slate-400" onClick={handleReset}>
              清除重來
            </Button>
          </div>
        )}

        {!process.env.NEXT_PUBLIC_ANALYZE_API_URL && (
          <Card className="mt-6 p-4 bg-amber-900/20 border-amber-700/50">
            <p className="text-sm text-amber-200">
              <strong>提示：</strong> 尚未設定 <code className="bg-slate-800 px-1 rounded">NEXT_PUBLIC_ANALYZE_API_URL</code>。
              目前使用模擬資料。請在 .env.local 加入你的 YOLO 分析 API 網址後重啟 dev server。
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
