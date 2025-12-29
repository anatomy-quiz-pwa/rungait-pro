-- ============================================
-- 簡單查看 RLS Policy（不使用 pg_get_expr）
-- ============================================

-- 方法 1：直接查看 policy 資訊
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'curved_treadmill_locations'
AND policyname = 'curved_treadmill_locations_insert_authenticated_with_upload_permission';

-- 方法 2：查看所有 policies
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has qual condition'
    ELSE 'No qual condition'
  END AS qual_status,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has with_check condition'
    ELSE 'No with_check condition'
  END AS with_check_status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'curved_treadmill_locations';

