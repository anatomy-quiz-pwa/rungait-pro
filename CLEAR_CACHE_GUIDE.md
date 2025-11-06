# 清除快取指南

## ✅ 已清除的本地快取

- `.next/` - Next.js 建置快取
- `node_modules/.cache/` - Node 模組快取
- `.turbo/` - Turbopack 快取

## 清除 Vercel 快取

### 方法 1：透過 Vercel Dashboard（推薦）

1. 前往 Vercel Dashboard：
   https://vercel.com/anatomy-quiz-pwas-projects/rungait-pro/deployments

2. 找到最新的部署，點擊進入詳情頁

3. 點擊右上角的 "..." 按鈕

4. 選擇 "Redeploy"

5. **重要**：勾選 "Clear build cache and redeploy"

6. 點擊 "Redeploy" 按鈕

### 方法 2：透過 Vercel CLI

```bash
# 安裝 Vercel CLI（如果還沒安裝）
npm i -g vercel

# 登入
vercel login

# 清除快取並重新部署
vercel --prod --force
```

## 清除瀏覽器快取

### Chrome / Edge
1. 按 `Cmd + Shift + Delete` (Mac) 或 `Ctrl + Shift + Delete` (Windows)
2. 選擇「快取的圖片和檔案」
3. 時間範圍選擇「全部時間」
4. 點擊「清除資料」

### 強制重新整理（不清除快取）
- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + R`

### 開發者工具清除
1. 按 `F12` 開啟開發者工具
2. 右鍵點擊重新整理按鈕
3. 選擇「清除快取並強制重新整理」

## 驗證快取已清除

1. 檢查版本標記：右下角應顯示最新的 commit SHA
2. 訪問 `/__version` 頁面確認建置資訊
3. 檢查 Network 標籤：確認載入的是最新資源

## 如果問題仍然存在

1. **檢查 Vercel Build Logs**：
   - 確認部署的是最新 commit (`c2724c5`)
   - 確認 Route 列表包含所有路由

2. **檢查環境變數**：
   - 確認 `NEXT_PUBLIC_COMMIT_SHA` 或 `VERCEL_GIT_COMMIT_SHA` 已設定

3. **等待 CDN 更新**：
   - Vercel 的 CDN 可能需要幾分鐘才能更新
   - 嘗試使用無痕模式訪問網站

