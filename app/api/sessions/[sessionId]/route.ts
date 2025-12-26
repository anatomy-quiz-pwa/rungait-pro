import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { SessionDetail } from "@/lib/types"

// 建立 Supabase client 的 helper（只在 runtime 檢查環境變數）
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL. Please set it in .env.local")
  }
  
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY. Please set at least one in .env.local")
  }
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { sessionId } = await params
    
    console.log("[sessions] Fetching session:", sessionId)

    // 先嘗試從 jobs 表取得（如果存在）
    let jobRecord: any = null
    let videoRecord: any = null

    try {
      const { data: job, error: jobError } = await supabaseAdmin
        .from("jobs")
        .select("*")
        .eq("id", sessionId)
        .single()

      if (!jobError && job) {
        jobRecord = job
        console.log("[sessions] Found job record:", job.id, "status:", job.status)

        // 取得對應的 video 記錄
        if (job.video_id) {
          const { data: video, error: videoError } = await supabaseAdmin
            .from("videos")
            .select("*")
            .eq("id", job.video_id)
            .single()

          if (!videoError && video) {
            videoRecord = video
          }
        }
      }
    } catch (e) {
      console.warn("[sessions] Jobs table may not exist, trying direct video lookup:", e)
    }

    // 如果 jobs 表不存在或找不到記錄，嘗試直接用 sessionId 當 videoId 查詢
    if (!videoRecord) {
      const numericSessionId = Number.parseInt(sessionId)
      if (!isNaN(numericSessionId)) {
        const { data: video, error: videoError } = await supabaseAdmin
          .from("videos")
          .select("*")
          .eq("id", numericSessionId)
          .single()

        if (!videoError && video) {
          videoRecord = video
          console.log("[sessions] Found video record directly:", video.id)
        } else {
          return NextResponse.json({ error: "找不到對應的影片記錄" }, { status: 404 })
        }
      } else {
        return NextResponse.json({ error: "無效的 sessionId" }, { status: 400 })
      }
    }

    // 取得 video URL（優先使用 public_url，否則建立 signed URL）
    let videoUrl = videoRecord.public_url

    if (!videoUrl && videoRecord.storage_path) {
      const { data: signedUrlData } = await supabaseAdmin.storage
        .from("videos")
        .createSignedUrl(videoRecord.storage_path, 3600)
      
      if (signedUrlData?.signedUrl) {
        videoUrl = signedUrlData.signedUrl
      }
    }

    if (!videoUrl) {
      return NextResponse.json({ error: "無法取得影片 URL" }, { status: 500 })
    }

    // 嘗試從 result_json 或 analysis_results 取得分析結果
    let resultJson: any = null

    // 優先從 jobs.result_json 取得（Worker 寫入的）
    if (jobRecord?.result_json) {
      resultJson = jobRecord.result_json
      console.log("[sessions] Using result_json from job record")
    } else {
      // 否則從 analysis_results 表取得（on-device 分析結果）
      const { data: analysisResult, error: analysisError } = await supabaseAdmin
        .from("analysis_results")
        .select("*")
        .eq("video_id", videoRecord.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (!analysisError && analysisResult) {
        // 轉換 analysis_results 的格式為前端需要的結構
        const timeSeries = analysisResult.time_series || []
        const phaseSummary = analysisResult.phase_summary || []
        const fps = analysisResult.fps || 30

        // 從 phase_summary 提取 phases
        const phases = phaseSummary.map((p: any) => p.phase).filter(Boolean)

        // 從 time_series 計算 phase timecodes（假設每個 phase 在序列中的位置）
        const phaseTimecodes: Record<string, number> = {}
        if (timeSeries.length > 0 && phases.length > 0) {
          // 簡單處理：將時間序列均勻分割給各 phase
          const totalDuration = timeSeries[timeSeries.length - 1]?.t || 1
          phases.forEach((phase: string, idx: number) => {
            phaseTimecodes[phase] = (totalDuration / phases.length) * idx
          })
        } else {
          // 如果沒有資料，至少提供 IC
          phases.push("IC")
          phaseTimecodes["IC"] = 0
        }

        // 從 phase_summary 建立 jointAnglesByPhase 和 summaryByPhase
        const jointAnglesByPhase: Record<string, Record<string, number>> = {}
        const summaryByPhase: Record<string, any> = {}

        phaseSummary.forEach((p: any) => {
          if (p.phase) {
            jointAnglesByPhase[p.phase] = {
              hip_flexion: p.hip || 0,
              knee_flexion: p.knee || 0,
              ankle_dorsiflexion: p.ankle || 0,
            }
            summaryByPhase[p.phase] = {
              hip: p.hip,
              knee: p.knee,
              ankle: p.ankle,
            }
          }
        })

        // 如果沒有 phase 資料，至少提供一個 IC 的假資料
        if (Object.keys(jointAnglesByPhase).length === 0) {
          jointAnglesByPhase["IC"] = { hip_flexion: 0, knee_flexion: 0, ankle_dorsiflexion: 0 }
          summaryByPhase["IC"] = {}
        }

        resultJson = {
          phases,
          phaseTimecodes,
          jointAnglesByPhase,
          summaryByPhase,
          aiRecommendations: {
            source: "running_gait_db_v0",
            items: [],
          },
        }

        console.log("[sessions] Converted analysis_results to result_json format")
      } else {
        console.warn("[sessions] No analysis results found, returning minimal structure")
        // 如果都沒有，返回最小結構
        resultJson = {
          phases: ["IC"],
          phaseTimecodes: { IC: 0 },
          jointAnglesByPhase: {
            IC: { hip_flexion: 0, knee_flexion: 0, ankle_dorsiflexion: 0 },
          },
          summaryByPhase: { IC: {} },
          aiRecommendations: {
            source: "running_gait_db_v0",
            items: [],
          },
        }
      }
    }

    // 如果 result_json 中有 files 欄位（Worker 產生的檔案路徑），嘗試取得 signed URLs
    if (resultJson.files) {
      const files: Record<string, string> = {}
      for (const [key, path] of Object.entries(resultJson.files)) {
        if (typeof path === "string") {
          const { data: signedData } = await supabaseAdmin.storage
            .from("results")
            .createSignedUrl(path as string, 3600)
          
          if (signedData?.signedUrl) {
            files[key] = signedData.signedUrl
          }
        }
      }
      resultJson.files = files
    }

    // 構建 SessionDetail 回應
    const sessionDetail: SessionDetail = {
      sessionId: String(sessionId),
      video: {
        url: videoUrl,
        fps: resultJson.fps || 30,
      },
      phases: resultJson.phases || ["IC"],
      phaseTimecodes: resultJson.phaseTimecodes || { IC: 0 },
      jointAnglesByPhase: resultJson.jointAnglesByPhase || {
        IC: { hip_flexion: 0, knee_flexion: 0, ankle_dorsiflexion: 0 },
      },
      summaryByPhase: resultJson.summaryByPhase || { IC: {} },
      aiRecommendations: resultJson.aiRecommendations || {
        source: "running_gait_db_v0",
        items: [],
      },
    }

    return NextResponse.json(sessionDetail, { status: 200 })
  } catch (error: any) {
    console.error("[sessions] Unexpected error:", error)
    return NextResponse.json({ error: `伺服器錯誤：${error.message || "未知錯誤"}` }, { status: 500 })
  }
}

