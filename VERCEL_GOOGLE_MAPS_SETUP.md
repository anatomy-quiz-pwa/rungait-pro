# Vercel Google Maps API 設定檢查清單

## ✅ 步驟 1: 確認環境變數已設定

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇您的專案
3. 前往 **Settings** → **Environment Variables**
4. 確認以下環境變數存在：

### 必須設定的環境變數

| 變數名稱 | 值 | 環境選擇 |
|---------|-----|---------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `AIzaSyA8ZJkjc18cCppnTCrrtu0105jBewHt1dU` | **Production** 或 **All Environments** |

## ⚠️ 重要注意事項

### 1. 環境選擇
- **必須選擇 "Production" 環境**（或 "All Environments"）
- 如果只選擇 "Preview" 或 "Development"，Production 部署不會讀取到環境變數

### 2. 重新部署
- 環境變數變更後，**必須手動觸發重新部署**才會生效
- 前往 **Deployments** → 點擊最新部署的 **⋯** → **Redeploy**

### 3. 驗證環境變數是否生效

部署完成後，打開網站並：
1. 前往 `/map` 頁面
2. 按 `F12` 打開瀏覽器開發者工具
3. 查看 **Console** 標籤
4. 應該會看到：`[RunGaitMap] API Key check: { exists: true, length: 39, prefix: 'AIzaSyA8ZJ' }`

如果看到 `exists: false`，表示環境變數沒有正確讀取。

## 🔍 疑難排解

### 問題 1: 仍然顯示 "需要 Google Maps API key"
**可能原因：**
- 環境變數沒有選擇 Production 環境
- 環境變數變更後沒有重新部署
- 環境變數名稱拼寫錯誤（注意大小寫）

**解決方法：**
1. 確認環境變數名稱：`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`（完全一致）
2. 確認環境選擇：**Production** 或 **All Environments**
3. 手動觸發 **Redeploy**

### 問題 2: 環境變數已設定但地圖仍無法載入
**可能原因：**
- Google Maps API key 無效或已過期
- API key 沒有啟用正確的 API（Maps JavaScript API）

**解決方法：**
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 確認 API key 已啟用 **Maps JavaScript API**
3. 確認 API key 沒有設定過於嚴格的限制（例如只允許特定網域）

### 問題 3: Build 成功但 runtime 錯誤
**可能原因：**
- 環境變數在 build 時不存在，導致被內嵌為空字串

**解決方法：**
1. 確認環境變數在 **Production** 環境中設定
2. 刪除舊的部署
3. 重新部署（確保環境變數在 build 時存在）

## 📝 快速檢查清單

- [ ] 環境變數 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 已設定
- [ ] 環境變數值為：`AIzaSyA8ZJkjc18cCppnTCrrtu0105jBewHt1dU`
- [ ] 環境選擇為 **Production** 或 **All Environments**
- [ ] 已手動觸發 **Redeploy**
- [ ] 部署完成後檢查瀏覽器 Console 確認 API key 存在
- [ ] 地圖正常顯示（不是顯示錯誤訊息）

## 🆘 如果仍然無法連接

請提供以下資訊：
1. Vercel Dashboard 中環境變數的截圖（隱藏實際 key 值）
2. 瀏覽器 Console 的錯誤訊息
3. Vercel 部署 log 中是否有相關錯誤

