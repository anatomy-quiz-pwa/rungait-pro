# Curved Treadmill Locations API 測試清單

## 前置準備

### 1. 環境變數設定
在專案根目錄建立 `.env.local` 檔案（參考 `.env.local.example`）：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://pfprjwcywuhrsszpbxlk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. Supabase 資料庫設定
在 Supabase SQL Editor 執行 `supabase_migration_curved_treadmill_locations.sql` 檔案中的所有 SQL。

### 3. 測試使用者準備
確保 Supabase 中有以下測試使用者：
- **User A**: `can_upload = true` 在 `public.user_access` 表中
- **User B**: `can_upload = false` 在 `public.user_access` 表中
- **User C**: 不存在於 `public.user_access` 表中

---

## 測試清單

### ✅ 測試 1: 未登入 GET 可成功

**請求：**
```bash
curl -X GET http://localhost:3000/api/locations
```

**預期結果：**
- ✅ Status: `200 OK`
- ✅ 回傳 JSON 包含 `success: true`, `count`, `data` 陣列
- ✅ 即使未登入也能看到所有 locations
- ✅ 每個 location 包含 `is_registered_user`, `can_upload`, `has_analysis` 欄位

**驗證點：**
- [ ] 回應格式正確
- [ ] 可以取得 locations 列表
- [ ] view 欄位正確顯示

---

### ✅ 測試 2: 未登入 POST 失敗（401）

**請求：**
```bash
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Location",
    "lat": 25.0330,
    "lng": 121.5654
  }'
```

**預期結果：**
- ✅ Status: `401 Unauthorized`
- ✅ 錯誤訊息: `"Unauthorized. Please log in."`

**驗證點：**
- [ ] 正確回傳 401
- [ ] 錯誤訊息清楚

---

### ✅ 測試 3: 登入但 can_upload=false POST 失敗（403）

**前置：**
1. 使用 User B（`can_upload = false`）登入
2. 取得 Supabase session token（從 cookies 或 Authorization header）

**請求：**
```bash
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Test Location",
    "lat": 25.0330,
    "lng": 121.5654
  }'
```

**預期結果：**
- ✅ Status: `403 Forbidden`
- ✅ 錯誤訊息包含權限相關說明
- ✅ 提到 `can_upload` 必須為 true

**驗證點：**
- [ ] 正確回傳 403
- [ ] RLS policy 正確拒絕
- [ ] 錯誤訊息清楚說明原因

---

### ✅ 測試 4: 登入且 can_upload=true POST 成功

**前置：**
1. 使用 User A（`can_upload = true`）登入
2. 取得 Supabase session token

**請求：**
```bash
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "台北跑步機中心",
    "lat": 25.0330,
    "lng": 121.5654,
    "address": "台北市信義區信義路五段7號",
    "city": "台北市",
    "description": "專業弧形跑步機訓練中心"
  }'
```

**預期結果：**
- ✅ Status: `201 Created`
- ✅ 回傳 JSON 包含 `success: true`, `message`, `data`
- ✅ `data.owner_user_id` 自動設為當前登入使用者 ID
- ✅ 即使前端傳了 `owner_user_id`，也會被忽略

**驗證點：**
- [ ] 成功建立 location
- [ ] `owner_user_id` 正確設定
- [ ] 前端無法覆寫 `owner_user_id`
- [ ] 所有必填欄位驗證通過

---

### ✅ 測試 5: 驗證必填欄位

**測試 5a: 缺少 name**
```bash
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "lat": 25.0330,
    "lng": 121.5654
  }'
```
預期: `400 Bad Request`, 錯誤訊息提到 `name` 必填

**測試 5b: 缺少 lat**
```bash
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Test",
    "lng": 121.5654
  }'
```
預期: `400 Bad Request`, 錯誤訊息提到 `lat` 必填

**測試 5c: 缺少 lng**
```bash
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Test",
    "lat": 25.0330
  }'
```
預期: `400 Bad Request`, 錯誤訊息提到 `lng` 必填

**測試 5d: lat/lng 範圍驗證**
```bash
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Test",
    "lat": 200,
    "lng": 121.5654
  }'
```
預期: `400 Bad Request`, 錯誤訊息提到 `lat` 範圍錯誤

---

### ✅ 測試 6: GET 回傳的 view 欄位正確

**請求：**
```bash
curl -X GET http://localhost:3000/api/locations
```

**驗證點：**
- [ ] 每個 location 包含 `is_registered_user` (boolean)
- [ ] 每個 location 包含 `can_upload` (boolean)
- [ ] 每個 location 包含 `has_analysis` (boolean)
- [ ] `is_registered_user`: 檢查 `owner_user_id` 是否存在於 `user_access`
- [ ] `can_upload`: 從 `user_access.can_upload` 取得
- [ ] `has_analysis`: 檢查 `jobs` 表中是否有該 `user_id` 的記錄

**測試案例：**
1. Location 的 owner 存在於 `user_access` 且 `can_upload=true` → `is_registered_user=true`, `can_upload=true`
2. Location 的 owner 存在於 `user_access` 且 `can_upload=false` → `is_registered_user=true`, `can_upload=false`
3. Location 的 owner 不存在於 `user_access` → `is_registered_user=false`, `can_upload=false`
4. Location 的 owner 在 `jobs` 表中有記錄 → `has_analysis=true`
5. Location 的 owner 在 `jobs` 表中沒有記錄 → `has_analysis=false`

---

## 測試工具建議

### 使用瀏覽器開發者工具
1. 開啟 Network tab
2. 測試 GET: 直接訪問 `http://localhost:3000/api/locations`
3. 測試 POST: 使用 Fetch API 或 curl

### 使用 Postman/Insomnia
1. 建立 Collection: "Curved Treadmill Locations API"
2. 設定環境變數: `BASE_URL`, `ACCESS_TOKEN`
3. 建立各個測試請求

### 使用 Supabase Dashboard
1. 檢查 `curved_treadmill_locations` 表是否有資料
2. 檢查 `curved_treadmill_locations_view` 是否正確顯示
3. 檢查 RLS policies 是否啟用

---

## 常見問題排查

### 問題 1: GET 回傳空陣列
- ✅ 檢查 Supabase 表中是否有資料
- ✅ 檢查 view 是否正確建立
- ✅ 檢查 RLS SELECT policy 是否正確

### 問題 2: POST 回傳 401
- ✅ 檢查 Authorization header 是否正確
- ✅ 檢查 Supabase session 是否有效
- ✅ 檢查 cookies 中是否有 session token

### 問題 3: POST 回傳 403
- ✅ 檢查 `user_access` 表中該使用者的 `can_upload` 是否為 `true`
- ✅ 檢查 RLS INSERT policy 是否正確
- ✅ 檢查 `owner_user_id` 是否等於 `auth.uid()`

### 問題 4: View 欄位顯示錯誤
- ✅ 檢查 view SQL 是否正確執行
- ✅ 檢查 `user_access` 和 `jobs` 表的資料
- ✅ 檢查 view 的 SELECT 權限

---

## 完成檢查清單

- [ ] 環境變數已設定
- [ ] Supabase SQL migration 已執行
- [ ] 測試使用者已準備
- [ ] 所有測試案例已通過
- [ ] RLS policies 正常運作
- [ ] View 正確顯示所有欄位
- [ ] API 錯誤處理正確
- [ ] 安全性檢查通過（無法覆寫 `owner_user_id`）

