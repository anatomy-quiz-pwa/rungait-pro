-- ============================================
-- 修復 RLS Policy 以支援模擬認證
-- ============================================
-- 此 SQL 修改 INSERT policy 以允許模擬認證系統

-- 方案 1：修改現有的 INSERT policy（推薦）
-- 允許 owner_user_id 存在於 user_access 表中，且 can_upload = true
-- 不強制要求 auth.uid() 必須等於 owner_user_id（因為模擬認證時 auth.uid() 可能為 NULL）

DROP POLICY IF EXISTS "curved_treadmill_locations_insert_authenticated_with_upload_permission" ON public.curved_treadmill_locations;

CREATE POLICY "curved_treadmill_locations_insert_authenticated_with_upload_permission"
  ON public.curved_treadmill_locations
  FOR INSERT
  WITH CHECK (
    -- 允許兩種情況：
    -- 1. 標準 Supabase Auth：auth.uid() IS NOT NULL 且 owner_user_id = auth.uid() 且有 can_upload 權限
    -- 2. 模擬認證：owner_user_id 存在於 user_access 表中且 can_upload = true（不檢查 auth.uid()）
    (
      auth.uid() IS NOT NULL
      AND owner_user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.user_access
        WHERE user_access.user_id = auth.uid()
        AND user_access.can_upload = true
      )
    )
    OR
    (
      -- 模擬認證：只要 owner_user_id 在 user_access 表中且 can_upload = true
      EXISTS (
        SELECT 1 FROM public.user_access
        WHERE user_access.user_id = owner_user_id
        AND user_access.can_upload = true
      )
    )
  );

-- ============================================
-- 驗證 Policy
-- ============================================
-- 執行以下查詢來確認 policy 已更新：

SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'curved_treadmill_locations'
AND policyname = 'curved_treadmill_locations_insert_authenticated_with_upload_permission';

-- ============================================
-- 重要提醒
-- ============================================
-- 1. 確保 user_access 表中有對應的記錄
-- 2. 確保 can_upload = true
-- 3. 如果使用模擬認證，需要先在 user_access 表中建立對應的記錄

-- 例如，如果模擬認證使用的 user_id 是從 user_access 表查詢的，
-- 那麼該 user_id 應該已經在 user_access 表中，且 can_upload = true

