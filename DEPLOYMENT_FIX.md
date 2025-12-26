# 部署修正說明

## 問題診斷

專案中同時存在兩個 `app/` 目錄：
- `app/` (根目錄) - 舊版本
- `src/app/` (src 目錄) - 新版本

Next.js 會優先使用根目錄的 `app/`，導致 Vercel 部署的是舊版本。

## 解決方案

已完全移除根目錄的 `app/`，確保 Next.js 只讀取 `src/app/`。

## 驗證步驟

### 1. 確認正確的 URL

- ❌ 錯誤：`/_version` (一個底線)
- ✅ 正確：`/__version` (兩個底線)

### 2. 測試頁面

部署完成後，訪問以下頁面確認：

1. **版本測試頁面**：
   ```
   https://rungait-8gne27kcf-anatomy-quiz-pwas-projects.vercel.app/__version
   ```
   應該顯示建置資訊（Commit SHA、建置時間等）

2. **分析頁面**：
   ```
   https://rungait-8gne27kcf-anatomy-quiz-pwas-projects.vercel.app/analyze
   ```
   應該顯示新功能：
   - Clinical Summary header
   - 步態指標（speed、cadence、step length）
   - Evidence Panels
   - PDF 匯出按鈕

3. **版本標記**：
   網站右下角應該顯示 commit SHA（例如 `v:ec0a0f0`）

### 3. Vercel 部署檢查

在 Vercel Dashboard：

1. 前往 **Deployments**
2. 確認最新部署的 commit 是 `ec0a0f0` 或更新
3. 點擊部署 → **Build Logs**
4. 檢查 Route 列表，應該包含：
   - `/`
   - `/analyze`
   - `/__version`

### 4. 如果還是沒更新

1. **清除建置快取**：
   - Vercel Dashboard → Deployments → 最新部署 → "..." → Redeploy
   - 勾選 "Clear build cache and redeploy"

2. **強制重新整理**：
   - 使用 `Ctrl+Shift+R` (Windows) 或 `Cmd+Shift+R` (Mac)
   - 或訪問 `https://你的網域/analyze?v=20250106`

3. **檢查版本標記**：
   - 如果右下角顯示新的 commit SHA，表示已部署新版本
   - 如果還是舊的，表示 Vercel 還沒部署完成

## 當前專案結構

```
rungait-pro/
├── src/
│   └── app/              ← Next.js 只讀取這裡
│       ├── layout.tsx
│       ├── page.tsx
│       ├── globals.css
│       ├── analyze/
│       │   └── page.tsx  ← 新版本（包含所有新功能）
│       └── __version/
│           └── page.tsx  ← 版本測試頁面
├── components/
├── lib/
└── ...
```

## 注意事項

- 根目錄的 `app/` 已完全移除
- 所有頁面都在 `src/app/` 下
- Next.js 會自動識別 `src/app/` 目錄

