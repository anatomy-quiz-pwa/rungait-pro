# 「搜尋請求被拒絕」錯誤除錯指南

## 錯誤訊息
「搜尋請求被拒絕，請檢查 Google Maps API 設定」

這個錯誤表示 Google Geocoding API 拒絕了搜尋請求。通常是 API 設定問題。

## 可能原因與解決方法

### 1. Geocoding API 未啟用 ⚠️ 最常見

**檢查步驟：**
1. 進入 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇你的專案
3. 進入「API 和服務」→「已啟用的 API」
4. 搜尋「Geocoding API」
5. 確認狀態為「已啟用」

**解決方法：**
- 如果未啟用，點擊「啟用 API」按鈕
- 等待 1-2 分鐘讓變更生效
- 重新載入網頁並測試

### 2. Places API 未啟用（用於 Autocomplete）

**檢查步驟：**
1. 在「已啟用的 API」中搜尋「Places API」
2. 確認狀態為「已啟用」

**解決方法：**
- 如果未啟用，點擊「啟用 API」
- 等待變更生效後重新測試

### 3. API Key 的 HTTP Referrer 限制

**檢查步驟：**
1. 進入 Google Cloud Console → API 和服務 → 憑證
2. 點擊你的 API Key
3. 查看「應用程式限制」設定

**解決方法：**
如果設定了「HTTP 參照網址（網站）」，請確認以下網址已加入：

```
https://your-domain.vercel.app/*
https://*.vercel.app/*
http://localhost:3000/*
http://localhost:*
```

**建議設定：**
- 應用程式限制：HTTP 參照網址（網站）
- 參照網址：
  ```
  https://your-domain.vercel.app/*
  https://*.vercel.app/*
  http://localhost:*
  ```

### 4. API Key 被停用或無效

**檢查步驟：**
1. 進入 Google Cloud Console → API 和服務 → 憑證
2. 確認 API Key 狀態為「已啟用」
3. 檢查是否有警告或錯誤訊息

**解決方法：**
- 如果被停用，點擊「啟用」
- 如果無效，建立新的 API Key
- 更新 Vercel 環境變數並重新部署

### 5. API Key 沒有權限使用 Geocoding API

**檢查步驟：**
1. 進入 Google Cloud Console → API 和服務 → 憑證
2. 點擊你的 API Key
3. 查看「API 限制」設定

**解決方法：**
- 如果設定了「限制金鑰」，確認以下 API 已加入：
  - Maps JavaScript API
  - Places API
  - Geocoding API
- 或者選擇「不要限制金鑰」（不建議用於生產環境）

### 6. 計費帳戶問題

**檢查步驟：**
1. 進入 Google Cloud Console → 計費
2. 確認帳戶有有效的付款方式
3. 確認沒有超出免費額度

**解決方法：**
- 如果帳戶被暫停，需要啟用計費帳戶
- 確認沒有超出配額限制

## 快速診斷步驟

### 步驟 1：檢查瀏覽器 Console
1. 開啟瀏覽器開發者工具（F12）
2. 查看 Console 標籤
3. 搜尋 `[Geocoding]` 或 `REQUEST_DENIED`
4. 查看詳細錯誤訊息

### 步驟 2：檢查已啟用的 API
在 Google Cloud Console 中確認以下 API 已啟用：
- ✅ Maps JavaScript API
- ✅ Places API
- ✅ Geocoding API

### 步驟 3：測試 API Key
使用 curl 測試 Geocoding API（替換 `YOUR_API_KEY` 和 `YOUR_DOMAIN`）：

```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?address=台北101&key=YOUR_API_KEY&region=tw"
```

如果回傳錯誤，查看錯誤訊息內容。

### 步驟 4：檢查 Vercel 環境變數
1. 進入 Vercel Dashboard → 專案 → Settings → Environment Variables
2. 確認 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 存在且值正確
3. 確認沒有多餘空格或換行

## 建議的修復流程

### 1. 啟用必要的 API（最重要）
1. 進入 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇你的專案
3. 進入「API 和服務」→「已啟用的 API」
4. 點擊「啟用 API 和服務」
5. 搜尋並啟用：
   - **Geocoding API**（必須）
   - **Places API**（必須）
   - **Maps JavaScript API**（必須）
6. 等待 1-2 分鐘讓變更生效

### 2. 檢查 API Key 限制
1. 進入 Google Cloud Console → API 和服務 → 憑證
2. 點擊你的 API Key
3. 確認「應用程式限制」設定正確：
   - 如果使用 HTTP referrer 限制，確認包含你的網域
   - 如果使用 API 限制，確認包含 Geocoding API

### 3. 重新部署
1. 在 Vercel 中觸發新的部署
2. 等待部署完成
3. 清除瀏覽器快取
4. 使用無痕模式測試

### 4. 驗證修復
1. 重新載入網頁
2. 嘗試搜尋地址或店家
3. 查看是否還有錯誤訊息
4. 檢查瀏覽器 Console 確認沒有錯誤

## 常見錯誤狀態碼對照表

| 狀態碼 | 原因 | 解決方法 |
|--------|------|---------|
| `REQUEST_DENIED` | API 請求被拒絕 | 檢查 API 是否啟用、API Key 限制設定 |
| `OVER_QUERY_LIMIT` | 超出配額限制 | 檢查計費和配額設定 |
| `ZERO_RESULTS` | 找不到結果 | 使用更完整的地址或店家名稱 |
| `INVALID_REQUEST` | 請求無效 | 檢查請求參數 |
| `UNKNOWN_ERROR` | 未知錯誤 | 重試或檢查 Google 服務狀態 |

## 測試檢查清單

- [ ] Google Cloud Console 中 Geocoding API 已啟用
- [ ] Google Cloud Console 中 Places API 已啟用
- [ ] Google Cloud Console 中 Maps JavaScript API 已啟用
- [ ] API Key 狀態為「已啟用」
- [ ] API Key 的 HTTP referrer 限制包含你的網域
- [ ] Vercel 環境變數 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 已設定
- [ ] 已重新部署應用程式
- [ ] 瀏覽器 Console 沒有 `REQUEST_DENIED` 錯誤
- [ ] 使用無痕模式測試正常

## 如果問題仍然存在

1. **查看瀏覽器 Console 的完整錯誤訊息**
   - 開啟開發者工具（F12）
   - 查看 Console 標籤
   - 搜尋 `[Geocoding]` 或 `REQUEST_DENIED`

2. **檢查 Google Cloud Console 的 API 使用量**
   - 進入「API 和服務」→「儀表板」
   - 查看 Geocoding API 的使用量和錯誤

3. **測試 API Key 是否有效**
   ```bash
   curl "https://maps.googleapis.com/maps/api/geocode/json?address=台北101&key=YOUR_API_KEY"
   ```

4. **確認 API Key 沒有被其他專案使用並超出配額**

5. **檢查 Google Cloud 服務狀態**
   - 查看 [Google Cloud Status](https://status.cloud.google.com/)
   - 確認 Geocoding API 服務正常

## 替代方案

如果 Geocoding API 持續有問題，可以：
1. 使用 Google Places Autocomplete（已實作）
2. 直接在地圖上點選位置
3. 手動輸入座標（如果知道）

---

**最後更新：** 2025-01-XX
**相關文件：** `GOOGLE_MAPS_ERROR_FIX.md`, `ERROR_DEBUGGING_GUIDE.md`

