// src/app/login/page.tsx
import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0f14] text-white flex items-center justify-center px-6">
          <div className="text-white/70">載入登入頁...</div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
