// src/app/auth/callback/CallbackClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type UA = { display_name: string | null; phone: string | null };

function isProfileComplete(ua: UA | null) {
  // 你想要「只要姓名就算完成」也可以，把 phone 條件拿掉即可
  const dn = (ua?.display_name ?? "").trim();
  const ph = (ua?.phone ?? "").trim();
  return dn.length > 0 && ph.length > 0;
}

export default function CallbackClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [msg, setMsg] = useState("正在完成登入驗證...");

  useEffect(() => {
    let cancelled = false;

    async function finalize() {
      // 1) 取得 session（Supabase 在這步會處理 URL token）
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;

      if (error) {
        setMsg(`驗證失敗：${error.message}`);
        return;
      }

      const session = data.session;
      if (!session) {
        setMsg("尚未建立登入狀態，請回到 Login 再試一次。");
        return;
      }

      // 2) 取得 user（保險）
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      if (!user) {
        setMsg("讀取使用者資訊失敗，請回到 Login 再試一次。");
        return;
      }

      // 3) 查 user_access 判斷是否已完成基本資料
      setMsg("正在載入會員資料...");
      const { data: ua, error: e2 } = await supabase
        .from("user_access")
        .select("display_name, phone")
        .eq("user_id", user.id)
        .maybeSingle<UA>();

      if (cancelled) return;

      if (e2) {
        // 如果這裡出錯，通常是 RLS/trigger 沒建好
        setMsg(`讀取會員資料失敗：${e2.message}`);
        return;
      }

      // 4) 決定導向
      const next = sp.get("next"); // 若你未來想保留「原本想去的頁面」可用
      const completed = isProfileComplete(ua ?? null);

      // 規則：
      // - 若資料不完整：一定去 onboarding
      // - 若資料完整：去 next（若有）否則回首頁
      if (!completed) {
        router.replace("/onboarding");
        return;
      }

      router.replace(next && next.startsWith("/") ? next : "/");
    }

    finalize();
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
