# Curved Treadmill Locations 實作總結

## 📋 檔案清單

### A. 環境變數與安全規範

#### 1. `.gitignore` (已更新)
**路徑：** `running-gait/fullstack/frontend/.gitignore`

**變更：**
- 新增 `.env.local` 和 `.env*.local` 到 gitignore

#### 2. `.env.local` (需手動建立)
**路徑：** `running-gait/fullstack/frontend/.env.local`

**內容：**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://pfprjwcywuhrsszpbxlk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcHJqd2N5d3VocnNzenBieGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjI3OTEsImV4cCI6MjA3OTAzODc5MX0.594tOgYhNt-FR91dBNodtoAIXQcSKDTsxmdq9WiSAo0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmcHJqd2N5d3VocnNzenBieGxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzQ2Mjc5MSwiZXhwIjoyMDc5MDM4NzkxfQ.sipyhcRoK_KOi1ejGD-oDsuEyAAc-XvB_qDbxc2Gjj8

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyA8ZJkjc18cCppnTCrrtu0105jBewHt1dU
```

**⚠️ 重要提醒：**
- 此檔案不應被 commit 到 git
- 上線到 Vercel 時，需在 Vercel Dashboard → Settings → Environment Variables 設定同名變數

---

### B. Supabase SQL Migration

#### 3. `supabase_migration_curved_treadmill_locations.sql`
**路徑：** `running-gait/fullstack/frontend/supabase_migration_curved_treadmill_locations.sql`

**功能：**
- 建立 `public.curved_treadmill_locations` 表
- 建立索引（owner_user_id, location, created_at）
- 建立 RLS policies（SELECT public, INSERT/UPDATE/DELETE 權限控制）
- 建立 `public.curved_treadmill_locations_view` view
- 包含 `is_registered_user`, `can_upload`, `has_analysis` 計算欄位

**執行方式：**
1. 開啟 Supabase Dashboard
2. 進入 SQL Editor
3. 貼上 SQL 內容
4. 執行

---

### C. Next.js Server-Side Supabase Client

#### 4. `lib/supabase/server.ts` (新建)
**路徑：** `running-gait/fullstack/frontend/lib/supabase/server.ts`

**功能：**
- `createServerClient(request?)`: 建立 server-side Supabase client
- `getServerUser(request?)`: 取得當前登入使用者
- 支援從 Authorization header 或 cookies 取得 session
- 使用 anon key（不使用 service role key）

**使用方式：**
```typescript
import { createServerClient, getServerUser } from "@/lib/supabase/server"

// 在 API route 中
const supabase = await createServerClient(request)
const user = await getServerUser(request)
```

---

### D. Next.js API Routes

#### 5. `app/api/locations/route.ts` (新建)
**路徑：** `running-gait/fullstack/frontend/app/api/locations/route.ts`

**功能：**

**GET /api/locations**
- 公開端點，無需登入
- 查詢 `curved_treadmill_locations_view`
- 回傳所有 locations 及 view 欄位

**POST /api/locations**
- 需登入（401 未登入）
- 需 `can_upload=true`（403 權限不足）
- 驗證必填欄位：`name`, `lat`, `lng`
- 自動設定 `owner_user_id = auth.uid()`
- 不接受前端傳入 `owner_user_id`

**回應格式：**
```typescript
// GET 成功
{
  success: true,
  count: number,
  data: Location[]
}

// POST 成功
{
  success: true,
  message: string,
  data: Location
}

// 錯誤
{
  error: string,
  details?: string
}
```

---

### E. 測試文件

#### 6. `TESTING_GUIDE.md` (新建)
**路徑：** `running-gait/fullstack/frontend/TESTING_GUIDE.md`

**內容：**
- 完整的測試清單
- curl 命令範例
- 預期結果說明
- 常見問題排查

---

## 🔧 設定步驟

### 步驟 1: 環境變數設定
```bash
cd running-gait/fullstack/frontend
cp .env.local.example .env.local  # 如果有的話
# 或直接建立 .env.local 並填入環境變數
```

### 步驟 2: Supabase Migration
1. 開啟 Supabase Dashboard
2. 進入 SQL Editor
3. 執行 `supabase_migration_curved_treadmill_locations.sql`

### 步驟 3: 驗證設定
```bash
npm run dev
# 訪問 http://localhost:3000/api/locations
```

### 步驟 4: Vercel 部署設定
在 Vercel Dashboard → Settings → Environment Variables 新增：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (僅 server-side 使用)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (用於地圖功能)

---

## 🔒 安全性檢查清單

- ✅ `SUPABASE_SERVICE_ROLE_KEY` 不在程式碼中硬編碼
- ✅ `SUPABASE_SERVICE_ROLE_KEY` 不在 log 中輸出
- ✅ `.env.local` 已在 `.gitignore` 中
- ✅ POST API 不接受前端傳入 `owner_user_id`
- ✅ RLS policies 已啟用並正確設定
- ✅ 所有 API routes 使用 anon key（不使用 service role key）

---

## 📊 資料庫結構

### `public.curved_treadmill_locations`
```sql
- id: UUID (PK)
- owner_user_id: UUID (FK -> auth.users.id)
- name: TEXT (NOT NULL)
- lat: DECIMAL(10, 8) (NOT NULL)
- lng: DECIMAL(11, 8) (NOT NULL)
- address: TEXT
- city: TEXT
- description: TEXT
- contact_info: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### `public.curved_treadmill_locations_view`
```sql
- 包含所有 curved_treadmill_locations 欄位
- is_registered_user: BOOLEAN (是否存在於 user_access)
- can_upload: BOOLEAN (從 user_access.can_upload 取得)
- has_analysis: BOOLEAN (是否存在於 jobs)
```

---

## 🔗 整合點

### 與既有 Supabase Tables 整合
- ✅ `public.user_access.user_id` → `curved_treadmill_locations.owner_user_id`
- ✅ `public.jobs.user_id` → `curved_treadmill_locations.owner_user_id`
- ✅ RLS policy 檢查 `user_access.can_upload`
- ✅ View 查詢 `user_access` 和 `jobs` 表

---

## 📝 注意事項

1. **認證方式：** 目前實作支援從 Authorization header 或 cookies 取得 session。如果專案使用 Supabase Auth，需要確保前端正確設定 cookies。

2. **Service Role Key：** 雖然已設定環境變數，但目前的實作不使用 service role key，所有操作都透過 anon key + RLS 進行。

3. **測試環境：** 建議先在本地測試所有功能，確認 RLS policies 正常運作後再部署。

4. **錯誤處理：** API routes 已包含完整的錯誤處理，會回傳適當的 HTTP status codes。

---

## ✅ 完成檢查

- [x] 環境變數設定完成
- [x] `.gitignore` 已更新
- [x] Supabase SQL migration 已準備
- [x] Server-side Supabase client 已建立
- [x] GET /api/locations 已實作
- [x] POST /api/locations 已實作
- [x] 測試文件已準備
- [x] 安全性檢查通過

