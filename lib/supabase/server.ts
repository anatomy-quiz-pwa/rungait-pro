import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"

/**
 * Server-side Supabase client for API routes
 * 使用 anon key，透過 request headers 或 cookies 取得使用者 session
 */
export async function createServerClient(request?: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    )
  }

  // 嘗試從 Authorization header 取得 token
  let accessToken: string | undefined
  if (request) {
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.substring(7)
    }
  }

  // 如果沒有從 header 取得，嘗試從 cookies 取得
  if (!accessToken) {
    const cookieStore = await cookies()
    // Supabase 標準 cookie 名稱格式: sb-<project-ref>-auth-token
    // 或使用通用的 sb-access-token
    const projectRef = supabaseUrl.split("//")[1]?.split(".")[0] || ""
    const cookieName = projectRef ? `sb-${projectRef}-auth-token` : "sb-access-token"
    accessToken = cookieStore.get(cookieName)?.value || cookieStore.get("sb-access-token")?.value
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  })

  return client
}

/**
 * 取得當前登入的使用者
 * 從 Supabase session 中取得 user
 */
export async function getServerUser(request?: NextRequest) {
  const supabase = await createServerClient(request)
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

