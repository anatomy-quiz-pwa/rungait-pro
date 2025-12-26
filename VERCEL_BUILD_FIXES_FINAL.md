# Vercel Build 錯誤最終修正

## 🔍 問題分析

從 Vercel build log 看到兩個問題：

### 問題 1: bun install 仍然被使用
```
Running "install" command: `bun install`...
error: pnpm-lock.yaml missing 'importers' field
```

**原因：** vercel.json 在根目錄，但專案在 `running-gait/fullstack/frontend` 子目錄，Vercel 可能沒有正確讀取到設定。

### 問題 2: location is not defined
```
ReferenceError: location is not defined
at H (.next/server/chunks/ssr/app_dashboard_page_tsx_42ef5b16._.js:1:5931)
at s (.next/server/chunks/ssr/_62703b6a._.js:1:11789)
```

**原因：** 在 SSR 階段，`MyLocations` 組件或其依賴的 `lib/map.ts` 中的函數被執行，但這些函數使用了瀏覽器 API。

---

## ✅ 修正方案

### 1. 在 frontend 目錄建立 vercel.json

**檔案：** `running-gait/fullstack/frontend/vercel.json`
```json
{
  "framework": "nextjs",
  "installCommand": "corepack enable && corepack prepare pnpm@latest --activate && pnpm install",
  "buildCommand": "pnpm run build"
}
```

### 2. 使用 dynamic import 載入 MyLocations

**檔案：** `app/dashboard/page.tsx`

**修正前：**
```typescript
import { MyLocations } from "@/components/dashboard/my-locations"
```

**修正後：**
```typescript
import dynamic from "next/dynamic"

// 動態載入 MyLocations 以避免 SSR 問題
const MyLocations = dynamic(() => import("@/components/dashboard/my-locations").then(mod => ({ default: mod.MyLocations })), {
  ssr: false
})
```

### 3. 加強 lib/map.ts 的瀏覽器檢查

**檔案：** `lib/map.ts`

**修正：** 在 `listLocations` 和 `myLocations` 函數中加入 `typeof window === 'undefined'` 檢查：

```typescript
export async function listLocations({...}): Promise<LocationRow[]> {
  // 確保只在瀏覽器環境執行
  if (typeof window === 'undefined' || !isBrowser()) return []
  // ...
}

export async function myLocations(): Promise<LocationRow[]> {
  // 確保只在瀏覽器環境執行
  if (typeof window === 'undefined' || !isBrowser()) return []
  // ...
}
```

---

## 📋 修改的檔案清單

1. ✅ `running-gait/fullstack/frontend/vercel.json` - 新建，確保 Vercel 使用 pnpm
2. ✅ `app/dashboard/page.tsx` - 使用 dynamic import 載入 MyLocations
3. ✅ `lib/map.ts` - 加強瀏覽器環境檢查

---

## 🧪 驗證步驟

### 1. 確認 vercel.json 位置
```bash
cd running-gait/fullstack/frontend
ls -la vercel.json  # 應該存在
cat vercel.json    # 應該顯示正確的 installCommand
```

### 2. 本機 build 測試
```bash
cd running-gait/fullstack/frontend
rm -rf .next
pnpm run build

# 應該：
# ✅ 沒有 "location is not defined" 錯誤
# ✅ 沒有 "window is not defined" 錯誤
# ✅ 成功完成 "Generating static pages"
```

### 3. Vercel 部署驗證

部署後檢查 Build Logs：
- ✅ 應該看到 `Using pnpm@10.x based on project creation date`
- ✅ 應該看到 `Running "install" command: corepack enable...`
- ✅ 不應該看到 `bun install`
- ✅ 不應該看到 `location is not defined` 錯誤

---

## 📝 注意事項

1. **vercel.json 位置**：必須在專案根目錄（`running-gait/fullstack/frontend/`），不是工作區根目錄
2. **Root Directory 設定**：如果 Vercel 專案設定 Root Directory 為 `running-gait/fullstack/frontend`，vercel.json 應該在那個目錄
3. **dynamic import**：使用 `ssr: false` 確保組件只在客戶端載入，避免 SSR 問題

---

## ✅ 完成檢查清單

- [x] vercel.json 已建立在 frontend 目錄
- [x] MyLocations 使用 dynamic import 載入
- [x] lib/map.ts 加強瀏覽器環境檢查
- [x] 所有修正已 commit

