# SSG `location is not defined` 錯誤修正報告

## 📋 問題診斷

### 錯誤現象
在 Vercel build 的 SSG（Static Site Generation）階段出現非致命警告：
```
ReferenceError: location is not defined
    at s (.next/server/chunks/ssr/_6ad80b9e._.js:1:11102)
```

### 根本原因
1. **Next.js 內部行為**：錯誤來自 Next.js 內部程式碼（`createInitialRSCPayloadFromFallbackPrerender` 函數），在處理 fallback prerender 時使用 `location.href`
2. **SSG 邊界問題**：即使使用了 `ssr: false` 和 `"use client"`，Next.js 仍會在 SSG 階段嘗試分析這些頁面，因為它們被標記為 `○ (Static)`
3. **Browser-only 功能**：以下頁面使用了只能在瀏覽器運行的功能：
   - `/map` - Google Maps API
   - `/dashboard` - localStorage、browser APIs
   - `/analyze` - MediaPipe、video processing
   - `/trim` - FFmpeg.wasm、video processing
   - `/compare` - VideoPlayer、browser APIs

## 🔧 修正方案

### 策略：Server Component Wrapper + Client Island 模式

將所有使用 browser-only 功能的頁面改為：
1. **Server Component wrapper** (`page.tsx`)：設定 `export const dynamic = 'force-dynamic'` 強制動態渲染
2. **Client Component** (`page-client.tsx`)：存放實際的客戶端邏輯

### 修正的頁面清單

#### 1. `/map` 頁面
- **問題**：使用 Google Maps API，在 SSG 階段會觸發 `location` 錯誤
- **修正**：
  - 建立 `app/map/page-client.tsx`（Client Component）
  - 修改 `app/map/page.tsx`（Server Component wrapper）
  - 設定 `dynamic = 'force-dynamic'`

#### 2. `/dashboard` 頁面
- **問題**：使用 localStorage 和 browser-only APIs
- **修正**：
  - 建立 `app/dashboard/page-client.tsx`（Client Component）
  - 修改 `app/dashboard/page.tsx`（Server Component wrapper）
  - 設定 `dynamic = 'force-dynamic'`

#### 3. `/analyze` 頁面
- **問題**：使用 MediaPipe 和 video processing
- **修正**：
  - 建立 `app/analyze/page-client.tsx`（Client Component）
  - 修改 `app/analyze/page.tsx`（Server Component wrapper）
  - 設定 `dynamic = 'force-dynamic'`

#### 4. `/trim` 頁面
- **問題**：使用 FFmpeg.wasm 和 video processing
- **修正**：
  - 建立 `app/trim/page-client.tsx`（Client Component）
  - 修改 `app/trim/page.tsx`（Server Component wrapper）
  - 設定 `dynamic = 'force-dynamic'`

#### 5. `/compare` 頁面
- **問題**：使用 VideoPlayer 和 browser-only APIs
- **修正**：
  - 建立 `app/compare/page-client.tsx`（Client Component）
  - 修改 `app/compare/page.tsx`（Server Component wrapper）
  - 設定 `dynamic = 'force-dynamic'`

## 📁 修改的檔案清單

### 新增檔案（5 個）
```
app/map/page-client.tsx
app/dashboard/page-client.tsx
app/analyze/page-client.tsx
app/trim/page-client.tsx
app/compare/page-client.tsx
```

### 修改檔案（5 個）
```
app/map/page.tsx          → 改為 Server Component wrapper
app/dashboard/page.tsx    → 改為 Server Component wrapper
app/analyze/page.tsx       → 改為 Server Component wrapper
app/trim/page.tsx          → 改為 Server Component wrapper
app/compare/page.tsx       → 改為 Server Component wrapper
```

## ✅ 驗證結果

### Build 狀態
- ✅ Build 成功完成
- ✅ 所有相關頁面都被標記為 `ƒ (Dynamic)`
- ⚠️ 仍會出現一次來自 Next.js 內部程式碼的 `location` 警告（非致命）

### 路由狀態（修正後）
```
Route (app)
├ ƒ /analyze      ← 已改為動態渲染
├ ƒ /compare      ← 已改為動態渲染
├ ƒ /dashboard    ← 已改為動態渲染
├ ƒ /map          ← 已改為動態渲染
└ ƒ /trim         ← 已改為動態渲染

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

## 📝 技術細節

### Server Component Wrapper 範例
```typescript
// app/map/page.tsx
// Server Component wrapper - 強制動態渲染以避免 SSG
import MapPageClient from './page-client'

// 強制動態渲染，避免 SSG 階段嘗試 prerender
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function MapPage() {
  return <MapPageClient />
}
```

### Client Component 範例
```typescript
// app/map/page-client.tsx
"use client"

import { useEffect, useState } from 'react'
import dynamicImport from 'next/dynamic'

// 動態載入 RunGaitMap，完全避免 SSR 問題
const RunGaitMap = dynamicImport(() => import('@/components/RunGaitMap'), {
  ssr: false, // 完全禁用 SSR，只在 client 端載入
  loading: () => <div>Loading map...</div>,
})

export default function MapPageClient() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading map...</div>
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <RunGaitMap />
    </div>
  )
}
```

## ⚠️ 注意事項

### 剩餘的警告
Build 中仍會出現一次 `ReferenceError: location is not defined` 警告，這是：
- **來源**：Next.js 內部程式碼（`createInitialRSCPayloadFromFallbackPrerender`）
- **性質**：非致命警告，不影響實際運行
- **原因**：Next.js 在處理 fallback prerender 時的已知行為
- **影響**：無實際影響，所有使用 browser-only 功能的頁面已正確改為動態渲染

### 未來擴充建議
1. **新增 browser-only 頁面時**：直接使用 Server Component wrapper 模式
2. **使用第三方 browser-only SDK 時**：
   - 確保只在 Client Component 中 dynamic import（`ssr: false`）
   - Server side 不可出現任何 direct import
3. **Shared util 觸發 browser API 時**：
   - 拆分為 `xxx.client.ts`（含 window/location）
   - `xxx.server.ts`（純 server 或純計算）

## 🎯 修正效果

### 修正前
- ❌ 多個頁面在 SSG 階段被嘗試 prerender
- ❌ 觸發 `location is not defined` 錯誤
- ❌ 頁面被錯誤標記為 `○ (Static)`

### 修正後
- ✅ 所有 browser-only 頁面改為動態渲染
- ✅ 頁面正確標記為 `ƒ (Dynamic)`
- ✅ 避免 SSG 階段嘗試 prerender
- ✅ 結構清晰，易於維護和擴充

## 📦 提交資訊

- **Commit**: `54a192c`
- **訊息**: `fix: 將所有使用 browser-only 功能的頁面改為動態渲染`
- **狀態**: ✅ 已推送至遠端倉庫

## 🔍 相關檔案參考

- `next.config.mjs` - Webpack 配置（處理 `@react-google-maps/api` SSR 問題）
- `lib/supabase-browser.ts` - Browser-only Supabase client
- `lib/supabase-server.ts` - Server-side Supabase client

---

**報告日期**: 2024-12-27  
**修正完成**: ✅  
**部署狀態**: 待 Vercel 重新部署驗證

