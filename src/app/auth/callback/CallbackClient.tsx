// src/app/auth/callback/CallbackClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState("正在完成登入驗證...");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // 預設 onboarding
      const nextDefault = "/onboarding";
      const nextFromUrl = sp.get("next");
      const fallbackNext = nextFromUrl || nextDefault;

      // 1️⃣ 取得 session（Supabase 會處理 URL token）
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;

      if (error) {
        setMsg(`驗證失敗：${error.message}`);
        return;
      }

      if (!data.session) {
        // token 交換有時略慢，等一下再試
        setMsg("即將完成，請稍候...");
        setTimeout(run, 600);
        return;
      }

      const user = data.session.user;

      // 2️⃣ 查 user_access 判斷是否已完成 onboarding
      const { data: ua, error: e2 } = await supabase
        .from("user_access")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (e2) {
        setMsg(`讀取使用者資料失敗：${e2.message}`);
        return;
      }

      const hasOnboarded =
        !!ua?.display_name && ua.display_name.trim().length > 0;

      // 3️⃣ 導向決策
      if (hasOnboarded) {
        // 已完成 onboarding → 正常登入
        router.replace(nextFromUrl || "/");
      } else {
        // 第一次登入 → 去填資料
        router.replace("/onboarding");
      }
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
