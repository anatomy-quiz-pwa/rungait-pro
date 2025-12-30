// src/app/onboarding/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      const { data, error } = await supabase.auth.getUser();
      if (cancelled) return;

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setEmail(data.user.email ?? "");

      // 讀既有 user_access（trigger 應該已建立）
      const { data: ua, error: e2 } = await supabase
        .from("user_access")
        .select("display_name, phone")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!cancelled) {
        if (e2) {
          // 若 RLS/trigger 有問題，你會在這邊看到
          setErr(`讀取會員資料失敗：${e2.message}`);
        } else {
          setDisplayName(ua?.display_name ?? "");
          setPhone(ua?.phone ?? "");
        }
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSave() {
    setSaving(true);
    setErr(null);
    setOk(null);

    const { data: u } = await supabase.auth.getUser();
    const user = u.user;
    if (!user) {
      router.replace("/login");
      return;
    }

    const dn = displayName.trim();
    const ph = phone.trim();

    const { error } = await supabase
      .from("user_access")
      .update({ display_name: dn || null, phone: ph || null })
      .eq("user_id", user.id);

    if (error) {
      setErr(`儲存失敗：${error.message}`);
    } else {
      setOk("已儲存。");
      // 你想要儲存後導去哪：先回首頁或 upload
      router.replace("/");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f14] text-white flex items-center justify-center px-6">
        <div className="text-white/70">載入中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white px-6 py-14">
      <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-2xl font-semibold">建立你的基本資料</div>
        <div className="mt-2 text-sm text-white/70">
          Email 已驗證後即可開始使用。你可以先填基本資料，之後也可再修改。
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <div className="text-sm text-white/70">Email</div>
            <div className="mt-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm">
              {email || "--"}
            </div>
          </div>

          <div>
            <label className="text-sm text-white/70">姓名（display name）</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/30"
              placeholder="例如：Archie"
            />
          </div>

          <div>
            <label className="text-sm text-white/70">電話（選填）</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/30"
              placeholder="例如：09xx-xxx-xxx"
            />
          </div>

          {err && <div className="text-sm text-red-300">{err}</div>}
          {ok && <div className="text-sm text-green-300">{ok}</div>}

          <button
            disabled={saving}
            onClick={onSave}
            className="w-full rounded-xl bg-[#0ea5e9] px-4 py-2.5 font-medium text-black hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "儲存中..." : "儲存並繼續"}
          </button>
        </div>
      </div>
    </div>
  );
}
