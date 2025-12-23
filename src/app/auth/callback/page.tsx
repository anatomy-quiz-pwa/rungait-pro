// src/app/auth/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState("正在完成登入驗證...");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // next 預設導去 onboarding
      const next = sp.get("next") || "/onboarding";

      // 嘗試取得 session（Supabase 會在這一步處理 URL 中的 token）
      const { data, error } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error) {
        setMsg(`驗證失敗：${error.message}`);
        return;
      }

      if (data.session) {
        router.replace(next);
        return;
      }

      // 有時 token 交換會慢一點，稍等再試一次
      setMsg("即將完成，請稍候...");
      setTimeout(async () => {
        const { data: d2 } = await supabase.auth.getSession();
        if (!cancelled) {
          if (d2.session) router.replace(next);
          else setMsg("尚未建立登入狀態，請回到 Login 再試一次。");
        }
      }, 600);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router, sp]);

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">Auth Callback</div>
        <div className="mt-3 text-sm text-white/70">{msg}</div>
      </div>
    </div>
  );
}
