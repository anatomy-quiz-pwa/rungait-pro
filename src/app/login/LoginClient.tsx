// src/app/login/LoginClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const initialMode = (sp.get("mode") === "signup" ? "signup" : "signin") as
    | "signin"
    | "signup";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const origin = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  const emailRedirectTo = useMemo(() => {
    return `${origin}/auth/callback?next=/onboarding`;
  }, [origin]);

  useEffect(() => {
    // 已登入就回首頁（或你想導 onboarding）
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace("/");
    })();
  }, [router]);

  async function onSignInEmail() {
    setBusy(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) setMsg(`登入失敗：${error.message}`);
    else router.replace("/");

    setBusy(false);
  }

  async function onSignUpEmail() {
    setBusy(true);
    setMsg(null);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo },
    });

    if (error) {
      setMsg(`註冊失敗：${error.message}`);
      setBusy(false);
      return;
    }

    // Confirm email 開啟 → session 通常為 null
    if (!data.session) {
      setMsg("註冊成功！請到信箱點擊驗證連結完成註冊。驗證後會自動導回網站建立基本資料。");
    } else {
      router.replace("/onboarding");
    }

    setBusy(false);
  }

  async function onGoogle() {
    setBusy(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      setMsg(`Google 登入失敗：${error.message}`);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-2xl font-semibold">
          {mode === "signin" ? "Login" : "Sign up"}
        </div>

        <div className="mt-2 text-sm text-white/70">
          {mode === "signin"
            ? "使用 Email + Password 登入，或使用 Google 一鍵登入。"
            : "建立帳號後需要 Email 驗證，驗證完成會引導你填寫基本資料。"}
        </div>

        <div className="mt-6 space-y-4">
          <button
            disabled={busy}
            onClick={onGoogle}
            className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm hover:bg-white/10 disabled:opacity-60"
          >
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-white/40">
            <div className="h-px flex-1 bg-white/10" />
            <div className="text-xs">OR</div>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div>
            <label className="text-sm text-white/70">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/30"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm text-white/70">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/30"
              placeholder="Password"
            />
            <div className="mt-1 text-xs text-white/50">
              建議至少 8 碼。
            </div>
          </div>

          {msg && (
            <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white/80">
              {msg}
            </div>
          )}

          {mode === "signin" ? (
            <button
              disabled={busy}
              onClick={onSignInEmail}
              className="w-full rounded-xl bg-[#0ea5e9] px-4 py-2.5 font-medium text-black hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Signing in..." : "Login"}
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={onSignUpEmail}
              className="w-full rounded-xl bg-[#0ea5e9] px-4 py-2.5 font-medium text-black hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Signing up..." : "Create account"}
            </button>
          )}

          <div className="mt-2 text-sm text-white/70">
            {mode === "signin" ? (
              <button
                className="underline hover:text-white"
                onClick={() => {
                  setMsg(null);
                  setMode("signup");
                }}
              >
                沒有帳號？Sign up
              </button>
            ) : (
              <button
                className="underline hover:text-white"
                onClick={() => {
                  setMsg(null);
                  setMode("signin");
                }}
              >
                已有帳號？Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
