import { NextRequest, NextResponse } from "next/server"
import { createServerClient, getServerUser } from "@/lib/supabase/server"

/**
 * GET /api/locations
 * 取得所有 curved treadmill locations（公開，無需登入）
 * 使用 view: public.curved_treadmill_locations_view
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(request)

    // 查詢 view
    const { data, error } = await supabase
      .from("curved_treadmill_locations_view")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[GET /api/locations] Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to fetch locations", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data || [],
    })
  } catch (error) {
    console.error("[GET /api/locations] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/locations
 * 建立新的 curved treadmill location（需登入且 can_upload=true）
 * - 不接受前端傳 owner_user_id，後端自動填入 auth.uid()
 * - 驗證必填：name, lat, lng
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 檢查登入狀態
    const user = await getServerUser(request)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      )
    }

    // 2. 解析請求 body
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    // 3. 驗證必填欄位
    const { name, lat, lng } = body
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

    // 5. 準備插入資料（不允許前端設定 owner_user_id）
    const insertData = {
      owner_user_id: user.id, // 強制使用當前登入使用者
      name: name.trim(),
      lat: Number(lat),
      lng: Number(lng),
      address: body.address || null,
      city: body.city || null,
      description: body.description || null,
      contact_info: body.contact_info || null,
    }

    // 6. 插入資料（RLS 會自動檢查 can_upload）
    const supabase = await createServerClient(request)
    const { data, error } = await supabase
      .from("curved_treadmill_locations")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("[POST /api/locations] Supabase error:", error)

      // 檢查是否為權限錯誤（RLS 拒絕）
      if (error.code === "42501" || error.message.includes("permission") || error.message.includes("policy")) {
        return NextResponse.json(
          { 
            error: "Forbidden. You do not have permission to create locations. Please ensure can_upload is enabled in your account.",
            details: "RLS policy violation: user_access.can_upload must be true"
          },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: "Failed to create location", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Location created successfully",
        data,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[POST /api/locations] Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

