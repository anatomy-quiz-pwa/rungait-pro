# Vercel Dashboard 設定指引

## 📋 步驟 1: 進入 Vercel Dashboard

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇您的專案
3. 點擊 **Settings** (設定)

## 📋 步驟 2: 設定 Build & Development Settings

1. 在左側選單點擊 **Build & Development Settings**
2. 找到以下設定並更新：

### Install Command
```
corepack enable && corepack prepare pnpm@latest --activate && pnpm install
```

### Build Command
```
pnpm run build
```

### Framework Preset
選擇：**Next.js**

### Root Directory (如果需要)
如果您的專案在子目錄中，設定為：
```
running-gait/fullstack/frontend
```

## 📋 步驟 3: 確認 Environment Variables

1. 在左側選單點擊 **Environment Variables**
2. 確認以下變數已設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. 每個變數應設定為：
   - **Environments**: Production, Preview, Development (全部勾選)

## 📋 步驟 4: 儲存設定

1. 點擊 **Save** 按鈕
2. 返回 **Deployments** 頁面
3. 觸發新的部署（點擊 **Redeploy** 或 push 新的 commit）

---

## ✅ 驗證清單

### 本機修正確認
- [x] `package.json` 包含 `"packageManager": "pnpm@10.0.0"`
- [x] `vercel.json` 包含正確的 installCommand
- [x] `pnpm-lock.yaml` 包含 `importers` 欄位
- [x] 所有 Client Component 都有 'use client'
- [x] 所有 window/document 使用都有檢查

### Vercel Dashboard 設定確認
- [ ] Install Command 已更新
- [ ] Build Command 已更新
- [ ] Framework Preset 設為 Next.js
- [ ] 所有環境變數已設定
- [ ] 已觸發新的部署

---

## 🚀 部署後檢查

部署完成後，檢查 Build Logs：

### 應該看到：
✅ `Installing dependencies with pnpm...`
✅ `Running "pnpm run build"...`
✅ `Compiled successfully`
✅ `Generating static pages...`
✅ `Build completed`

### 不應該看到：
❌ `bun install`
❌ `pnpm-lock.yaml missing 'importers' field`
❌ `ReferenceError: location is not defined`
❌ `ReferenceError: window is not defined`
❌ `ReferenceError: document is not defined`

---

## 📝 注意事項

1. **Root Directory**: 如果您的 Next.js 專案在子目錄中，記得設定 Root Directory
2. **環境變數**: 確保所有環境變數都已正確設定
3. **首次部署**: 如果這是首次部署，Vercel 會自動偵測 Next.js，但建議手動確認設定

---

## 🔧 如果部署仍然失敗

1. 檢查 Build Logs 中的錯誤訊息
2. 確認環境變數是否正確設定
3. 確認 vercel.json 是否在正確的位置（專案根目錄或 frontend 目錄）
4. 如果專案在子目錄，確認 Root Directory 設定正確

