-- ============================================
-- 修復 RLS Policy 以支援模擬認證
-- ============================================
-- 在 Supabase SQL Editor 中執行此 SQL

-- 步驟 1：刪除舊的 INSERT policy
DROP POLICY IF EXISTS "curved_treadmill_locations_insert_authenticated_with_upload_permission" ON public.curved_treadmill_locations;

-- 步驟 2：建立新的 INSERT policy（支援模擬認證）
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
-- 驗證 Policy 已更新
-- ============================================
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'curved_treadmill_locations'
AND policyname = 'curved_treadmill_locations_insert_authenticated_with_upload_permission';

-- ============================================
-- 檢查 user_access 表
-- ============================================
-- 確認有 can_upload = true 的記錄
SELECT 
  user_id, 
  can_upload,
  CASE 
    WHEN can_upload = true THEN '✅ 可以使用'
    ELSE '❌ 沒有上傳權限'
  END AS status
FROM public.user_access
ORDER BY can_upload DESC, user_id;

-- ============================================
-- 如果沒有 user_access 記錄，建立一個測試記錄
-- ============================================
-- 注意：user_id 必須是有效的 UUID（存在於 auth.users 表中）
-- 
-- 方法 1：使用現有的 auth.users 中的 user_id
-- 先查詢 auth.users 表取得一個 user_id：
-- SELECT id FROM auth.users LIMIT 1;
--
-- 然後使用該 user_id 建立 user_access 記錄：
-- INSERT INTO public.user_access (user_id, can_upload)
-- VALUES ('your-user-uuid-here'::uuid, true)
-- ON CONFLICT (user_id) DO UPDATE SET can_upload = true;
--
-- 方法 2：如果 user_access 表允許 NULL 或沒有外鍵約束
-- 可以直接建立記錄（但需要確認表結構）

-- ============================================
-- 完成
-- ============================================
-- 執行後：
-- 1. 確認 policy 已更新（應該看到新的 with_check 條件）
-- 2. 確認 user_access 表有 can_upload = true 的記錄
-- 3. 測試應用程式的送出功能

