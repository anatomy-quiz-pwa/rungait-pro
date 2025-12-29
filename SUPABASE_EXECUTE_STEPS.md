# 在 Supabase 中執行 SQL 修復步驟

## 重要提醒

我無法直接連接到您的 Supabase 資料庫，請按照以下步驟手動執行。

## 執行步驟

### 步驟 1：進入 Supabase Dashboard

1. 前往 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登入您的帳號
3. 選擇您的專案

### 步驟 2：進入 SQL Editor

1. 在左側選單中，點擊 **SQL Editor**
2. 點擊 **New query** 建立新查詢

### 步驟 3：複製並執行 SQL

複製以下完整的 SQL（從下面的「完整 SQL 內容」區塊），貼上到 SQL Editor，然後點擊 **Run**。

---

## 完整 SQL 內容

```sql
-- ============================================
-- 修復 RLS Policy 以支援模擬認證
-- ============================================

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

-- 步驟 3：驗證 Policy 已更新
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'curved_treadmill_locations'
AND policyname = 'curved_treadmill_locations_insert_authenticated_with_upload_permission';

-- 步驟 4：檢查 user_access 表
SELECT 
  user_id, 
  can_upload,
  CASE 
    WHEN can_upload = true THEN '✅ 可以使用'
    ELSE '❌ 沒有上傳權限'
  END AS status
FROM public.user_access
ORDER BY can_upload DESC, user_id;
```

---

## 執行後檢查

### 1. 確認 Policy 已更新

執行後應該會看到：
- ✅ Policy 已刪除並重新建立
- ✅ `with_check` 條件包含兩個 OR 條件（支援模擬認證）

### 2. 確認 user_access 表有記錄

查詢結果應該顯示：
- ✅ 至少有一個 `can_upload = true` 的記錄
- ✅ 如果沒有，需要先建立記錄（見下方）

## 如果 user_access 表沒有記錄

如果步驟 4 的查詢結果為空，或沒有 `can_upload = true` 的記錄，請執行以下 SQL：

```sql
-- 方法 1：查詢現有的 auth.users，使用第一個用戶
-- 先查詢：
SELECT id, email FROM auth.users LIMIT 1;

-- 然後使用查詢到的 id 建立 user_access 記錄：
-- （將 'your-user-uuid-here' 替換為實際的 UUID）
INSERT INTO public.user_access (user_id, can_upload)
VALUES ('your-user-uuid-here'::uuid, true)
ON CONFLICT (user_id) DO UPDATE SET can_upload = true;

-- 方法 2：如果 user_access 表允許，可以直接建立（需要確認表結構）
-- 先查看 user_access 表結構：
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'user_access';
```

## 測試步驟

執行 SQL 後：

1. **等待幾秒**讓變更生效
2. **重新整理應用程式**（清除快取）
3. **嘗試送出表單**
4. **檢查 Console**，確認沒有 RLS 錯誤
5. **檢查 Supabase Table Editor**，確認資料已插入

## 如果仍有問題

如果執行後仍有錯誤，請提供：
1. SQL 執行結果（是否有錯誤訊息）
2. user_access 表的查詢結果
3. 應用程式 Console 的錯誤訊息

---

**請按照上述步驟執行 SQL，然後測試應用程式功能！**

