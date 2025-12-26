# Vercel Build 錯誤最終修正

## 🔍 問題分析

從最新的 build log 看到兩個問題仍然存在：

### 問題 A: location is not defined
- 錯誤仍然出現在 `app_dashboard_page_tsx` 和 `_62703b6a._.js`
- 即使設定了 `export const dynamic = 'force-dynamic'`，Next.js 仍然嘗試 pre-render

### 問題 B: bun install 仍然被使用
- Vercel 仍然使用 `bun install` 而不是 pnpm
- vercel.json 可能沒有被正確讀取

---

## ✅ 最終修正方案

### 【A】修正 location is not defined

#### 1. `lib/usage.ts`
**問題：** 即使有 'use client'，在 SSR 階段仍可能被執行

**修正：**
- 在 `fetchCredits()` 和 `listMyAnalyses()` 函數開始時加上 `typeof window === 'undefined'` 檢查
- 確保在 SSR 階段直接返回預設值，不執行任何瀏覽器 API

```typescript
export async function fetchCredits(): Promise<CreditsData> {
  // 確保只在瀏覽器環境執行
  if (typeof window === 'undefined') {
    return { points: 0, used: 0, quota: 0, extra: 0, plan: "free" }
  }
  // ... 其餘程式碼
}

export async function listMyAnalyses(): Promise<AnalysisRow[]> {
  // 確保只在瀏覽器環境執行
  if (typeof window === 'undefined') {
    return []
  }
  // ... 其餘程式碼
}
```

#### 2. `app/dashboard/page.tsx`
**問題：** `loadCredits` 可能在 SSR 階段被執行

**修正：**
- 在 `loadCredits` 函數開始時加上 `typeof window === 'undefined'` 檢查
- 修正 `data.balance` 為 `data.points`（fetchCredits 回傳的是 points）

```typescript
const loadCredits = async () => {
  // 確保只在瀏覽器環境執行
  if (typeof window === 'undefined') return
  
  try {
    const data = await fetchCredits()
    setCredits({ balance: data.points || 0 })
  } catch (error) {
    console.error('Failed to load credits:', error)
    setCredits({ balance: 0 })
  }
}
```

### 【B】修正 bun install 問題

#### 根目錄 vercel.json
**問題：** Vercel 可能沒有讀取到 frontend 目錄的 vercel.json

**修正：**
- 更新根目錄的 `vercel.json`，明確指定子目錄路徑

```json
{
  "framework": "nextjs",
  "buildCommand": "cd running-gait/fullstack/frontend && corepack enable && corepack prepare pnpm@latest --activate && pnpm install && pnpm run build",
  "installCommand": "cd running-gait/fullstack/frontend && corepack enable && corepack prepare pnpm@latest --activate && pnpm install"
}
```

**或者**在 Vercel Dashboard 設定：
- Root Directory: `running-gait/fullstack/frontend`
- Install Command: `corepack enable && corepack prepare pnpm@latest --activate && pnpm install`
- Build Command: `pnpm run build`

---

## 📋 修改的檔案清單

### 問題 A 修正
1. ✅ `lib/usage.ts`
   - `fetchCredits()` 加上 `typeof window === 'undefined'` 檢查
   - `listMyAnalyses()` 加上 `typeof window === 'undefined'` 檢查

2. ✅ `app/dashboard/page.tsx`
   - `loadCredits()` 加上 `typeof window === 'undefined'` 檢查
   - 修正 `data.balance` 為 `data.points`

### 問題 B 修正
1. ✅ `vercel.json` (根目錄)
   - 更新 installCommand 和 buildCommand，明確指定子目錄路徑

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

### 2. 驗證 pnpm-lock.yaml 格式
```bash
cd running-gait/fullstack/frontend
head -10 pnpm-lock.yaml | grep -E "lockfileVersion|importers"

# 預期輸出：
# lockfileVersion: '9.0'
# importers:
```

---

## 📝 Vercel 部署後預期結果

### ✅ 應該看到的（正常）
- `Using pnpm@10.x based on project creation date`
- `Running "install" command: cd running-gait/fullstack/frontend && corepack enable...`
- `Installing dependencies with pnpm...`
- `Running "build" command: cd running-gait/fullstack/frontend && ... && pnpm run build`
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

## ⚠️ 重要提醒

如果 Vercel 仍然使用 bun install，請在 Vercel Dashboard 手動設定：

1. 前往 **Settings** → **Build & Development Settings**
2. 設定 **Root Directory**: `running-gait/fullstack/frontend`
3. 設定 **Install Command**: `corepack enable && corepack prepare pnpm@latest --activate && pnpm install`
4. 設定 **Build Command**: `pnpm run build`
5. 儲存設定並重新部署

---

## ✅ 完成檢查清單

### 問題 A
- [x] `lib/usage.ts` - fetchCredits 加上 window 檢查
- [x] `lib/usage.ts` - listMyAnalyses 加上 window 檢查
- [x] `app/dashboard/page.tsx` - loadCredits 加上 window 檢查
- [x] `app/dashboard/page.tsx` - 修正 data.balance 為 data.points

### 問題 B
- [x] `vercel.json` (根目錄) - 更新 installCommand 和 buildCommand
- [ ] Vercel Dashboard 設定 Root Directory（需要手動設定）

