-- ============================================
-- 驗證 RLS Policy 是否已正確更新
-- ============================================
-- 執行此 SQL 來確認 policy 是否包含模擬認證支援

-- 查看完整的 policy 定義
SELECT 
  policyname,
  cmd AS command_type,
  pg_get_expr(qual, 'public.curved_treadmill_locations'::regclass) AS qual_condition,
  pg_get_expr(with_check, 'public.curved_treadmill_locations'::regclass) AS with_check_condition
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'curved_treadmill_locations'
AND policyname = 'curved_treadmill_locations_insert_authenticated_with_upload_permission';

-- ============================================
-- 檢查 policy 是否包含模擬認證支援
-- ============================================
-- 如果 with_check_condition 包含以下內容，則表示已正確更新：
-- 1. 包含 "OR" 關鍵字（表示有兩種情況）
-- 2. 包含 "owner_user_id" 且不強制要求 "auth.uid() IS NOT NULL" 在 OR 條件中
-- 3. 包含 "user_access.user_id = owner_user_id"（模擬認證支援）

-- 如果 with_check_condition 只包含 "auth.uid() IS NOT NULL" 且沒有 OR，
-- 則需要重新執行修復 SQL

