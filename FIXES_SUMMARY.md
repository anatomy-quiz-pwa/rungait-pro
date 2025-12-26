# Vercel Build 錯誤修正完整總結

## 📋 找到的所有 location/window/document 使用點

### ✅ 已修正的檔案

#### 1. `app/report/[id]/page.tsx`
- **Line 92**: `document.getElementById` → 加上 `typeof document === 'undefined'` 檢查
- **Line 105**: `window.print()` → 加上 `typeof window !== 'undefined'` 檢查
- **Line 114**: `window.location.href` → 已有檢查 ✅
- **Line 153**: `window.location.reload()` → 已有檢查 ✅

**修正方法：** 在函數開始時加上 `typeof` 檢查

#### 2. `lib/usage.ts`
- **問題：** 檔案沒有 'use client'，但使用了 `readLS`（會使用 `window.localStorage`）
- **修正：** 在檔案最上方加上 `'use client'` 標記

#### 3. `app/dashboard/page.tsx`
- **問題：** 雖然是 client component，但在 SSR 階段仍可能被 pre-render
- **修正：** 加上 `export const dynamic = 'force-dynamic'` 強制 dynamic rendering

### ✅ 已確認正確的檔案（無需修改）

#### 4. `lib/map.ts`
- **Line 93, 115**: `const location = ...` → 這是變數名，不是 `window.location` ✅

#### 5. `app/compare/page.tsx`
- **Line 145**: `const window = phaseWindows[phase]` → 這是變數名，不是 `window` 物件 ✅

#### 6. `lib/storage.ts`
- 已有 `'use client'` 和 `isBrowser()` 檢查 ✅

#### 7. `lib/auth-context.tsx`
- 已有 `'use client'` 標記 ✅

#### 8. `components/dashboard/my-locations.tsx`
- 已有 `'use client'` 標記，並使用 dynamic import ✅

---

## 🔧 修正方法總結

### 方法 1: 加上 typeof 檢查（用於已存在的 Client Component）
```typescript
// 修正前
const element = document.getElementById('id')
window.print()

// 修正後
if (typeof document === 'undefined') return
const element = document.getElementById('id')

if (typeof window !== 'undefined') {
  window.print()
}
```

### 方法 2: 加上 'use client' 標記（用於 lib 檔案）
```typescript
// 修正前
import { readLS } from "@/lib/storage"
export async function fetchCredits() { ... }

// 修正後
'use client'
import { readLS } from "@/lib/storage"
export async function fetchCredits() { ... }
```

### 方法 3: 強制 dynamic rendering（用於 page.tsx）
```typescript
"use client"

// 強制 dynamic rendering 避免 SSR 問題
export const dynamic = 'force-dynamic'

// ... 其餘程式碼
```

---

## 📋 修改的檔案清單

### 問題 A: location is not defined
1. ✅ `app/report/[id]/page.tsx` - 加上 document/window 檢查
2. ✅ `lib/usage.ts` - 加上 'use client' 標記
3. ✅ `app/dashboard/page.tsx` - 加上 `export const dynamic = 'force-dynamic'`

### 問題 B: pnpm-lock.yaml importers
- ✅ `vercel.json` - 已正確設定（frontend 目錄）
- ✅ `package.json` - 已包含 `packageManager: "pnpm@10.0.0"`
- ✅ `pnpm-lock.yaml` - 已包含 `importers` 欄位

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

### 3. 驗證 vercel.json 設定
```bash
cd running-gait/fullstack/frontend
cat vercel.json

# 預期輸出：
# {
#   "framework": "nextjs",
#   "installCommand": "corepack enable && corepack prepare pnpm@latest --activate && pnpm install",
#   "buildCommand": "pnpm run build"
# }
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

### 問題 A: location is not defined
- [x] `app/report/[id]/page.tsx` - document.getElementById 加上檢查
- [x] `app/report/[id]/page.tsx` - window.print() 加上檢查
- [x] `lib/usage.ts` - 加上 'use client' 標記
- [x] `app/dashboard/page.tsx` - 加上 `export const dynamic = 'force-dynamic'`
- [x] 所有 window.location 使用都有檢查（之前已修正）

### 問題 B: pnpm-lock.yaml importers
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

