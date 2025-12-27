'use client'
import { supabaseBrowser } from '@/lib/supabase-browser'

export async function checkLastUpload() {
  const supabase = supabaseBrowser()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) {
    throw new Error('尚未登入')
  }

  const { data, error } = await supabase
    .from('videos')
    .select('id, public_url, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    throw error
  }

  return data?.[0] ?? null
}


