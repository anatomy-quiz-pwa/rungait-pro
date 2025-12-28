-- ============================================
-- 驗證 Migration 狀態
-- ============================================
-- 執行此 SQL 來確認 migration 是否完整

-- 1. 確認 contact_info 欄位存在
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'curved_treadmill_locations'
AND column_name = 'contact_info';

-- 預期結果：應該看到一行，顯示 contact_info (text, nullable)

-- 2. 檢查所有欄位（確認表結構完整）
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'curved_treadmill_locations'
ORDER BY ordinal_position;

-- 預期欄位：
-- id (uuid, NOT NULL)
-- owner_user_id (uuid, NOT NULL)
-- name (text, NOT NULL)
-- lat (numeric, NOT NULL)
-- lng (numeric, NOT NULL)
-- address (text, nullable)
-- city (text, nullable)
-- description (text, nullable)
-- contact_info (text, nullable) ← 剛新增的
-- created_at (timestamptz, NOT NULL)
-- updated_at (timestamptz, NOT NULL)

-- 3. 測試插入（可選，用於驗證）
-- 注意：這需要有效的 user_id 和 can_upload 權限
-- INSERT INTO public.curved_treadmill_locations (
--   owner_user_id,
--   name,
--   lat,
--   lng,
--   address,
--   contact_info
-- ) VALUES (
--   'your-user-id-here'::uuid,
--   '測試地點',
--   25.0330,
--   121.5654,
--   '測試地址',
--   '測試聯絡資訊'
-- );

-- 4. 檢查 RLS 是否啟用
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'curved_treadmill_locations';

-- 預期：rowsecurity 應該是 true

-- 5. 檢查 RLS Policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'curved_treadmill_locations';

-- 預期應該有 4 個 policies：
-- - curved_treadmill_locations_select_public (SELECT)
-- - curved_treadmill_locations_insert_authenticated_with_upload_permission (INSERT)
-- - curved_treadmill_locations_update_owner_only (UPDATE)
-- - curved_treadmill_locations_delete_owner_only (DELETE)

