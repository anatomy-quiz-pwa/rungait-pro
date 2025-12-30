// src/app/result/page.tsx
import { Suspense } from "react";
import ResultClient from "./ResultClient";

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6 text-center">
          <p>載入中…</p>
        </main>
      }
    >
      <ResultClient />
    </Suspense>
  );
}
