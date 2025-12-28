# Google Maps 無法載入錯誤修復指南

## 錯誤訊息
「Google 這個網頁無法正確載入 Google 地圖。」

## 可能原因與解決方法

### 1. API Key 未設定或無效 ⚠️ 最常見

**檢查步驟：**
1. 確認 Vercel 環境變數中已設定 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
2. 確認 API Key 值正確（沒有多餘空格）
3. 重新部署應用程式（環境變數變更需要重新部署）

**解決方法：**
- 進入 Vercel Dashboard → 專案 → Settings → Environment Variables
- 確認 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 存在且值正確
- 如果不存在，新增環境變數：
  - Key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - Value: 你的 Google Maps API Key
  - Environment: Production, Preview, Development（全部勾選）
- 重新部署應用程式

### 2. API Key 未啟用必要的服務 ⚠️ 常見

**需要的服務：**
- ✅ Maps JavaScript API（必須）
- ✅ Places API（必須，用於地址搜尋）
- ✅ Geocoding API（必須，用於地址轉座標）

**檢查步驟：**
1. 進入 [Google Cloud Console](https://console.cloud.google.com/)
2. 選擇你的專案
3. 進入「API 和服務」→「已啟用的 API」
4. 確認以下 API 已啟用：
   - Maps JavaScript API
   - Places API
   - Geocoding API

**解決方法：**
- 如果未啟用，點擊「啟用 API」按鈕
- 等待幾分鐘讓變更生效
- 重新載入網頁

### 3. API Key 有 HTTP Referrer 限制 ⚠️ 常見

**檢查步驟：**
1. 進入 Google Cloud Console → API 和服務 → 憑證
2. 點擊你的 API Key
3. 查看「應用程式限制」設定

**解決方法：**
如果設定了「HTTP 參照網址（網站）」，請確認以下網址已加入：
- `https://your-domain.vercel.app/*`
- `https://*.vercel.app/*`（如果使用多個 Vercel 網域）
- `http://localhost:3000/*`（開發環境）
- `http://localhost:*`（開發環境，所有 port）

**建議設定：**
- 應用程式限制：HTTP 參照網址（網站）
- 參照網址：
  ```
  https://your-domain.vercel.app/*
  https://*.vercel.app/*
  http://localhost:*
  ```

### 4. API Key 已過期或被停用

**檢查步驟：**
1. 進入 Google Cloud Console → API 和服務 → 憑證
2. 確認 API Key 狀態為「已啟用」
3. 檢查是否有任何警告或錯誤訊息

**解決方法：**
- 如果 API Key 被停用，重新啟用
- 如果過期，建立新的 API Key
- 更新 Vercel 環境變數並重新部署

### 5. 計費問題

**檢查步驟：**
1. 進入 Google Cloud Console → 計費
2. 確認帳戶有有效的付款方式
3. 確認沒有超出免費額度或配額限制

**解決方法：**
- 如果帳戶被暫停，需要啟用計費帳戶
- 確認沒有超出配額限制

### 6. 瀏覽器 Console 錯誤

**檢查步驟：**
1. 開啟瀏覽器開發者工具（F12）
2. 查看 Console 標籤的錯誤訊息
3. 查看 Network 標籤，確認 Google Maps API 請求的狀態

**常見錯誤訊息：**
- `RefererNotAllowedMapError`: API Key 的 HTTP referrer 限制問題
- `ApiNotActivatedMapError`: API 未啟用
- `InvalidKeyMapError`: API Key 無效
- `OverQueryLimitMapError`: 超出配額限制

## 快速診斷步驟

### 步驟 1：檢查環境變數
```bash
# 在瀏覽器 Console 中執行（僅用於開發環境測試）
console.log('API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
```

**注意：** 在生產環境中，`process.env` 不會顯示實際值（安全考量），但可以檢查是否為 `undefined`

### 步驟 2：檢查 API Key 是否正確載入
在 `components/map/manual-location-form.tsx` 中，檢查 `loadError`：
```typescript
if (loadError) {
  console.error('Google Maps load error:', loadError)
}
```

### 步驟 3：檢查 Google Cloud Console
1. 進入 [Google Cloud Console](https://console.cloud.google.com/)
2. 確認 API Key 存在且狀態為「已啟用」
3. 確認必要的 API 已啟用
4. 確認 HTTP referrer 限制設定正確

### 步驟 4：測試 API Key
使用 curl 測試 API Key（替換 `YOUR_API_KEY`）：
```bash
curl "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"
```

如果回傳錯誤，查看錯誤訊息內容。

## 建議的修復流程

1. **確認環境變數已設定**
   - Vercel Dashboard → Settings → Environment Variables
   - 確認 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 存在

2. **確認 API 已啟用**
   - Google Cloud Console → API 和服務 → 已啟用的 API
   - 啟用：Maps JavaScript API, Places API, Geocoding API

3. **檢查 API Key 限制**
   - Google Cloud Console → API 和服務 → 憑證
   - 確認 HTTP referrer 限制包含你的網域

4. **重新部署**
   - 在 Vercel 中觸發新的部署
   - 等待部署完成後測試

5. **清除瀏覽器快取**
   - 清除瀏覽器快取和 cookies
   - 使用無痕模式測試

## 測試檢查清單

- [ ] Vercel 環境變數 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 已設定
- [ ] Google Cloud Console 中 API Key 狀態為「已啟用」
- [ ] Maps JavaScript API 已啟用
- [ ] Places API 已啟用
- [ ] Geocoding API 已啟用
- [ ] HTTP referrer 限制包含你的網域
- [ ] 已重新部署應用程式
- [ ] 瀏覽器 Console 沒有錯誤訊息
- [ ] 使用無痕模式測試正常

## 如果問題仍然存在

1. **查看瀏覽器 Console 的完整錯誤訊息**
2. **查看 Vercel Function Logs**
3. **檢查 Google Cloud Console 的 API 使用量和錯誤**
4. **確認 API Key 沒有被其他專案使用並超出配額**

## 常見錯誤訊息對照表

| 錯誤訊息 | 原因 | 解決方法 |
|---------|------|---------|
| `RefererNotAllowedMapError` | HTTP referrer 限制 | 在 Google Cloud Console 中新增你的網域 |
| `ApiNotActivatedMapError` | API 未啟用 | 啟用 Maps JavaScript API |
| `InvalidKeyMapError` | API Key 無效 | 檢查 API Key 是否正確 |
| `OverQueryLimitMapError` | 超出配額 | 檢查計費和配額設定 |
| `RequestDeniedMapError` | 請求被拒絕 | 檢查 API Key 權限和限制 |

---

**最後更新：** 2025-01-XX
**相關文件：** `VERCEL_GOOGLE_MAPS_SETUP.md`, `ERROR_DEBUGGING_GUIDE.md`

