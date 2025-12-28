# 送出資料錯誤除錯指南

## 錯誤訊息
「Internal server error」或「提交失敗」

## 可能原因與解決方法

### 1. Supabase 環境變數未設定 ⚠️ 最常見

**檢查步驟：**
1. 進入 Vercel Dashboard → 專案 → Settings → Environment Variables
2. 確認以下環境變數已設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**解決方法：**
- 如果未設定，新增環境變數
- 重新部署應用程式（環境變數變更需要重新部署）

### 2. 使用者未登入

**檢查步驟：**
1. 確認使用者已登入
2. 檢查瀏覽器 Console 是否有認證相關錯誤

**解決方法：**
- 重新登入
- 檢查 Supabase Auth session 是否有效

### 3. 使用者沒有 `can_upload` 權限

**檢查步驟：**
1. 在 Supabase Dashboard 中檢查 `user_access` 表
2. 確認該使用者的 `can_upload` 欄位為 `true`

**解決方法：**
- 在 Supabase 的 `user_access` 表中，將該使用者的 `can_upload` 設為 `true`
- 或透過 Admin 介面啟用使用者的上傳權限

### 4. 資料庫欄位不匹配

**檢查步驟：**
1. 查看瀏覽器 Console 的錯誤訊息
2. 查看 Vercel Function Logs

**解決方法：**
- 檢查 `curved_treadmill_locations` 表的實際結構
- 確認所有需要的欄位都存在
- API 會自動處理不存在的欄位（如 `source`、`google_place_id`）

### 5. RLS Policy 問題

**檢查步驟：**
1. 查看瀏覽器 Console 的錯誤訊息
2. 如果錯誤訊息包含 "permission" 或 "policy"，可能是 RLS 問題

**解決方法：**
- 檢查 Supabase RLS policies
- 確認 `curved_treadmill_locations_insert_authenticated_with_upload_permission` policy 正確設定

## 除錯步驟

### 步驟 1：檢查瀏覽器 Console
1. 開啟瀏覽器開發者工具（F12）
2. 查看 Console 標籤
3. 搜尋 `[ManualLocationForm]` 或 `[POST /api/locations/register]`
4. 查看詳細錯誤訊息

### 步驟 2：檢查 Network 標籤
1. 開啟開發者工具（F12）
2. 查看 Network 標籤
3. 找到 `/api/locations/register` 請求
4. 查看 Request 和 Response 內容
5. 查看 Response 的 status code 和 error message

### 步驟 3：檢查 Vercel Logs
1. 進入 Vercel Dashboard
2. 進入專案的 Deployments 頁面
3. 點擊最新的 deployment
4. 查看 Function Logs
5. 搜尋 `[POST /api/locations/register]`

### 步驟 4：檢查 Supabase Logs
1. 進入 Supabase Dashboard
2. 點擊 Logs 標籤
3. 查看 Postgres Logs 和 API Logs
4. 搜尋相關錯誤

## 常見錯誤訊息對照表

| 錯誤訊息 | HTTP Status | 可能原因 | 解決方法 |
|---------|------------|---------|---------|
| "Unauthorized. Please log in." | 401 | 使用者未登入 | 重新登入 |
| "Forbidden. You do not have permission..." | 403 | 沒有 can_upload 權限 | 啟用使用者的 can_upload 權限 |
| "Server configuration error" | 500 | Supabase 環境變數未設定 | 檢查 Vercel 環境變數 |
| "Database connection error" | 500 | Supabase 連接失敗 | 檢查 Supabase 服務狀態 |
| "Failed to create location" | 500 | 資料庫插入失敗 | 檢查 Supabase Logs |
| "Internal server error" | 500 | 未預期的錯誤 | 查看 Vercel Logs 和 Supabase Logs |

## 測試檢查清單

- [ ] Vercel 環境變數 `NEXT_PUBLIC_SUPABASE_URL` 已設定
- [ ] Vercel 環境變數 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已設定
- [ ] 使用者已登入
- [ ] 使用者的 `can_upload` 權限已啟用
- [ ] 瀏覽器 Console 沒有錯誤訊息
- [ ] Network 標籤中的 API 請求成功
- [ ] Vercel Function Logs 沒有錯誤

## 如果問題仍然存在

1. **查看瀏覽器 Console 的完整錯誤訊息**
   - 開啟開發者工具（F12）
   - 查看 Console 標籤
   - 查看 Network 標籤中的 API 請求

2. **查看 Vercel Function Logs**
   - 進入 Vercel Dashboard
   - 查看 Function Logs
   - 搜尋 `[POST /api/locations/register]`

3. **查看 Supabase Logs**
   - 進入 Supabase Dashboard
   - 查看 Logs
   - 搜尋相關錯誤

4. **提供完整的錯誤訊息**
   - 瀏覽器 Console 的錯誤訊息
   - Network 標籤中的 Request/Response
   - Vercel Function Logs 的錯誤訊息

---

**最後更新：** 2025-01-XX
**相關文件：** `ERROR_DEBUGGING_GUIDE.md`, `REQUEST_DENIED_DEBUG.md`

