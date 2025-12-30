# Vercel 部署保護問題解決方案

## 問題

Vercel 部署 URL 有保護機制，返回 401 Authentication Required。

## 解決方案

### 方案 1：使用主域名（推薦）

如果你有設定自訂域名（例如：`your-domain.com`），使用主域名測試：

```bash
API_URL=https://your-domain.com node test-location-register.js
```

### 方案 2：在 Vercel Dashboard 中關閉部署保護

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇你的專案
3. 進入 **Settings** > **Deployment Protection**
4. 檢查是否有啟用保護機制
5. 如果是 Preview Deployments，可以暫時關閉保護來測試

### 方案 3：使用 Vercel 的 Production URL

檢查 Vercel Dashboard 中是否有 Production 部署的 URL（通常格式為：`your-project.vercel.app`，沒有 preview 標識）。

### 方案 4：在瀏覽器中測試

由於瀏覽器會自動處理 Vercel 的身份驗證，你可以：

1. 在瀏覽器中打開：`https://rungait-4jho7u7ef-anatomy-quiz-pwas-projects.vercel.app/map/submit`
2. 完成身份驗證（如果需要）
3. 填寫表單並提交
4. 查看瀏覽器 Console 和 Network 標籤
5. 查看 Vercel Logs 中的 server-side 日誌

### 方案 5：使用 Vercel CLI 獲取 bypass token

如果你有 Vercel CLI：

```bash
vercel login
vercel inspect https://rungait-4jho7u7ef-anatomy-quiz-pwas-projects.vercel.app
```

然後使用 bypass token 來訪問。

## 建議

**最簡單的方式**：在瀏覽器中測試，因為：
1. 瀏覽器會自動處理 Vercel 的身份驗證
2. 可以直接看到前端和後端的錯誤訊息
3. 可以查看 Vercel Logs 中的 server-side 日誌

## 下一步

請告訴我：
1. 是否有自訂域名？
2. 或者你可以在瀏覽器中測試並提供結果？

