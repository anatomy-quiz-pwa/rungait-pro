# Vercel 環境變數設定指南

## 🔑 必須設定的環境變數

### 1. Google Maps API Key
- **變數名稱：** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **值：** `AIzaSyA8ZJkjc18cCppnTCrrtu0105jBewHt1dU`
- **說明：** 用於顯示 Google Maps 地圖功能

### 2. Supabase 設定
- **變數名稱：** `NEXT_PUBLIC_SUPABASE_URL`
- **值：** `https://pfprjwcywuhrsszpbxlk.supabase.co`

- **變數名稱：** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **值：** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcHJqd2N5d3VocnNzenBieGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjI3OTEsImV4cCI6MjA3OTAzODc5MX0.594tOgYhNt-FR91dBNodtoAIXQcSKDTsxmdq9WiSAo0`

- **變數名稱：** `SUPABASE_SERVICE_ROLE_KEY`
- **值：** （請使用實際的 service role key）
- **說明：** 僅用於 server-side API routes，不會暴露到 client

---

## 📝 在 Vercel Dashboard 設定步驟

1. 前往 Vercel Dashboard → 您的專案
2. 點擊 **Settings** → **Environment Variables**
3. 新增以下環境變數：

### Production 環境
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyA8ZJkjc18cCppnTCrrtu0105jBewHt1dU
NEXT_PUBLIC_SUPABASE_URL=https://pfprjwcywuhrsszpbxlk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcHJqd2N5d3VocnNzenBieGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjI3OTEsImV4cCI6MjA3OTAzODc5MX0.594tOgYhNt-FR91dBNodtoAIXQcSKDTsxmdq9WiSAo0
SUPABASE_SERVICE_ROLE_KEY=<您的 service role key>
```

### Preview 環境（可選）
如果需要在 preview 環境也使用，請重複上述步驟並選擇 **Preview** 環境。

### Development 環境（可選）
如果需要在 development 環境也使用，請重複上述步驟並選擇 **Development** 環境。

---

## ✅ 設定完成後

1. **重新部署：** 環境變數變更後，需要重新部署才會生效
   - 可以手動觸發 **Redeploy**，或
   - 推送新的 commit 觸發自動部署

2. **驗證設定：** 部署完成後，檢查：
   - `/map` 頁面是否正常顯示 Google Maps
   - 如果顯示「地圖功能需要 Google Maps API key」，表示環境變數未正確設定

---

## 🔍 疑難排解

### 問題：地圖顯示「需要 API key」
**解決方案：**
1. 確認 Vercel Environment Variables 中已設定 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
2. 確認值正確（沒有多餘空格）
3. 重新部署專案

### 問題：API key 無效
**解決方案：**
1. 檢查 Google Cloud Console 中的 API key 是否啟用
2. 確認 API key 有啟用 **Maps JavaScript API**
3. 檢查 API key 的限制設定（如 HTTP referrer 限制）

---

## 📚 相關文件

- [Vercel Environment Variables 文件](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables 文件](https://nextjs.org/docs/basic-features/environment-variables)

