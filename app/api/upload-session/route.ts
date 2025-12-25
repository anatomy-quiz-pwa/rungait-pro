import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// 檢查必要的環境變數
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL. Please set it in .env.local")
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY. Please set at least one in .env.local")
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(request: NextRequest) {
  try {
    // 取得用戶認證（從 header 或 session）
    const authHeader = request.headers.get("authorization")
    let userId: string | null = null

    if (authHeader?.startsWith("Bearer ")) {
      // 如果前端傳了 Bearer token，驗證它
      const token = authHeader.substring(7)
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
      if (!authError && user) {
        userId = user.id
      }
    } else {
      // 否則從 request body 中取得（前端可以在呼叫時帶入）
      const formData = await request.formData()
      const userIdFromBody = formData.get("userId") as string | null
      if (userIdFromBody) {
        userId = userIdFromBody
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "未登入或無法識別用戶" }, { status: 401 })
    }

    const file = (await request.formData()).get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "未提供檔案" }, { status: 400 })
    }

    // 驗證檔案類型
    const validTypes = ["video/mp4", "video/quicktime", "video/x-msvideo"]
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mov|avi)$/i)) {
      return NextResponse.json(
        { error: "不支援的檔案格式，請上傳 MP4 (H.264 + AAC) 格式的影片" },
        { status: 400 }
      )
    }

    console.log("[upload-session] Starting upload for user:", userId, "file:", file.name, "size:", file.size)

    // 上傳到 Supabase Storage
    const ext = file.name.split(".").pop() || "mp4"
    const storagePath = `user-${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("videos")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "video/mp4",
      })

    if (uploadError) {
      console.error("[upload-session] Storage upload error:", uploadError)
      return NextResponse.json({ error: `上傳失敗：${uploadError.message}` }, { status: 500 })
    }

    // 取得公開 URL
    const { data: publicUrlData } = supabaseAdmin.storage.from("videos").getPublicUrl(uploadData.path)
    const publicUrl = publicUrlData.publicUrl

    console.log("[upload-session] Uploaded to:", uploadData.path, "publicUrl:", publicUrl)

    // 建立 videos 記錄
    const { data: videoRecord, error: videoError } = await supabaseAdmin
      .from("videos")
      .insert({
        user_id: userId,
        storage_path: uploadData.path,
        public_url: publicUrl,
      })
      .select("id")
      .single()

    if (videoError) {
      console.error("[upload-session] Videos insert error:", videoError)
      // 如果插入失敗，嘗試清理已上傳的檔案
      await supabaseAdmin.storage.from("videos").remove([uploadData.path])
      return NextResponse.json({ error: `建立影片記錄失敗：${videoError.message}` }, { status: 500 })
    }

    const videoId = videoRecord.id as number

    // 建立 job/session 記錄（如果專案有 jobs 表）
    // 注意：這裡假設 Supabase 中有一個 jobs 表，結構如下：
    // - id (uuid, primary key)
    // - user_id (uuid, foreign key to auth.users)
    // - video_id (integer, foreign key to videos)
    // - status (text: 'pending' | 'processing' | 'done' | 'error')
    // - result_json (jsonb, nullable)
    // - result_signed_urls (jsonb, nullable)
    // - created_at (timestamp)
    // - updated_at (timestamp)

    let sessionId: string | number = videoId // 暫時用 videoId 當 sessionId

    try {
      // 嘗試建立 jobs 記錄（如果表存在）
      const { data: jobRecord, error: jobError } = await supabaseAdmin
        .from("jobs")
        .insert({
          user_id: userId,
          video_id: videoId,
          status: "pending",
        })
        .select("id")
        .single()

      if (!jobError && jobRecord) {
        sessionId = jobRecord.id
        console.log("[upload-session] Job created:", sessionId)
      } else {
        console.warn("[upload-session] Jobs table may not exist, using videoId as sessionId:", jobError?.message)
      }
    } catch (e) {
      console.warn("[upload-session] Failed to create job record (table may not exist):", e)
      // 繼續使用 videoId 作為 sessionId
    }

    return NextResponse.json(
      {
        sessionId: String(sessionId),
        videoUrl: publicUrl,
        videoId,
        message: "上傳成功，分析任務已建立",
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[upload-session] Unexpected error:", error)
    return NextResponse.json({ error: `伺服器錯誤：${error.message || "未知錯誤"}` }, { status: 500 })
  }
}

