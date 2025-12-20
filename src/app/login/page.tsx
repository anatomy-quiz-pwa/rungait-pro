// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("suntest@test.com");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setMsg("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setMsg("登入失敗：" + error.message);
      return;
    }

    // 登入成功 → 前往 upload
    router.push("/upload");
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/10 dark:bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4 shadow-lg">
        <h1 className="text-2xl font-bold text-center">登入後才能上傳</h1>

        <div className="space-y-1">
          <label className="text-sm text-zinc-400">Email</label>
          <input
            type="email"
            className="w-full border border-zinc-600 bg-zinc-950/60 text-white p-2 rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="請輸入 email"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-400">Password</label>
          <input
            type="password"
            className="w-full border border-zinc-600 bg-zinc-950/60 text-white p-2 rounded-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="請輸入密碼"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full p-3 rounded-md font-semibold text-white ${
            loading
              ? "bg-zinc-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "登入中…" : "登入"}
        </button>

        {msg && <p className="text-sm text-red-400 whitespace-pre-wrap">{msg}</p>}

        <div className="text-xs text-zinc-400">
          <p>目前採白名單帳號制：你必須先被管理者建立帳號並開通上傳權限。</p>
          <Link href="/" className="underline hover:text-blue-400">
            回首頁
          </Link>
        </div>
      </div>
    </main>
  );
}
