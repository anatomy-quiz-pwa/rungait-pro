# Internal Server Error 除錯指南

## 問題描述

當使用者提交表單時，出現 "Internal server error" 錯誤訊息。

## 可能的原因

### 1. Supabase 環境變數未設定
**症狀**：API 回傳 500 錯誤，錯誤訊息包含 "Server configuration error"

**解決方法**：
- 檢查 Vercel 環境變數設定
- 確認 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已正確設定

### 2. 使用者未登入或認證失敗
**症狀**：API 回傳 401 錯誤（"Unauthorized"）

**解決方法**：
- 確認使用者已登入
- 檢查 Supabase Auth session 是否有效

### 3. 使用者沒有 `can_upload` 權限
**症狀**：API 回傳 403 錯誤（"Forbidden"）

**解決方法**：
- 在 Supabase 的 `user_access` 表中，確認該使用者的 `can_upload` 欄位為 `true`
- 或透過 Admin 介面啟用使用者的上傳權限

### 4. 資料庫欄位不存在
**症狀**：API 回傳 500 錯誤，錯誤訊息包含 "column does not exist"

**解決方法**：
- 檢查 `curved_treadmill_locations` 表的實際結構
- 確認所有需要的欄位都存在
- 如果表沒有 `source` 或 `google_place_id` 欄位，API 會自動移除這些欄位並重試

### 5. RLS Policy 問題
**症狀**：API 回傳 403 錯誤，錯誤訊息包含 "RLS policy violation"

**解決方法**：
- 檢查 Supabase RLS policies
- 確認 `curved_treadmill_locations_insert_authenticated_with_upload_permission` policy 正確設定

## 除錯步驟

### 1. 檢查瀏覽器 Console
開啟瀏覽器開發者工具（F12），查看 Console 和 Network 標籤：
- 查看 Network 標籤中的 API 請求
- 檢查回應的 status code 和 error message
- 查看 Console 中的錯誤訊息

### 2. 檢查 Vercel Logs
在 Vercel Dashboard 中查看 Function Logs：
- 進入專案的 Deployments 頁面
- 點擊最新的 deployment
- 查看 Function Logs，搜尋 `[POST /api/locations/register]`

### 3. 檢查 Supabase Logs
在 Supabase Dashboard 中查看 Logs：
- 進入 Supabase Dashboard
- 點擊 Logs 標籤
- 查看 Postgres Logs 和 API Logs

### 4. 測試 API 端點
使用 curl 或 Postman 測試 API：

```bash
curl -X POST https://your-domain.vercel.app/api/locations/register \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "name": "測試場地",
    "lat": 25.033,
    "lng": 121.565,
    "source": "manual",
    "address": "測試地址"
  }'
```

## 已實作的錯誤處理改進

### 1. 更詳細的錯誤訊息
- API 現在會回傳更詳細的錯誤訊息（在 development 模式下）
- 前端會顯示完整的錯誤訊息，而不只是 "Internal server error"

### 2. 分層錯誤處理
- 環境變數檢查
- 認證錯誤處理
- 資料庫連接錯誤處理
- Supabase 操作錯誤處理

### 3. 錯誤日誌記錄
- 所有錯誤都會記錄到 console
- 包含錯誤訊息、stack trace 和相關資訊

## 常見錯誤訊息對照表

| 錯誤訊息 | HTTP Status | 可能原因 | 解決方法 |
|---------|------------|---------|---------|
| "Unauthorized. Please log in." | 401 | 使用者未登入 | 重新登入 |
| "Forbidden. You do not have permission..." | 403 | 沒有 can_upload 權限 | 啟用使用者的 can_upload 權限 |
| "Server configuration error" | 500 | Supabase 環境變數未設定 | 檢查 Vercel 環境變數 |
| "Database connection error" | 500 | Supabase 連接失敗 | 檢查 Supabase 服務狀態 |
| "Failed to create location" | 500 | 資料庫插入失敗 | 檢查 Supabase Logs |
| "Internal server error" | 500 | 未預期的錯誤 | 查看 Vercel Logs 和 Supabase Logs |

## 下一步

如果問題仍然存在：
1. 查看 Vercel Function Logs 中的詳細錯誤訊息
2. 查看 Supabase Logs 中的資料庫錯誤
3. 檢查瀏覽器 Console 中的前端錯誤
4. 提供完整的錯誤訊息和 stack trace 以便進一步除錯

