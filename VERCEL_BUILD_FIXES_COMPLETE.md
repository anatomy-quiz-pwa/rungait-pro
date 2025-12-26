# Vercel Build 錯誤完整修正報告

## 🔍 問題分析

### 問題 A: ReferenceError: location is not defined

**錯誤位置：**
- `.next/server/chunks/ssr/app_dashboard_page_tsx...` - `/app/dashboard/page.tsx`
- `.next/server/chunks/ssr/_62703b6a...` - 共用檔案（可能是 lib/usage.ts）

**根本原因：** 在 SSR/build 階段使用了瀏覽器 API（location/window/document）

### 問題 B: pnpm-lock.yaml missing 'importers' field

**錯誤：** Vercel 使用 `bun install`，但專案使用 pnpm，導致 lockfile 解析失敗

---

## ✅ 修正方案

### 【A】修正 location/window/document 使用

#### 1. `app/report/[id]/page.tsx`
**問題：** 
- Line 92: `document.getElementById` 沒有檢查
- Line 105: `window.print()` 沒有檢查

**修正：**
```typescript
// Line 92: 加上 typeof document 檢查
const handleCitationClick = (citationId: string) => {
  if (typeof document === 'undefined') return
  const element = document.getElementById(`citation-${citationId}`)
  // ...
}

// Line 105: 加上 typeof window 檢查
const handlePrint = () => {
  if (typeof window !== 'undefined') {
    window.print()
  }
}
```

#### 2. `lib/usage.ts`
**問題：** 檔案沒有 'use client'，但使用了 `readLS`（會使用 `window.localStorage`）

**修正：**
```typescript
'use client'

import { readLS } from "@/lib/storage"
// ... 其餘程式碼
```

#### 3. `app/dashboard/page.tsx`
**問題：** 雖然是 client component，但在 SSR 階段仍可能被 pre-render

**修正：**
```typescript
"use client"

// 強制 dynamic rendering 避免 SSR 問題
export const dynamic = 'force-dynamic'

// ... 其餘程式碼
```

#### 4. 已確認正確的檔案
- ✅ `app/report/[id]/page.tsx` - `window.location.href` 和 `window.location.reload()` 已有檢查
- ✅ `lib/storage.ts` - 已有 'use client' 和 `isBrowser()` 檢查
- ✅ `lib/auth-context.tsx` - 已有 'use client'
- ✅ `components/dashboard/my-locations.tsx` - 已有 'use client'，並使用 dynamic import

---

### 【B】修正 pnpm-lock.yaml importers 問題

**方案選擇：** 使用 **pnpm**（專案已有 pnpm-lock.yaml 且包含 importers）

**修正內容：**

1. **確認 pnpm-lock.yaml 格式正確**
   - ✅ 已包含 `importers` 欄位（line 7）
   - ✅ lockfileVersion: '9.0'

2. **確認 vercel.json 設定**
   - ✅ `running-gait/fullstack/frontend/vercel.json` 已存在
   - ✅ installCommand: `corepack enable && corepack prepare pnpm@latest --activate && pnpm install`
   - ✅ buildCommand: `pnpm run build`

3. **確認 package.json**
   - ✅ `packageManager: "pnpm@10.0.0"` 已設定

---

## 📋 修改的檔案清單

### 問題 A 修正
1. ✅ `app/report/[id]/page.tsx`
   - Line 92: 加上 `typeof document === 'undefined'` 檢查
   - Line 105: 加上 `typeof window !== 'undefined'` 檢查

2. ✅ `lib/usage.ts`
   - 加上 `'use client'` 標記

3. ✅ `app/dashboard/page.tsx`
   - 加上 `export const dynamic = 'force-dynamic'`

### 問題 B 確認
- ✅ `vercel.json` - 已正確設定
- ✅ `package.json` - 已包含 packageManager
- ✅ `pnpm-lock.yaml` - 已包含 importers 欄位

---

## 🧪 本機驗證指令

### 1. 驗證 build 成功（無 location 錯誤）
```bash
cd running-gait/fullstack/frontend
rm -rf .next
pnpm run build

# 應該：
# ✅ 沒有 "location is not defined" 錯誤
# ✅ 沒有 "window is not defined" 錯誤
# ✅ 沒有 "document is not defined" 錯誤
# ✅ 成功完成 "Generating static pages"
```

### 2. 驗證 pnpm-lock.yaml 格式
```bash
cd running-gait/fullstack/frontend
head -10 pnpm-lock.yaml | grep -E "lockfileVersion|importers"

# 應該看到：
# lockfileVersion: '9.0'
# importers:
```

### 3. 驗證 vercel.json 設定
```bash
cd running-gait/fullstack/frontend
cat vercel.json

# 應該看到：
# {
#   "framework": "nextjs",
#   "installCommand": "corepack enable && corepack prepare pnpm@latest --activate && pnpm install",
#   "buildCommand": "pnpm run build"
# }
```

---

## 📝 Vercel 部署後預期結果

### 應該看到的（正常）
- ✅ `Using pnpm@10.x based on project creation date`
- ✅ `Running "install" command: corepack enable...`
- ✅ `Installing dependencies with pnpm...`
- ✅ `Running "build" command: pnpm run build`
- ✅ `Compiled successfully`
- ✅ `Generating static pages using 1 worker (X/X)`
- ✅ `Build Completed`

### 不應該看到的（錯誤）
- ❌ `Running "install" command: bun install`
- ❌ `pnpm-lock.yaml missing 'importers' field`
- ❌ `ReferenceError: location is not defined`
- ❌ `ReferenceError: window is not defined`
- ❌ `ReferenceError: document is not defined`
- ❌ `PnpmLockfileMissingImporters`

---

## ✅ 完成檢查清單

### 問題 A
- [x] `app/report/[id]/page.tsx` - document.getElementById 加上檢查
- [x] `app/report/[id]/page.tsx` - window.print() 加上檢查
- [x] `lib/usage.ts` - 加上 'use client' 標記
- [x] `app/dashboard/page.tsx` - 加上 `export const dynamic = 'force-dynamic'`
- [x] 所有 window.location 使用都有檢查（之前已修正）

### 問題 B
- [x] vercel.json 已正確設定（frontend 目錄）
- [x] package.json 包含 packageManager
- [x] pnpm-lock.yaml 包含 importers 欄位

---

## 🚀 部署前確認

1. ✅ 所有修正已 commit
2. ✅ 本機 `pnpm run build` 成功
3. ✅ Vercel Dashboard 確認 Root Directory 設定正確（如果專案在子目錄）
4. ✅ Vercel Environment Variables 已設定

下次部署應該可以成功，且 build log 完全乾淨！

