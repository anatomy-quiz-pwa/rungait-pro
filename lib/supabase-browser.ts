'use client'
import { createClient } from '@supabase/supabase-js'

/**
 * Browser-only Supabase client
 * 只能在 Client Component 中使用
 * 使用 lazy create 避免在 module top-level 建立 singleton
 */
export const supabaseBrowser = () => {
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

