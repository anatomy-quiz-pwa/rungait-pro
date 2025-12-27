import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'

/**
 * Server-side Supabase client for Server Components and Route Handlers
 * 使用 @supabase/ssr 的標準方式，絕對不會使用 window/document/location
 */
export const supabaseServer = async (request?: NextRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )
  }

  const cookieStore = await cookies()
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // 在 Route Handler 中，cookies().set() 可能需要在 Response 中設定
          // 這裡只記錄錯誤，不拋出，因為某些情況下（如 GET）可能不需要設定 cookie
          console.warn('[supabase-server] Failed to set cookie:', error)
        }
      },
    },
  })
}

/**
 * 取得當前登入的使用者（Server-side）
 */
export async function getServerUser(request?: NextRequest) {
  const supabase = await supabaseServer(request)
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

