# 測試 Location Register API 指南

## 方法 1：使用測試腳本（推薦）

### 前置條件

1. 確認 Next.js dev server 正在運行：
   ```bash
   cd running-gait/fullstack/frontend
   pnpm dev
   ```

2. 確認 `.env.local` 中有必要的環境變數：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 執行測試

在 `frontend` 目錄下執行：

```bash
node test-location-register.js
```

### 測試生產環境

如果要測試 Vercel 部署的生產環境：

```bash
API_URL=https://your-project.vercel.app node test-location-register.js
```

## 方法 2：使用 curl

### 本地測試

```bash
curl -X POST http://localhost:3000/api/locations/register \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_test_1234567890",
    "user_email": "test@example.com",
    "name": "測試地點",
    "lat": 25.0330,
    "lng": 121.5654,
    "address": "台北市信義區信義路五段7號",
    "city": "台北市",
    "source": "manual",
    "description": "這是一個測試地點"
  }'
```

### 生產環境測試

```bash
curl -X POST https://your-project.vercel.app/api/locations/register \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_test_1234567890",
    "user_email": "test@example.com",
    "name": "測試地點",
    "lat": 25.0330,
    "lng": 121.5654,
    "address": "台北市信義區信義路五段7號",
    "city": "台北市",
    "source": "manual",
    "description": "這是一個測試地點"
  }'
```

## 方法 3：在瀏覽器中測試

1. 前往 `/map/submit` 頁面
2. 填寫表單
3. 送出
4. 查看：
   - 瀏覽器 Console（前端錯誤）
   - Network 標籤（API 請求/回應）
   - Vercel Logs（server-side 日誌，如果是生產環境）

## 預期結果

### 成功（201 Created）

```json
{
  "ok": true,
  "id": "54f267d3-2521-43c9-92b4-884...",
  "message": "Location created successfully",
  "data": { ... }
}
```

### 失敗 - RLS Policy Violation (403 Forbidden)

```json
{
  "error": "Forbidden. You do not have permission to create locations.",
  "details": "RLS policy violation: new row violates row-level security policy...",
  "hint": "Please ensure the user exists in user_access table with can_upload = true..."
}
```

### 失敗 - 驗證錯誤 (400 Bad Request)

```json
{
  "error": "Field 'name' is required and must be a non-empty string"
}
```

## 檢查清單

- [ ] Next.js dev server 正在運行（本地測試）
- [ ] 環境變數已正確設定
- [ ] `user_access` 表中有 `can_upload = true` 的記錄
- [ ] RLS policy 已更新（執行 `FIX_RLS_POLICY.sql`）
- [ ] Supabase 連線正常

## 除錯步驟

1. **檢查 server-side 日誌**：
   - 本地：查看終端機輸出
   - 生產：查看 Vercel Logs

2. **檢查 Supabase**：
   - 確認 `user_access` 表有資料
   - 確認 RLS policy 已更新
   - 確認表結構正確

3. **檢查環境變數**：
   ```bash
   # 本地
   cat .env.local
   
   # 生產（Vercel Dashboard）
   Settings > Environment Variables
   ```

## 常見問題

### Q: "Unauthorized. Please log in."

A: 確認請求中包含 `user_id` 和 `user_email` 欄位。

### Q: "RLS policy violation"

A: 
1. 確認已執行 `FIX_RLS_POLICY.sql`
2. 確認 `user_access` 表中有 `can_upload = true` 的記錄
3. 查看 server-side 日誌確認使用的 `user_id`

### Q: "No user_access record found"

A: 在 Supabase 中執行：
```sql
INSERT INTO public.user_access (user_id, can_upload, plan)
VALUES ('your-user-id'::uuid, true, 'free');
```

