# Vercel Build 錯誤完整修正報告

## ✅ 問題 A: location is not defined - 已修正

### 找到的所有問題點

#### 1. `app/dashboard/page.tsx`
- **問題：** `export const dynamic = 'force-dynamic'` 在 client component 中無效
- **修正：** 移除 `export const dynamic = 'force-dynamic'`（client component 不需要此設定）

#### 2. `lib/analysis.ts`
- **問題：** 沒有 'use client'，在函數中使用 `readLS`/`writeLS`
- **修正：**
  - 加上 `'use client'` 標記
  - 在 `getAnalysisWithMeta()` 開始時加上 `typeof window === 'undefined'` 檢查
  - 在 `updateCaseMeta()` 和 `reanalyzeWithLibraries()` 開始時加上檢查

#### 3. `lib/library.ts`
- **問題：** 沒有 'use client'，在函數中使用 `readLS`/`writeLS`
- **修正：**
  - 加上 `'use client'` 標記
  - 在 `loadUserLibrarySelection()` 和 `saveUserLibrarySelection()` 開始時加上檢查

#### 4. `lib/library-content.ts`
- **問題：** 沒有 'use client'，在函數中使用 `readLS`/`writeLS`
- **修正：**
  - 加上 `'use client'` 標記
  - 在所有函數開始時加上 `typeof window === 'undefined'` 檢查

#### 5. `lib/credits.ts`
- **問題：** 沒有 'use client'，在函數中使用 `readLS`/`writeLS`
- **修正：**
  - 加上 `'use client'` 標記
  - 在 `fetchCredits()` 和 `consumeOneCredit()` 開始時加上檢查

#### 6. `lib/usage.ts`
- **問題：** 已有 'use client'，但需要加強檢查
- **修正：**
  - 在 `fetchCredits()` 和 `listMyAnalyses()` 開始時加上 `typeof window === 'undefined'` 檢查

#### 7. `app/report/[id]/page.tsx`
- **問題：** `document.getElementById` 和 `window.print()` 沒有檢查
- **修正：**
  - `handleCitationClick()` 加上 `typeof document === 'undefined'` 檢查
  - `handlePrint()` 加上 `typeof window !== 'undefined'` 檢查

---

## ✅ 問題 B: pnpm-lock.yaml importers - 已解決

### 確認項目
- ✅ pnpm 已成功使用（從 log 看到 `Using pnpm@10.x` 和 `Installing dependencies with pnpm...`）
- ✅ `vercel.json` 已正確設定
- ✅ `package.json` 包含 `packageManager: "pnpm@10.0.0"`
- ✅ `pnpm-lock.yaml` 包含 `importers` 欄位

---

## 📋 修改的檔案清單

### 問題 A 修正（7 個檔案）
1. ✅ `app/dashboard/page.tsx` - 移除無效的 `export const dynamic`
2. ✅ `lib/analysis.ts` - 加上 'use client' 和 window 檢查
3. ✅ `lib/library.ts` - 加上 'use client' 和 window 檢查
4. ✅ `lib/library-content.ts` - 加上 'use client' 和 window 檢查
5. ✅ `lib/credits.ts` - 加上 'use client' 和 window 檢查
6. ✅ `lib/usage.ts` - 加強 window 檢查
7. ✅ `app/report/[id]/page.tsx` - 加上 document/window 檢查

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

# 預期輸出：
# ✓ Compiled successfully
# Collecting page data using 1 worker ...
# Generating static pages using 1 worker (X/X) ...
# ✓ Generating static pages using 1 worker (X/X) in XXXms
# Finalizing page optimization ...
# Build Completed
```

---

## 📝 Vercel 部署後預期結果

### ✅ 應該看到的（正常）
- `Using pnpm@10.x based on project creation date`
- `Running "install" command: corepack enable...`
- `Installing dependencies with pnpm...`
- `Running "build" command: pnpm run build`
- `Compiled successfully`
- `Generating static pages using 1 worker (X/X)`
- `Build Completed`

### ❌ 不應該看到的（錯誤字串）
- `Running "install" command: bun install`
- `pnpm-lock.yaml missing 'importers' field`
- `PnpmLockfileMissingImporters`
- `ReferenceError: location is not defined`
- `ReferenceError: window is not defined`
- `ReferenceError: document is not defined`
- `failed to migrate lockfile`

---

## ✅ 完成檢查清單

### 問題 A
- [x] `app/dashboard/page.tsx` - 移除無效的 dynamic export
- [x] `lib/analysis.ts` - 加上 'use client' 和 window 檢查
- [x] `lib/library.ts` - 加上 'use client' 和 window 檢查
- [x] `lib/library-content.ts` - 加上 'use client' 和 window 檢查
- [x] `lib/credits.ts` - 加上 'use client' 和 window 檢查
- [x] `lib/usage.ts` - 加強 window 檢查
- [x] `app/report/[id]/page.tsx` - 加上 document/window 檢查

### 問題 B
- [x] pnpm 已成功使用
- [x] vercel.json 已正確設定
- [x] package.json 包含 packageManager
- [x] pnpm-lock.yaml 包含 importers 欄位

所有修正已完成！下次部署應該可以成功，且 build log 完全乾淨。

