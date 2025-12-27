'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function AuthBadge() {
  const [uid, setUid] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    const supabase = supabaseBrowser()
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null))
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUid(session?.user?.id ?? null)
    })
    return () => subscription?.subscription.unsubscribe()
  }, [])

  if (uid === undefined) {
    return <span className="text-slate-400">載入中…</span>
  }

  if (!uid) {
    return <span className="text-rose-400">未登入（請至 /auth）</span>
  }

  return <span className="text-emerald-400">已登入：{uid.slice(0, 8)}…</span>
}


