import { NextRequest, NextResponse } from "next/server"
import { supabaseServer, getServerUser } from "@/lib/supabase-server"
import { randomUUID } from "crypto"

/**
 * POST /api/locations/register
 * 註冊新的 curved treadmill location（需登入且 can_upload=true）
 * 支援兩種來源：'google' (Google Places) 或 'manual' (手動選點)
 */
export async function POST(request: NextRequest) {
  try {
    // 0. 檢查 Supabase 環境變數
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("[POST /api/locations/register] Missing Supabase environment variables")
      return NextResponse.json(
        { 
          error: "Server configuration error",
          details: "Missing Supabase environment variables. Please contact the administrator."
        },
        { status: 500 }
      )
    }

    // 1. 解析請求 body（先解析以便取得 user_id）
    let body
    try {
      body = await request.json()
    } catch (e: any) {
      console.error("[POST /api/locations/register] JSON parse error:", e)
      return NextResponse.json(
        { error: "Invalid JSON in request body", details: e?.message },
        { status: 400 }
      )
    }

    // 2. 建立 Supabase client（需要在檢查 user 之前建立，以便查詢用戶）
    let supabase
    try {
      supabase = await supabaseServer(request)
    } catch (error: any) {
      console.error("[POST /api/locations/register] Error creating Supabase client:", error)
      return NextResponse.json(
        { 
          error: "Database connection error",
          details: error?.message || "Failed to connect to database"
        },
        { status: 500 }
      )
    }

    // 3. 檢查登入狀態
    // 先嘗試從 Supabase Auth 取得 user
    let user
    try {
      user = await getServerUser(request)
    } catch (error: any) {
      console.warn("[POST /api/locations/register] Supabase Auth failed, trying fallback:", error?.message)
      user = null
    }
    
    // 如果 Supabase Auth 沒有 user，嘗試從 request body 取得（模擬認證系統）
    if (!user && body.user_id) {
      // 使用模擬認證系統，從 body 取得 user_id
      // 注意：模擬認證的 user_id 可能不是 UUID 格式，需要轉換
      const mockUserId = body.user_id
      
      // 檢查是否為 UUID 格式
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      let finalUserId: string
      
      if (uuidRegex.test(mockUserId)) {
        // 已經是 UUID 格式
        finalUserId = mockUserId
      } else {
        // 不是 UUID 格式，需要處理
        // 注意：owner_user_id 有外鍵約束 REFERENCES auth.users(id)
        // 所以我們需要一個在 auth.users 表中存在的 UUID
        // 
        // 方案：查詢 auth.users 表，使用第一個用戶的 UUID
        // 注意：直接查詢 auth.users 可能需要特殊權限，我們使用 Supabase Admin API 或查詢 user_access 表
        try {
          // 嘗試查詢 user_access 表來取得一個有效的 user_id（且 can_upload = true）
          // 選擇第一個有上傳權限的用戶，確保與其他表（如 jobs）使用相同的 user_id
          console.log("[POST /api/locations/register] 🔍 Querying user_access table for users with can_upload = true...")
          const { data: userAccess, error: userError } = await supabase
            .from('user_access')
            .select('user_id, can_upload, display_name')
            .eq('can_upload', true)  // 只查詢 can_upload = true 的記錄
            .order('created_at', { ascending: false })  // 優先選擇最新的用戶
            .limit(1)
          
          if (userError) {
            console.error("[POST /api/locations/register] ❌ Error querying user_access:", userError)
          } else {
            console.log("[POST /api/locations/register] 📊 Query result:", { count: userAccess?.length || 0, users: userAccess })
          }
          
          if (!userError && userAccess && userAccess.length > 0) {
            // 使用第一個 user_access 記錄的 user_id（且 can_upload = true）
            // 優先選擇 can_upload = true 的記錄
            const userWithUpload = userAccess.find((ua: any) => ua.can_upload === true) || userAccess[0]
            finalUserId = userWithUpload.user_id
            console.log("[POST /api/locations/register] ✅ Using existing user_id from user_access for mock user:", finalUserId, "Original:", mockUserId, "can_upload:", userWithUpload.can_upload, "display_name:", userWithUpload.display_name || 'N/A')
            
            // 如果 can_upload 不是 true，警告用戶
            if (userWithUpload.can_upload !== true) {
              console.error("[POST /api/locations/register] ❌ ERROR: Selected user does not have can_upload = true. Insert will fail due to RLS policy.")
              console.error("[POST /api/locations/register] Selected user:", userWithUpload)
              return NextResponse.json(
                { 
                  error: "User does not have upload permission",
                  details: `Selected user_id ${finalUserId} has can_upload = false. Please ensure user_access table has a record with can_upload = true.`,
                  selected_user: userWithUpload
                },
                { status: 403 }
              )
            }
          } else {
            // 如果無法查詢，生成一個 UUID（可能會違反外鍵約束和 RLS policy）
            finalUserId = randomUUID()
            console.error("[POST /api/locations/register] ERROR: No user_access record found. Generated UUID:", finalUserId, "Original:", mockUserId)
            console.error("[POST /api/locations/register] This will likely fail due to RLS policy. Please ensure user_access table has records with can_upload = true")
          }
        } catch (error) {
          // 如果查詢失敗，生成一個 UUID
          finalUserId = randomUUID()
          console.warn("[POST /api/locations/register] Failed to query user_access, generated UUID:", finalUserId, "Error:", error)
        }
      }
      
      user = {
        id: finalUserId,
        email: body.user_email || 'unknown@example.com',
      } as any
      console.log("[POST /api/locations/register] Using mock authentication, user_id:", finalUserId)
    }
    
    // 如果還是沒有 user，回傳錯誤
    if (!user) {
      console.error("[POST /api/locations/register] No user found in Supabase Auth or request body")
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      )
    }

    // 3. 驗證必填欄位
    const { name, lat, lng, source } = body
    
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Field 'name' is required and must be a non-empty string" },
        { status: 400 }
      )
    }

    if (lat === undefined || lat === null || typeof lat !== "number") {
      return NextResponse.json(
        { error: "Field 'lat' is required and must be a number" },
        { status: 400 }
      )
    }

    if (lng === undefined || lng === null || typeof lng !== "number") {
      return NextResponse.json(
        { error: "Field 'lng' is required and must be a number" },
        { status: 400 }
      )
    }

    if (source !== 'google' && source !== 'manual') {
      return NextResponse.json(
        { error: "Field 'source' must be either 'google' or 'manual'" },
        { status: 400 }
      )
    }

    // 4. 驗證 lat/lng 範圍
    if (lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: "Field 'lat' must be between -90 and 90" },
        { status: 400 }
      )
    }

    if (lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: "Field 'lng' must be between -180 and 180" },
        { status: 400 }
      )
    }

    // 5. 如果是 Google Places，檢查去重（如果表有 google_place_id 欄位）
    // 注意：supabase client 已在步驟 2 建立
    // 先檢查表結構是否有 google_place_id 欄位
    // 如果 source='google' 且有 google_place_id，檢查是否已存在
    if (source === 'google' && body.google_place_id) {
      // 嘗試查詢是否有 google_place_id 欄位
      // 如果表沒有這個欄位，這個查詢會失敗，我們就跳過去重檢查
      try {
        const { data: existing } = await supabase
          .from("curved_treadmill_locations")
          .select("id, name")
          .eq("google_place_id", body.google_place_id)
          .maybeSingle()

        if (existing) {
          return NextResponse.json(
            {
              error: "此地點已經註冊過了",
              existing_id: existing.id,
              existing_name: existing.name,
            },
            { status: 409 }
          )
        }
      } catch (error: any) {
        // 如果表沒有 google_place_id 欄位，忽略錯誤繼續
        if (!error.message?.includes("column") && !error.message?.includes("does not exist")) {
          console.warn("[register] Could not check for duplicate google_place_id:", error.message)
        }
      }
    }

    // 6. 準備插入資料
    // 根據 migration 檔案，表結構包含：
    // - owner_user_id, name, lat, lng, address, city, description, contact_info
    // 注意：可能沒有 source、google_place_id 欄位
    // 先嘗試包含所有欄位，如果失敗會自動移除不存在的欄位
    const insertData: any = {
      owner_user_id: user.id,
      name: name.trim(),
      lat: Number(lat),
      lng: Number(lng),
    }
    
    // 可選欄位（如果表有這些欄位就加入）
    if (body.address) insertData.address = body.address
    if (body.city) insertData.city = body.city
    if (body.description) insertData.description = body.description
    // contact_info 可能不存在（schema cache 問題），先不加入，讓錯誤處理邏輯處理
    // if (body.contact_info) insertData.contact_info = body.contact_info

    // 嘗試加入 source 和 google_place_id（如果表有這些欄位）
    // 如果表沒有，Supabase 會忽略這些欄位
    if (source) {
      insertData.source = source
    }
    if (body.google_place_id) {
      insertData.google_place_id = body.google_place_id
    }

    // 7. 插入資料（RLS 會自動檢查 can_upload）
    const { data, error } = await supabase
      .from("curved_treadmill_locations")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("[POST /api/locations/register] Supabase error:", error)

            // 檢查是否為權限錯誤（RLS 拒絕）
            if (error.code === "42501" || error.message.includes("permission") || error.message.includes("policy") || error.message.includes("row-level security") || error.message.includes("violates row-level security")) {
              console.error("[POST /api/locations/register] ❌ RLS policy violation detected!")
              console.error("[POST /api/locations/register] Attempted owner_user_id:", user.id)
              console.error("[POST /api/locations/register] Checking if this user_id exists in user_access with can_upload = true...")
              
              // 驗證這個 user_id 是否真的在 user_access 表中且 can_upload = true
              const { data: verifyUser, error: verifyError } = await supabase
                .from('user_access')
                .select('user_id, can_upload, display_name')
                .eq('user_id', user.id)
                .maybeSingle()
              
              if (verifyError) {
                console.error("[POST /api/locations/register] Error verifying user:", verifyError)
              } else if (!verifyUser) {
                console.error("[POST /api/locations/register] ❌ User not found in user_access table!")
              } else {
                console.error("[POST /api/locations/register] User found in user_access:", verifyUser)
                console.error("[POST /api/locations/register] can_upload status:", verifyUser.can_upload)
              }
        console.error("[POST /api/locations/register] User ID used:", user.id)
        console.error("[POST /api/locations/register] Please check:")
        console.error("  1. user_access table has a record for user_id:", user.id)
        console.error("  2. can_upload = true for that user")
        console.error("  3. RLS policy allows INSERT for this user")
        console.error("  4. If using mock authentication, you may need to update RLS policy (see FIX_RLS_POLICY.sql)")
        
        return NextResponse.json(
          { 
            error: "Forbidden. You do not have permission to create locations.",
            details: "RLS policy violation: " + error.message,
            hint: "Please ensure the user exists in user_access table with can_upload = true. If using mock authentication, you may need to update the RLS policy (see FIX_RLS_POLICY.sql file)"
          },
          { status: 403 }
        )
      }

      // 檢查是否為欄位不存在的錯誤（包括 schema cache 錯誤）
      if (error.message.includes("column") || error.message.includes("does not exist") || error.message.includes("schema cache")) {
        console.warn("[POST /api/locations/register] Column error detected, retrying with minimal fields:", error.message)
        
        // 移除可能不存在的欄位，重試插入
        // 只保留 migration 檔案中確認存在的核心欄位
        const cleanedData: any = {
          owner_user_id: user.id,
          name: name.trim(),
          lat: Number(lat),
          lng: Number(lng),
        }
        
        // 只加入確認存在的可選欄位
        if (body.address) cleanedData.address = body.address
        if (body.city) cleanedData.city = body.city
        if (body.description) cleanedData.description = body.description
        // 如果 contact_info 欄位不存在，暫時跳過它
        // 如果錯誤訊息特別提到 contact_info，就不加入它
        if (!error.message.includes("contact_info")) {
          if (body.contact_info) cleanedData.contact_info = body.contact_info
        }

        const { data: retryData, error: retryError } = await supabase
          .from("curved_treadmill_locations")
          .insert(cleanedData)
          .select()
          .single()

        if (retryError) {
          console.error("[POST /api/locations/register] Retry failed:", retryError)
          return NextResponse.json(
            { 
              error: "Failed to create location", 
              details: retryError.message,
              hint: "Please check the database schema matches the migration file. You may need to run the migration SQL in Supabase."
            },
            { status: 500 }
          )
        }

        return NextResponse.json(
          {
            ok: true,
            id: retryData.id,
            message: "Location created successfully" + (error.message.includes("contact_info") ? " (contact_info field was omitted)" : ""),
            data: retryData,
          },
          { status: 201 }
        )
      }

      return NextResponse.json(
        { error: "Failed to create location", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        ok: true,
        id: data.id,
        message: "Location created successfully",
        data,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("[POST /api/locations/register] Unexpected error:", error)
    
    // 提供更詳細的錯誤訊息以便除錯
    const errorMessage = error?.message || "Unknown error"
    const errorStack = error?.stack || ""
    const errorName = error?.name || "Error"
    
    // 記錄完整的錯誤資訊
    console.error("[POST /api/locations/register] Error details:", {
      name: errorName,
      message: errorMessage,
      stack: errorStack,
      code: error?.code,
      cause: error?.cause,
    })
    
    // 在開發環境顯示完整錯誤，生產環境只顯示一般訊息
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: errorMessage,
        details: isDevelopment ? errorMessage : "伺服器發生錯誤，請稍後再試或聯絡管理員",
        // 只在開發環境提供 stack trace
        ...(isDevelopment && { stack: errorStack }),
      },
      { status: 500 }
    )
  }
}

