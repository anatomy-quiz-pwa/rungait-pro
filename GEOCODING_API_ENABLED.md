# Geocoding API 啟用確認

## ✅ 已啟用 Geocoding API

您已經在 Google Cloud Console 中啟用了 Geocoding API。現在請按照以下步驟確認設定：

## 檢查清單

### 1. 確認 API 已啟用
- [x] Geocoding API 已啟用
- [ ] Places API 已啟用（用於店家搜尋）
- [ ] Maps JavaScript API 已啟用（用於地圖顯示）

### 2. 確認 API Key 設定
- [ ] API Key 狀態為「已啟用」
- [ ] API Key 的 HTTP referrer 限制包含你的網域
- [ ] Vercel 環境變數 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 已設定

### 3. 測試步驟
1. 重新部署應用程式（如果環境變數有變更）
2. 清除瀏覽器快取
3. 使用無痕模式測試
4. 嘗試搜尋地址或店家名稱

## 預期行為

啟用 Geocoding API 後，您應該能夠：

1. ✅ **搜尋地址**：輸入完整地址（例如：台北市信義區信義路五段7號）
2. ✅ **搜尋店家**：輸入店家名稱（例如：台北101、星巴克）
3. ✅ **自動定位**：選擇地址或店家後，地圖會自動定位到該位置
4. ✅ **自動填入**：表單會自動填入名稱、地址等資訊

## 如果仍有問題

如果啟用 Geocoding API 後仍有「搜尋請求被拒絕」錯誤，請檢查：

1. **等待時間**：API 啟用後可能需要 1-2 分鐘才會生效
2. **API Key 限制**：確認 API Key 的 HTTP referrer 限制包含你的網域
3. **重新部署**：如果修改了環境變數，需要重新部署
4. **瀏覽器 Console**：查看詳細錯誤訊息

## 相關文件

- `REQUEST_DENIED_DEBUG.md` - 完整的除錯指南
- `GOOGLE_MAPS_ERROR_FIX.md` - Google Maps 錯誤修復指南

---

**最後更新：** 2025-01-XX

