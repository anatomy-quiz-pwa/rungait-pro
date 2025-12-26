import { createClient } from "@supabase/supabase-js"

// 延遲建立 client，避免在 build 時檢查環境變數
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL. Please set it in .env.local")
  }
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Please set it in .env.local")
  }
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

// 在 client component 中使用時才建立
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    if (!supabaseInstance) {
      supabaseInstance = getSupabaseClient()
    }
    return (supabaseInstance as any)[prop]
  },
})

