# Vercel 環境變數設定檢查

## ✅ 從截圖看到的設定

根據您提供的 Vercel Dashboard 截圖：

1. **環境變數名稱**：`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` ✅ 正確
2. **環境範圍**：`Production, Preview, and Development` ✅ 正確（包含 Production）
3. **變數已存在**：✅ 已建立

## ⚠️ 需要確認的事項

### 1. 環境變數值是否正確

請確認 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 的值是：
```
AIzaSyA8ZJkjc18cCppnTCrrtu0105jBewHt1dU
```

**檢查方法：**
- 在 Vercel Dashboard 中，點擊 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 旁邊的眼睛圖示
- 確認值完全一致（沒有多餘空格、沒有換行）

### 2. 是否已重新部署

**重要：** 環境變數變更後，必須重新部署才會生效！

**步驟：**
1. 前往 Vercel Dashboard → **Deployments**
2. 找到最新的部署
3. 點擊右側的 **⋯** (三個點)
4. 選擇 **Redeploy**
5. 等待部署完成

### 3. 驗證環境變數是否生效

部署完成後：

1. 打開您的網站（例如：`https://your-project.vercel.app/map`）
2. 按 `F12` 打開瀏覽器開發者工具
3. 前往 **Console** 標籤
4. 應該會看到：
   ```
   [RunGaitMap] API Key check: { exists: true, length: 39, prefix: 'AIzaSyA8ZJ' }
   ```

**如果看到 `exists: false`**，表示環境變數沒有正確讀取。

### 4. Google Maps API Key 是否有效

即使環境變數設定正確，如果 Google Maps API key 本身有問題，地圖也無法載入。

**檢查步驟：**
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 確認 API key `AIzaSyA8ZJkjc18cCppnTCrrtu0105jBewHt1dU` 存在
3. 確認已啟用 **Maps JavaScript API**
4. 確認 API key 沒有設定過於嚴格的限制（例如只允許特定網域）

## 🔍 疑難排解步驟

### 步驟 1: 確認環境變數值
- [ ] 點擊眼睛圖示查看實際值
- [ ] 確認值為：`AIzaSyA8ZJkjc18cCppnTCrrtu0105jBewHt1dU`（沒有多餘空格）

### 步驟 2: 重新部署
- [ ] 前往 Deployments
- [ ] 手動觸發 Redeploy
- [ ] 等待部署完成

### 步驟 3: 檢查瀏覽器 Console
- [ ] 打開 `/map` 頁面
- [ ] 查看 Console 中的 `[RunGaitMap] API Key check` log
- [ ] 確認 `exists: true`

### 步驟 4: 檢查 Google Maps API
- [ ] 確認 API key 在 Google Cloud Console 中有效
- [ ] 確認已啟用 Maps JavaScript API
- [ ] 確認沒有過於嚴格的限制

## 📝 如果仍然無法連接

請提供：
1. 瀏覽器 Console 的完整錯誤訊息
2. Vercel 部署 log（特別是 build 階段）
3. 瀏覽器 Network 標籤中是否有 Google Maps API 的請求失敗

