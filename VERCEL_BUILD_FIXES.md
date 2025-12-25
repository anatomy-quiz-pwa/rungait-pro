# Vercel Build 錯誤修正總結

## ✅ 問題 1：pnpm-lock.yaml missing 'importers' field

### 問題分析
Vercel 偵測到 bun 並嘗試使用 `bun install`，但專案使用 pnpm，導致 lockfile 解析失敗。

### 修正方案
選擇使用 **pnpm**（專案已有 pnpm-lock.yaml 且 vercel.json 已設定）

### 修正內容

#### 1. `package.json`
新增 `packageManager` 欄位：
```json
"packageManager": "pnpm@10.0.0"
```

#### 2. `vercel.json` (根目錄)
更新 install command 確保使用 corepack：
```json
{
  "framework": "nextjs",
  "installCommand": "corepack enable && corepack prepare pnpm@latest --activate && pnpm install",
  "buildCommand": "pnpm run build"
}
```

### 驗證
- ✅ pnpm-lock.yaml 已包含 `importers` 欄位（lockfileVersion: '9.0'）
- ✅ package.json 指定使用 pnpm@10.0.0
- ✅ vercel.json 明確指定使用 pnpm

---

## ✅ 問題 2：ReferenceError: location is not defined

### 問題分析
在 SSR/build 階段使用了瀏覽器 API（window.location, window, document），導致 build 失敗。

### 修正檔案清單

#### 1. `hooks/use-mobile.ts`
**問題：** 缺少 'use client'，且在 useEffect 中直接使用 window
**修正：**
- 新增 `'use client'` 標記
- 在 useEffect 開始時檢查 `typeof window !== 'undefined'`
- 所有 window 使用都加上檢查

#### 2. `components/ui/use-mobile.tsx`
**問題：** 與 hooks/use-mobile.ts 重複，同樣缺少檢查
**修正：**
- 新增 `'use client'` 標記
- 加上 window 檢查

#### 3. `lib/video-client.ts`
**問題：** 缺少 'use client'，在 module scope 使用 document
**修正：**
- 新增 `'use client'` 標記
- 在函數開始時檢查 `typeof window !== 'undefined' && typeof document !== 'undefined'`
- 拋出明確錯誤如果不在瀏覽器環境

#### 4. `components/ui/sidebar.tsx`
**問題：** 已有 'use client'，但 document.cookie 和 window.addEventListener 沒有檢查
**修正：**
- document.cookie 使用前檢查 `typeof document !== 'undefined'`
- window.addEventListener 使用前檢查 `typeof window !== 'undefined'`

#### 5. `components/trim/timeline-range.tsx`
**問題：** 已有 "use client"，但 document.addEventListener 沒有檢查
**修正：**
- document.addEventListener 使用前檢查 `typeof document !== 'undefined'`

#### 6. `components/trim/video-trim-editor.tsx`
**問題：** 已有 "use client"，但 document.createElement 沒有檢查
**修正：**
- document.createElement 使用前檢查 `typeof document === 'undefined'`，如果是則 return

#### 7. `app/admin/logs/page.tsx`
**問題：** 已有 "use client"，但 document.createElement 沒有檢查
**修正：**
- exportCSV 函數開始時檢查 `typeof document === 'undefined'`，如果是則 return

#### 8. `app/admin/literature/page.tsx`
**問題：** 已有 "use client"，但 document.createElement 沒有檢查
**修正：**
- exportCSV 函數開始時檢查 `typeof document === 'undefined'`，如果是則 return

#### 9. `app/report/[id]/page.tsx`
**問題：** 已有 "use client"，但 window.location 沒有檢查（之前已修正）
**修正：**
- window.location.href 和 window.location.reload() 使用前檢查 `typeof window !== 'undefined'`

### 修正原則
1. ✅ 所有 Client Component 都有 `'use client'` 或 `"use client"` 標記
2. ✅ 所有 window/document 使用都加上 `typeof window !== 'undefined'` 或 `typeof document !== 'undefined'` 檢查
3. ✅ 瀏覽器 API 只在事件處理函數或 useEffect 中使用
4. ✅ 不在 module scope 直接使用 window/document

---

## 📋 修改過的檔案清單

### 問題 1 修正
1. `package.json` - 新增 packageManager 欄位
2. `vercel.json` - 更新 installCommand

### 問題 2 修正
1. `hooks/use-mobile.ts` - 新增 'use client' 和 window 檢查
2. `components/ui/use-mobile.tsx` - 新增 'use client' 和 window 檢查
3. `lib/video-client.ts` - 新增 'use client' 和 window/document 檢查
4. `components/ui/sidebar.tsx` - 新增 window/document 檢查
5. `components/trim/timeline-range.tsx` - 新增 document 檢查
6. `components/trim/video-trim-editor.tsx` - 新增 document 檢查
7. `app/admin/logs/page.tsx` - 新增 document 檢查
8. `app/admin/literature/page.tsx` - 新增 document 檢查
9. `app/report/[id]/page.tsx` - 已有 window 檢查（之前已修正）

---

## 🧪 本機驗證步驟

### 1. 驗證 pnpm 設定
```bash
cd running-gait/fullstack/frontend
pnpm --version  # 應該顯示 10.x.x
cat package.json | grep packageManager  # 應該顯示 "pnpm@10.0.0"
```

### 2. 驗證 build 成功（需要環境變數）
```bash
# 先設定環境變數（或建立 .env.local）
export NEXT_PUBLIC_SUPABASE_URL=https://pfprjwcywuhrsszpbxlk.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
export NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here

# 執行 build
pnpm run build

# 檢查輸出，應該：
# ✅ 沒有 "location is not defined" 錯誤
# ✅ 沒有 "window is not defined" 錯誤
# ✅ 沒有 "document is not defined" 錯誤
# ✅ 成功完成 "Generating static pages"
```

### 3. 驗證 Vercel 設定
在 Vercel Dashboard 檢查：
- Build & Development Settings → Install Command 應為：
  ```
  corepack enable && corepack prepare pnpm@latest --activate && pnpm install
  ```
- Build Command 應為：`pnpm run build`
- Framework Preset 應為：Next.js

---

## ✅ 完成檢查清單

- [x] package.json 新增 packageManager 欄位
- [x] vercel.json 更新 installCommand
- [x] 所有使用 window 的檔案都加上檢查
- [x] 所有使用 document 的檔案都加上檢查
- [x] 所有 Client Component 都有 'use client' 標記
- [x] 沒有在 module scope 直接使用瀏覽器 API
- [x] pnpm-lock.yaml 包含 importers 欄位

---

## 🚀 部署前確認

1. ✅ 所有修正已 commit
2. ✅ pnpm-lock.yaml 已更新
3. ✅ Vercel 環境變數已設定
4. ✅ Vercel Build Settings 使用 pnpm

下次部署應該可以成功！

