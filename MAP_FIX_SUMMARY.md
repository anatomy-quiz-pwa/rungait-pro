# 地圖功能修正總結

## ✅ 現況檢查

### 已確認
- ✅ `components/RunGaitMap.tsx` 已有 `'use client'` 標記
- ✅ 使用 `process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- ✅ 使用 `@react-google-maps/api` 的 `useLoadScript`
- ✅ 從 `GET /api/locations` 取得 locations
- ✅ 顯示 markers 和 InfoWindow
- ✅ `app/map/page.tsx` 正確使用 `RunGaitMap` 組件
- ✅ 沒有找到 Mapbox 相關代碼或環境變數

### 問題分析
如果頁面顯示「地圖功能需要 Mapbox/Google Maps API key，目前顯示清單模式」，可能原因：
1. 環境變數 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 未設定或未正確讀取
2. 瀏覽器快取了舊版本
3. Next.js build 快取問題

## 🔧 修正步驟

### 1. 確認環境變數設定

#### 本機開發 (.env.local)
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyA8ZJkjc18cCppnTCrrtu0105jBewHt1dU
```

#### Vercel Dashboard
在 Environment Variables 中設定：
- Key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Value: `AIzaSyA8ZJkjc18cCppnTCrrtu0105jBewHt1dU`
- Environments: Production, Preview, Development (全部勾選)

### 2. 清除快取並重新 build

```bash
# 清除 Next.js 快取
rm -rf .next

# 重新 build
pnpm run build

# 重新啟動開發伺服器
pnpm run dev
```

### 3. 驗證環境變數讀取

在瀏覽器 Console 檢查：
```javascript
// 應該顯示 API key（注意：NEXT_PUBLIC_ 變數會暴露在前端）
console.log(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
```

## 📋 檔案清單

### 已確認正確的檔案
1. ✅ `components/RunGaitMap.tsx` - 已正確實作
2. ✅ `app/map/page.tsx` - 已正確使用 RunGaitMap

### 不需要修改的檔案
- `components/map/google-map.tsx` - 這是另一個組件，目前未使用

## 🚀 部署檢查清單

- [ ] Vercel Environment Variables 已設定 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] 已清除 Next.js 快取並重新 build
- [ ] 瀏覽器已清除快取
- [ ] 地圖正常顯示（不是錯誤訊息）

## 🔍 除錯步驟

如果地圖仍然無法顯示：

1. **檢查環境變數是否正確讀取**
   - 在 `RunGaitMap.tsx` 中加入 `console.log('API Key:', apiKey)`
   - 檢查瀏覽器 Console 輸出

2. **檢查 API 是否正常**
   - 在瀏覽器 Network tab 檢查 `/api/locations` 請求
   - 確認回傳格式正確

3. **檢查 Google Maps API 是否啟用**
   - 確認 Google Cloud Console 中 Maps JavaScript API 已啟用
   - 確認 API Key 沒有被限制或過期

