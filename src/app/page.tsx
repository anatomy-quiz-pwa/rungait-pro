// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type UserAccessRow = {
  display_name: string | null;
};

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      // 1) 讀目前使用者
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;

      if (error || !data.user) {
        setUserEmail(null);
        setDisplayName(null);
        setLoading(false);
        return;
      }

      setUserEmail(data.user.email ?? null);

      // 2) 讀你的 user_access（用來顯示「歡迎 XXX」）
      const { data: ua } = await supabase
        .from("user_access")
        .select("display_name")
        .eq("user_id", data.user.id)
        .maybeSingle<UserAccessRow>();

      setDisplayName(ua?.display_name ?? null);
      setLoading(false);
    }

    load();

    // 監聽登入狀態變化（登入/登出後右上角立即更新）
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onLogout() {
    await supabase.auth.signOut();
  }

  const welcomeText =
    displayName?.trim()
      ? `歡迎 ${displayName.trim()}`
      : userEmail
        ? `歡迎 ${userEmail}`
        : null;

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white">
      {/* Banner */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="text-lg font-semibold">Gait Analysis</div>
            <nav className="hidden gap-4 text-sm text-white/70 md:flex">
              <a className="hover:text-white" href="#">Dashboard</a>
              <a className="hover:text-white" href="#">Library</a>
              <a className="hover:text-white" href="#">Map</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {!loading && welcomeText ? (
              <>
                <div className="text-sm text-white/80">{welcomeText}</div>
                <button
                  onClick={onLogout}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="rounded-lg bg-[#0ea5e9] px-3 py-1.5 text-sm font-medium text-black hover:opacity-90"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-6 py-14">
        <div className="text-center">
          <h1 className="text-4xl font-semibold md:text-6xl">
            Running Gait Analysis
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/70 md:text-lg">
            Clinical-grade biomechanical assessment for coaches, clinicians, and athletes
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 md:flex-row">
            <Link
              href="/upload"
              className="rounded-xl bg-[#0ea5e9] px-6 py-3 font-medium text-black hover:opacity-90"
            >
              Log in and upload your running video
            </Link>
            <button
              className="rounded-xl border border-white/15 px-6 py-3 text-white/90 hover:bg-white/10"
              onClick={() => alert("之後再接地圖或店家搜尋")}
            >
              Find a curved treadmill nearby
            </button>
          </div>
        </div>

        {/* 4 cards */}
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <FeatureCard
            title="Single Analysis"
            desc="Upload and analyze a single running video with detailed biomechanical assessment"
          />
          <FeatureCard
            title="Before/After Comparison"
            desc="Compare two analyses to track progress and measure improvements over time"
          />
          <FeatureCard
            title="Clinical Reports"
            desc="Generate print-friendly clinical reports with findings and recommendations"
          />
          <FeatureCard
            title="Analysis Library"
            desc="Browse and manage your saved gait analyses in one organized place"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard(props: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm">
      <div className="text-xl font-semibold">{props.title}</div>
      <p className="mt-2 text-sm text-white/70">{props.desc}</p>
      <div className="mt-4 text-sm text-[#38bdf8]">Get Started →</div>
    </div>
  );
}
