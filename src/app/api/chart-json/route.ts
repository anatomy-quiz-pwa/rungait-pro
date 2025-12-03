// app/api/chart-json/route.ts
import { NextRequest } from "next/server";

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_RESULTS || "";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return new Response("Missing path", { status: 400 });
  }

  if (!R2_BASE) {
    return new Response("R2 base URL not configured", { status: 500 });
  }

  // 把 path decode 回來（因為前端會 encodeURIComponent）
  const rawPath = decodeURIComponent(path);

  // 清理 base & path
  const cleanBase = R2_BASE.replace(/\/+$/, "");
  let cleanPath = rawPath.replace(/^\/+/, "");

  // 如果不小心存進來的是 "runpose-results/..."，這邊幫你砍掉 prefix
  if (cleanPath.startsWith("runpose-results/")) {
    cleanPath = cleanPath.slice("runpose-results/".length);
  }

  // 把 @ 轉成 %40，確保跟你測試成功的 URL 一樣
  const encodedPath = encodeURI(cleanPath).replace(/@/g, "%40");
  const url = `${cleanBase}/${encodedPath}`;

  console.log("[chart-json API] fetch R2:", url);

  const upstream = await fetch(url);

  if (!upstream.ok) {
    return new Response(
      `R2 upstream error: ${upstream.status}`,
      { status: upstream.status }
    );
  }

  const data = await upstream.text(); // 先拿文字，再回傳 JSON
  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
}
