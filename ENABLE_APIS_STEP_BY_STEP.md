# 啟用 Google Maps API 逐步指南

## ⚠️ 目前狀態

根據您的 Google Cloud Console 截圖，以下 API 目前是 **Disabled**（已停用）狀態：

- ❌ **Geocoding API** - Disabled（必須啟用）
- ❌ **Places API** - Disabled（必須啟用）
- ❌ **Maps JavaScript API** - Disabled（必須啟用）

✅ **Places API (New)** - Enabled（已啟用，但這不是我們需要的）

## 📋 需要啟用的 API

您需要啟用以下三個 API：

1. **Geocoding API** - 用於地址轉座標
2. **Places API** - 用於店家搜尋和 Autocomplete
3. **Maps JavaScript API** - 用於顯示地圖

## 🔧 逐步啟用步驟

### 步驟 1：啟用 Geocoding API

1. 在 Google Cloud Console 的 API 列表中，找到 **Geocoding API** 卡片
2. 點擊 **Geocoding API** 卡片
3. 點擊右上角的 **「啟用」** 或 **「Enable」** 按鈕
4. 等待幾秒鐘，確認狀態變為 **Enabled**

### 步驟 2：啟用 Places API

1. 在 API 列表中，找到 **Places API** 卡片（注意：不是 "Places API (New)"）
2. 點擊 **Places API** 卡片
3. 點擊右上角的 **「啟用」** 或 **「Enable」** 按鈕
4. 等待幾秒鐘，確認狀態變為 **Enabled**

### 步驟 3：啟用 Maps JavaScript API

1. 在 API 列表中，找到 **Maps JavaScript API** 卡片
2. 點擊 **Maps JavaScript API** 卡片
3. 點擊右上角的 **「啟用」** 或 **「Enable」** 按鈕
4. 等待幾秒鐘，確認狀態變為 **Enabled**

## ✅ 啟用後確認

啟用所有三個 API 後，請確認：

- [ ] Geocoding API 狀態為 **Enabled**
- [ ] Places API 狀態為 **Enabled**
- [ ] Maps JavaScript API 狀態為 **Enabled**

## ⏱️ 等待時間

API 啟用後，通常需要 **1-2 分鐘** 才會完全生效。

## 🧪 測試步驟

1. 等待 1-2 分鐘讓 API 生效
2. 清除瀏覽器快取或使用無痕模式
3. 重新載入網頁
4. 嘗試搜尋地址或店家名稱
5. 確認地圖可以正常顯示

## 🔍 如果仍有問題

如果啟用後仍有錯誤，請檢查：

1. **API Key 限制**：
   - 進入 Google Cloud Console → API 和服務 → 憑證
   - 點擊你的 API Key
   - 確認「應用程式限制」設定正確
   - 如果使用 HTTP referrer 限制，確認包含你的網域

2. **重新部署**：
   - 如果修改了 Vercel 環境變數，需要重新部署

3. **瀏覽器 Console**：
   - 開啟開發者工具（F12）
   - 查看 Console 中的錯誤訊息

## 📝 注意事項

- **Places API (New)** 和 **Places API** 是不同的 API
- 我們需要的是 **Places API**（舊版），不是 "Places API (New)"
- 兩個可以同時啟用，不會衝突

---

**完成後請重新測試地址搜尋功能！**

