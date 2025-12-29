# 快速測試指南

## 目前狀態

- ❌ 本地 dev server 未運行（port 3000）
- ❌ `.env.local` 文件不存在

## 測試選項

### 選項 1：測試生產環境（Vercel）⭐ 推薦

如果你有 Vercel 部署 URL，可以直接測試生產環境：

```bash
cd running-gait/fullstack/frontend
API_URL=https://your-project.vercel.app node test-location-register.js
```

**優點**：
- 不需要啟動本地 server
- 測試真實的生產環境
- 可以直接查看 Vercel Logs

### 選項 2：啟動本地 dev server 測試

1. **啟動 dev server**：
   ```bash
   cd running-gait/fullstack/frontend
   pnpm dev
   ```
   等待看到 `Ready on http://localhost:3000`

2. **在另一個終端執行測試**：
   ```bash
   cd running-gait/fullstack/frontend
   node test-location-register.js
   ```

3. **查看日誌**：
   - 在 dev server 的終端查看 server-side 日誌
   - 測試腳本會顯示 API 回應

### 選項 3：使用 curl 測試（最簡單）

#### 測試生產環境：
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

#### 測試本地（需要先啟動 dev server）：
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

## 預期結果

### ✅ 成功（201 Created）
```json
{
  "ok": true,
  "id": "54f267d3-2521-43c9-92b4-884...",
  "message": "Location created successfully"
}
```

### ❌ RLS Policy Violation（403 Forbidden）
```json
{
  "error": "Forbidden. You do not have permission to create locations.",
  "details": "RLS policy violation: ..."
}
```

## 下一步

1. **選擇測試方式**（推薦選項 1 或 3）
2. **執行測試**
3. **查看結果**：
   - 如果成功：在 Supabase 確認資料已插入
   - 如果失敗：查看錯誤訊息，檢查 RLS policy 和 user_access 表

## 需要幫助？

如果測試失敗，請提供：
- 完整的錯誤訊息
- Vercel Logs（如果是生產環境）
- Supabase 中 `user_access` 表的資料

