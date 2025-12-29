-- ============================================
-- 檢查 RLS Policy 完整內容
-- ============================================
-- 執行此 SQL 來查看 policy 的完整內容

-- 方法 1：查看完整的 with_check 內容（使用 pg_get_expr）
SELECT 
  policyname,
  cmd,
  qual,
  pg_get_expr(with_check, 'public.curved_treadmill_locations'::regclass) AS with_check_full
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'curved_treadmill_locations'
AND policyname = 'curved_treadmill_locations_insert_authenticated_with_upload_permission';

-- 方法 2：查看所有相關的 policies
SELECT 
  policyname,
  cmd,
  pg_get_expr(qual, 'public.curved_treadmill_locations'::regclass) AS qual_full,
  pg_get_expr(with_check, 'public.curved_treadmill_locations'::regclass) AS with_check_full
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'curved_treadmill_locations';

-- ============================================
-- 檢查 policy 是否包含模擬認證支援
-- ============================================
-- 如果 with_check_full 包含 "owner_user_id" 且不強制要求 "auth.uid() IS NOT NULL"，
-- 則表示 policy 已正確更新

-- 預期的 with_check 應該包含：
-- 1. (auth.uid() IS NOT NULL AND owner_user_id = auth.uid() AND ...)
-- 2. OR (EXISTS (SELECT 1 FROM public.user_access WHERE user_access.user_id = owner_user_id AND user_access.can_upload = true))

