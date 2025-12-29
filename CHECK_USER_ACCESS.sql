-- ============================================
-- 檢查 user_access 表和相關表的 user_id 關聯
-- ============================================

-- 1. 查看 user_access 表中所有有上傳權限的用戶
SELECT 
  user_id,
  can_upload,
  display_name,
  plan,
  created_at
FROM public.user_access
WHERE can_upload = true
ORDER BY created_at DESC;

-- 2. 查看 curved_treadmill_locations 表中的所有記錄
SELECT 
  id,
  owner_user_id,
  name,
  address,
  created_at
FROM public.curved_treadmill_locations
ORDER BY created_at DESC;

-- 3. 查看 jobs 表中的所有記錄（影片上傳）
SELECT 
  id,
  user_id,
  status,
  created_at
FROM public.jobs
ORDER BY created_at DESC
LIMIT 10;

-- 4. 關聯查詢：查看哪些用戶有上傳權限，以及他們的相關資料
SELECT 
  ua.user_id,
  ua.can_upload,
  ua.display_name,
  ua.plan,
  COUNT(DISTINCT loc.id) AS location_count,
  COUNT(DISTINCT j.id) AS job_count,
  MAX(loc.created_at) AS last_location_created,
  MAX(j.created_at) AS last_job_created
FROM public.user_access ua
LEFT JOIN public.curved_treadmill_locations loc ON loc.owner_user_id = ua.user_id
LEFT JOIN public.jobs j ON j.user_id = ua.user_id
WHERE ua.can_upload = true
GROUP BY ua.user_id, ua.can_upload, ua.display_name, ua.plan
ORDER BY ua.created_at DESC;

-- 5. 檢查是否有孤立的記錄（curved_treadmill_locations 中的 owner_user_id 不在 user_access 中）
SELECT 
  loc.id,
  loc.owner_user_id,
  loc.name,
  loc.created_at,
  CASE 
    WHEN ua.user_id IS NULL THEN '❌ 不在 user_access 表中'
    WHEN ua.can_upload = false THEN '❌ 沒有上傳權限'
    ELSE '✅ 正常'
  END AS status
FROM public.curved_treadmill_locations loc
LEFT JOIN public.user_access ua ON ua.user_id = loc.owner_user_id
ORDER BY loc.created_at DESC;

