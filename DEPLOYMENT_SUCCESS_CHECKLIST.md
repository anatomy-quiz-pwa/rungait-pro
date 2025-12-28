# 部署成功後檢查清單

## ✅ 部署狀態

根據 Vercel 部署日誌，build 已成功完成：
- ✅ 編譯成功（17.5s）
- ✅ 所有路由正常生成
- ✅ API routes 正常（`/api/locations/register` 已包含）
- ✅ 部署完成

## 🔍 運行時錯誤診斷

雖然 build 成功，但運行時可能出現錯誤。請按照以下步驟診斷：

### 步驟 1：檢查環境變數

1. 進入 Vercel Dashboard → 專案 → Settings → Environment Variables
2. 確認以下環境變數已設定：
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

3. **重要**：如果剛剛新增或修改了環境變數，需要：
   - 觸發新的部署
   - 或等待自動重新部署

### 步驟 2：測試功能

1. 開啟部署後的網站
2. 登入帳號
3. 進入 `/map/submit` 頁面
4. 填寫表單並送出
5. 觀察是否出現錯誤

### 步驟 3：查看瀏覽器 Console

1. 開啟開發者工具（F12）
2. 切換到 Console 標籤
3. 點擊「送出註冊」
4. 查看錯誤訊息：
   - 搜尋 `[ManualLocationForm]`
   - 搜尋 `[POST /api/locations/register]`
   - 查看完整的錯誤堆疊

### 步驟 4：查看 Network 標籤

1. 在開發者工具中切換到 Network 標籤
2. 點擊「送出註冊」
3. 找到 `/api/locations/register` 請求
4. 查看：
   - **Status Code**：應該是 200/201（成功）或 400/401/403/500（錯誤）
   - **Response**：查看錯誤訊息內容
   - **Request Payload**：確認送出的資料格式正確

### 步驟 5：查看 Vercel Function Logs

1. 進入 Vercel Dashboard
2. 進入專案的 Deployments 頁面
3. 點擊最新的 deployment
4. 查看 **Function Logs**
5. 搜尋 `[POST /api/locations/register]`
6. 查看詳細錯誤訊息

## 🐛 常見運行時錯誤

### 錯誤 1：Supabase 環境變數未設定

**症狀**：
- Console 顯示 "Server configuration error"
- Network Response 顯示 "Missing Supabase environment variables"

**解決方法**：
1. 在 Vercel 中設定環境變數
2. 重新部署

### 錯誤 2：使用者未登入

**症狀**：
- Console 顯示 "Unauthorized"
- Network Response status: 401

**解決方法**：
1. 確認使用者已登入
2. 檢查 Supabase Auth session

### 錯誤 3：沒有 can_upload 權限

**症狀**：
- Console 顯示 "Forbidden"
- Network Response status: 403
- 錯誤訊息包含 "can_upload"

**解決方法**：
1. 在 Supabase 的 `user_access` 表中
2. 將該使用者的 `can_upload` 設為 `true`

### 錯誤 4：資料庫連接失敗

**症狀**：
- Console 顯示 "Database connection error"
- Network Response status: 500

**解決方法**：
1. 檢查 Supabase 服務狀態
2. 確認環境變數正確
3. 檢查 Supabase Logs

## 📋 測試檢查清單

- [ ] Vercel 環境變數已設定
- [ ] 已重新部署（如果修改了環境變數）
- [ ] 使用者已登入
- [ ] 使用者的 `can_upload` 權限已啟用
- [ ] 瀏覽器 Console 沒有錯誤
- [ ] Network 標籤中的 API 請求成功
- [ ] Vercel Function Logs 沒有錯誤

## 🎯 下一步

1. **測試功能**：嘗試送出表單
2. **查看錯誤**：如果出現錯誤，查看 Console 和 Network
3. **提供資訊**：告訴我具體的錯誤訊息，我會協助修復

---

**部署已完成，現在請測試功能並查看運行時錯誤！**

