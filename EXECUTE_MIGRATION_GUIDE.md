# 執行 Migration 指南

## 目標
執行 `supabase_migration_curved_treadmill_locations.sql` 檔案，確保資料庫表結構正確。

## 步驟

### 步驟 1：進入 Supabase Dashboard

1. 前往 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登入你的帳號
3. 選擇你的專案

### 步驟 2：進入 SQL Editor

1. 在左側選單中，點擊 **SQL Editor**
2. 點擊 **New query** 或使用現有的查詢視窗

### 步驟 3：複製 Migration SQL

1. 開啟專案中的 `supabase_migration_curved_treadmill_locations.sql` 檔案
2. 複製**整個檔案內容**（從 `-- ============================================` 開始到最後）

### 步驟 4：貼上並執行 SQL

1. 在 Supabase SQL Editor 中貼上複製的 SQL
2. 確認 SQL 內容完整
3. 點擊 **Run** 按鈕（或按 `Ctrl+Enter` / `Cmd+Enter`）

### 步驟 5：檢查執行結果

執行後應該會看到：
- ✅ 成功訊息（如果所有 SQL 都執行成功）
- 或者個別的成功訊息（每個 CREATE 語句）

**預期結果：**
- ✅ Table `curved_treadmill_locations` created
- ✅ Indexes created
- ✅ Trigger created
- ✅ RLS policies created
- ✅ View `curved_treadmill_locations_view` created

### 步驟 6：驗證表結構

在 SQL Editor 中執行以下查詢來驗證表結構：

```sql
-- 檢查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'curved_treadmill_locations';

-- 檢查所有欄位
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'curved_treadmill_locations'
ORDER BY ordinal_position;
```

**預期欄位：**
- `id` (uuid)
- `owner_user_id` (uuid)
- `name` (text)
- `lat` (numeric)
- `lng` (numeric)
- `address` (text, nullable)
- `city` (text, nullable)
- `description` (text, nullable)
- **`contact_info` (text, nullable)** ← 這是我們需要的欄位
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 步驟 7：檢查索引

```sql
-- 檢查索引
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'curved_treadmill_locations';
```

**預期索引：**
- `idx_curved_treadmill_locations_owner_user_id`
- `idx_curved_treadmill_locations_location`
- `idx_curved_treadmill_locations_created_at`

### 步驟 8：檢查 RLS Policies

```sql
-- 檢查 RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'curved_treadmill_locations';
```

**預期 Policies：**
- `curved_treadmill_locations_select_public`
- `curved_treadmill_locations_insert_authenticated_with_upload_permission`
- `curved_treadmill_locations_update_owner_only`
- `curved_treadmill_locations_delete_owner_only`

### 步驟 9：檢查 View

```sql
-- 檢查 View 是否存在
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'curved_treadmill_locations_view';

-- 測試查詢 View
SELECT * FROM public.curved_treadmill_locations_view LIMIT 1;
```

## 常見問題

### Q: 如果表已經存在怎麼辦？

**A:** Migration 檔案使用了 `CREATE TABLE IF NOT EXISTS`，所以如果表已經存在，不會報錯。但如果表結構不同，可能需要：

1. **選項 1：刪除並重建（謹慎使用）**
   ```sql
   DROP TABLE IF EXISTS public.curved_treadmill_locations CASCADE;
   -- 然後重新執行 migration
   ```

2. **選項 2：只新增缺少的欄位**
   ```sql
   -- 如果缺少 contact_info 欄位
   ALTER TABLE public.curved_treadmill_locations 
   ADD COLUMN IF NOT EXISTS contact_info TEXT;
   ```

### Q: 如果執行時出現錯誤怎麼辦？

**A:** 
1. 查看錯誤訊息，確認是哪個步驟失敗
2. 檢查是否是因為表/索引/policy 已經存在
3. 如果是權限問題，確認你使用的是正確的 Supabase 專案
4. 如果錯誤持續，可以分段執行 SQL（先執行 CREATE TABLE，再執行其他部分）

### Q: 如何確認 migration 執行成功？

**A:** 
1. 執行步驟 6-9 的驗證查詢
2. 確認所有欄位都存在（特別是 `contact_info`）
3. 嘗試在應用程式中送出表單，應該不會再出現欄位錯誤

## 執行後測試

1. **重新整理應用程式**（清除快取）
2. **嘗試送出表單**
3. **檢查 Console**，確認沒有欄位錯誤
4. **檢查 Supabase Table Editor**，確認資料已成功插入

## 注意事項

⚠️ **重要：**
- 執行 migration 前，建議先備份資料（如果表中有重要資料）
- 如果表已經有資料，執行 migration 不會刪除現有資料
- 如果表結構不同，可能需要手動調整

---

**完成後，請測試應用程式的送出功能，應該可以正常運作了！**

