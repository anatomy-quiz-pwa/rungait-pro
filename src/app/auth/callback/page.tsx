// src/app/auth/callback/page.tsx
import { Suspense } from "react";
import CallbackClient from "./CallbackClient";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0f14] text-white flex items-center justify-center">
          <div className="text-white/70">正在驗證登入狀態...</div>
        </div>
      }
    >
      <CallbackClient />
    </Suspense>
  );
}
