# 環境變數設定指南

## 需要設定的環境變數

在 Vercel Dashboard 中需要設定以下三個環境變數：

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

---

## 1. NEXT_PUBLIC_SUPABASE_URL

### 取得步驟：

1. **登入 Supabase Dashboard**
   - 前往 [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - 登入你的帳號

2. **選擇專案**
   - 在左側選單中選擇你的專案
   - 如果沒有專案，先建立一個新專案

3. **進入 Settings**
   - 點擊左側選單的 **Settings**（設定）
   - 點擊 **API** 子選單

4. **複製 Project URL**
   - 在 **Project URL** 區塊中
   - 你會看到類似這樣的 URL：
     ```
     https://xxxxxxxxxxxxx.supabase.co
     ```
   - 點擊複製按鈕或手動複製這個 URL

5. **設定到 Vercel**
   - 進入 Vercel Dashboard → 專案 → Settings → Environment Variables
   - 新增環境變數：
     - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
     - **Value**: `https://xxxxxxxxxxxxx.supabase.co`（你剛才複製的 URL）
     - **Environment**: 選擇 Production, Preview, Development（全部勾選）

### 範例格式：
```
https://abcdefghijklmnop.supabase.co
```

---

## 2. NEXT_PUBLIC_SUPABASE_ANON_KEY

### 取得步驟：

1. **在同一個 Supabase Dashboard 頁面**
   - 在 **API** 設定頁面中
   - 找到 **Project API keys** 區塊

2. **複製 anon/public key**
   - 你會看到兩個 key：
     - `anon` `public` - 這是我們需要的（公開的，可以在前端使用）
     - `service_role` `secret` - 這是私密的，不要使用這個
   - 點擊 `anon` `public` key 旁邊的複製按鈕
   - 或點擊 **Reveal** 按鈕後複製

3. **設定到 Vercel**
   - 進入 Vercel Dashboard → 專案 → Settings → Environment Variables
   - 新增環境變數：
     - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`（你剛才複製的 key）
     - **Environment**: 選擇 Production, Preview, Development（全部勾選）

### 範例格式：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**注意**：這是一個很長的字串（通常超過 100 個字元），請完整複製。

---

## 3. NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

### 取得步驟：

1. **登入 Google Cloud Console**
   - 前往 [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - 登入你的 Google 帳號

2. **選擇或建立專案**
   - 在頂部選擇你的專案
   - 如果沒有專案，點擊「建立專案」建立一個新專案

3. **進入 API 和服務 → 憑證**
   - 在左側選單中，點擊 **API 和服務**
   - 點擊 **憑證** 子選單

4. **建立或選擇 API Key**
   - 如果已經有 API Key，直接使用
   - 如果沒有，點擊 **建立憑證** → **API 金鑰**
   - 系統會自動建立一個新的 API Key

5. **複製 API Key**
   - 點擊 API Key 旁邊的複製按鈕
   - 或點擊 API Key 名稱進入詳情頁面後複製

6. **設定到 Vercel**
   - 進入 Vercel Dashboard → 專案 → Settings → Environment Variables
   - 新增環境變數：
     - **Key**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
     - **Value**: `AIzaSyA8ZJkjc18cCppnTCrrtu0105jBewHt1dU`（你剛才複製的 key）
     - **Environment**: 選擇 Production, Preview, Development（全部勾選）

### 範例格式：
```
AIzaSyA8ZJkjc18cCppnTCrrtu0105jBewHt1dU
```

**注意**：這是一個以 `AIza` 開頭的字串（通常 39 個字元）。

---

## 在 Vercel 中設定環境變數

### 步驟：

1. **進入 Vercel Dashboard**
   - 前往 [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - 登入你的帳號

2. **選擇專案**
   - 點擊你的專案名稱

3. **進入 Settings**
   - 點擊頂部選單的 **Settings**
   - 點擊左側選單的 **Environment Variables**

4. **新增環境變數**
   - 點擊 **Add New** 按鈕
   - 輸入 **Key** 和 **Value**
   - 選擇 **Environment**（建議全部勾選：Production, Preview, Development）
   - 點擊 **Save**

5. **重複步驟 4**，新增其他兩個環境變數

6. **重新部署**
   - 環境變數變更後，需要重新部署才會生效
   - 可以點擊 **Deployments** → 選擇最新的 deployment → **Redeploy**
   - 或推送新的 commit 觸發自動部署

---

## 驗證環境變數

### 方法 1：檢查 Vercel Dashboard
1. 進入 Vercel Dashboard → 專案 → Settings → Environment Variables
2. 確認三個環境變數都已存在
3. 確認 Environment 設定正確（全部勾選）

### 方法 2：檢查部署後的網站
1. 開啟部署後的網站
2. 開啟瀏覽器開發者工具（F12）
3. 在 Console 中輸入：
   ```javascript
   console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
   console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
   console.log('Google Maps Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 10) + '...')
   ```
4. 確認都有值（不是 `undefined`）

**注意**：在生產環境中，`process.env` 不會顯示完整值（安全考量），但可以檢查是否為 `undefined`。

---

## 常見問題

### Q: 環境變數設定後沒有生效？
**A**: 環境變數變更後需要重新部署。請在 Vercel 中觸發新的部署。

### Q: 如何確認環境變數是否正確？
**A**: 
1. 檢查 Vercel Dashboard 中的環境變數列表
2. 查看 Vercel Function Logs 中的錯誤訊息
3. 檢查瀏覽器 Console 是否有相關錯誤

### Q: API Key 被洩露了怎麼辦？
**A**: 
- 在 Google Cloud Console 中重新建立新的 API Key
- 更新 Vercel 環境變數
- 刪除舊的 API Key
- 重新部署

### Q: 環境變數應該設定在哪個環境？
**A**: 建議全部勾選（Production, Preview, Development），這樣在所有環境中都能正常運作。

---

## 安全注意事項

1. **不要**將環境變數提交到 Git
   - 這些值應該只在 Vercel Dashboard 中設定
   - `.env.local` 檔案應該在 `.gitignore` 中

2. **API Key 限制**
   - 在 Google Cloud Console 中設定 HTTP referrer 限制
   - 只允許你的網域使用 API Key

3. **定期檢查**
   - 定期檢查環境變數是否正確設定
   - 如果 API Key 洩露，立即重新建立

---

**完成設定後，請重新部署應用程式，然後測試功能！**

