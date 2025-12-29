# 前端提交除錯指南

## 問題診斷

SQL 測試已成功，表示 RLS policy 和資料庫結構都正常。如果前端提交仍然失敗，可能是以下原因：

### 1. 檢查前端 Console 輸出

在瀏覽器中：
1. 開啟開發者工具（F12）
2. 進入 Console 標籤
3. 前往 `/map/submit` 頁面
4. 填寫表單並送出
5. 查看 Console 輸出，應該會看到類似這樣的日誌：

```
[POST /api/locations/register] Using existing user_id from user_access for mock user: 06a4851c-0fa2-42ba-a707-ad389d8573aa, Original: user_1234567890, can_upload: true, display_name: 林世奇
```

### 2. 檢查 Network 請求

在開發者工具的 Network 標籤中：
1. 找到 `/api/locations/register` 請求
2. 查看 Request Payload，確認包含：
   - `user_id`: 應該是 `user_${timestamp}` 格式（前端生成的）
   - `name`, `lat`, `lng`, `source` 等欄位
3. 查看 Response，確認：
   - 如果成功：`{ ok: true, id: "..." }`
   - 如果失敗：錯誤訊息

### 3. 常見問題

#### 問題 A：user_id 格式不正確
- **症狀**：API 返回 "invalid input syntax for type uuid"
- **原因**：前端傳遞的 `user.id` 不是 UUID 格式
- **解決**：API route 應該會自動處理，查詢 `user_access` 表取得有效的 UUID

#### 問題 B：RLS policy 拒絕
- **症狀**：API 返回 "new row violates row-level security policy"
- **原因**：選擇的 `user_id` 在 `user_access` 表中 `can_upload = false`
- **解決**：確認 `user_access` 表中有 `can_upload = true` 的記錄

#### 問題 C：前端未傳遞 user_id
- **症狀**：API 返回 "Unauthorized. Please log in."
- **原因**：`useAuth()` 返回的 `user` 為 `null`
- **解決**：確認用戶已登入（檢查 localStorage 中的 `auth_user`）

### 4. 測試步驟

1. **確認用戶已登入**
   ```javascript
   // 在瀏覽器 Console 中執行
   JSON.parse(localStorage.getItem('auth_user'))
   ```
   應該返回一個包含 `id` 和 `email` 的物件

2. **確認 user_access 表有資料**
   在 Supabase SQL Editor 執行：
   ```sql
   SELECT user_id, can_upload, display_name 
   FROM public.user_access 
   WHERE can_upload = true;
   ```

3. **測試前端提交**
   - 前往 `/map/submit`
   - 填寫表單
   - 送出
   - 檢查 Console 和 Network 輸出

### 5. 預期行為

當前端提交時，API route 應該：
1. 接收 `user_id`（格式：`user_${timestamp}`）
2. 檢測到不是 UUID 格式
3. 查詢 `user_access` 表，取得第一個 `can_upload = true` 的 `user_id`
4. 使用該 UUID 插入資料
5. 返回成功訊息

### 6. 如果仍然失敗

請提供：
- Console 的完整錯誤訊息
- Network 標籤中的 Request Payload 和 Response
- 任何相關的錯誤堆疊

