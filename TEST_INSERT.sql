-- ============================================
-- 測試插入資料到 curved_treadmill_locations
-- ============================================
-- 使用 user_access 表中 can_upload = true 的用戶來測試

-- 步驟 1：取得一個有上傳權限的 user_id
SELECT 
  user_id,
  can_upload,
  display_name
FROM public.user_access
WHERE can_upload = true
LIMIT 1;

-- 步驟 2：使用查詢到的 user_id 測試插入
-- 將 'your-user-id-here' 替換為步驟 1 查詢到的 user_id
-- 例如：'06a4851c-0fa2-42ba-a707-ad389d8573aa'

INSERT INTO public.curved_treadmill_locations (
  owner_user_id,
  name,
  lat,
  lng,
  address,
  city,
  description
) VALUES (
  '06a4851c-0fa2-42ba-a707-ad389d8573aa'::uuid,  -- 替換為實際的 user_id
  '測試地點',
  25.0330,
  121.5654,
  '台北市信義區信義路五段7號',
  '台北市',
  '這是一個測試地點'
)
RETURNING *;

-- 步驟 3：驗證資料已插入
SELECT 
  loc.id,
  loc.name,
  loc.owner_user_id,
  ua.display_name,
  ua.can_upload,
  loc.created_at
FROM public.curved_treadmill_locations loc
LEFT JOIN public.user_access ua ON ua.user_id = loc.owner_user_id
ORDER BY loc.created_at DESC;

-- ============================================
-- 如果插入失敗，檢查錯誤訊息
-- ============================================
-- 常見錯誤：
-- 1. "new row violates row-level security policy" - RLS policy 問題
-- 2. "invalid input syntax for type uuid" - UUID 格式問題
-- 3. "foreign key constraint" - 外鍵約束問題

