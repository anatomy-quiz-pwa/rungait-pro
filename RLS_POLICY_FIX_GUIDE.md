# RLS Policy 修復指南

## 問題描述

錯誤訊息：`new row violates row-level security policy for table "curved_treadmill_locations"`

這表示插入資料時違反了 RLS (Row Level Security) 政策。

## 根本原因

目前的 RLS INSERT policy 要求：
1. `auth.uid() IS NOT NULL` - 必須有 Supabase Auth 的用戶
2. `owner_user_id = auth.uid()` - owner_user_id 必須等於當前登入用戶
3. `user_access.can_upload = true` - 用戶必須有上傳權限

**問題：** 使用模擬認證時，`auth.uid()` 為 `NULL`，所以無法通過 RLS policy。

## 解決方案

### 方案 1：修改 RLS Policy（推薦）

執行 `FIX_RLS_POLICY.sql` 檔案中的 SQL 來修改 policy，允許模擬認證：

```sql
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
```

### 方案 2：確保 user_access 表有記錄

在 Supabase SQL Editor 中執行：

```sql
-- 檢查 user_access 表
SELECT * FROM public.user_access;

-- 如果沒有記錄，建立一個測試記錄
-- 注意：user_id 必須是有效的 UUID（存在於 auth.users 表中）
INSERT INTO public.user_access (user_id, can_upload)
VALUES ('your-user-uuid-here'::uuid, true)
ON CONFLICT (user_id) DO UPDATE SET can_upload = true;
```

### 方案 3：使用 Supabase Auth（長期方案）

整合真正的 Supabase Auth，而不是使用模擬認證系統。

## 執行步驟

### 步驟 1：檢查 user_access 表

```sql
-- 查看所有 user_access 記錄
SELECT user_id, can_upload 
FROM public.user_access;
```

### 步驟 2：確認有 can_upload = true 的記錄

```sql
-- 查看有上傳權限的用戶
SELECT user_id, can_upload 
FROM public.user_access 
WHERE can_upload = true;
```

### 步驟 3：執行修復 SQL

複製 `FIX_RLS_POLICY.sql` 檔案中的 SQL，在 Supabase SQL Editor 中執行。

### 步驟 4：驗證 Policy

```sql
-- 檢查 policy 是否已更新
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'curved_treadmill_locations'
AND policyname = 'curved_treadmill_locations_insert_authenticated_with_upload_permission';
```

## 測試步驟

1. **重新整理應用程式**
2. **嘗試送出表單**
3. **檢查 Console**，確認沒有 RLS 錯誤
4. **檢查 Supabase Table Editor**，確認資料已插入

## 常見問題

### Q: 為什麼需要修改 RLS Policy？

**A:** 因為模擬認證系統不使用 Supabase Auth，所以 `auth.uid()` 為 `NULL`，無法通過原本的 RLS policy。

### Q: 修改 RLS Policy 安全嗎？

**A:** 修改後的 policy 仍然要求：
- `owner_user_id` 必須在 `user_access` 表中
- `can_upload` 必須為 `true`

所以仍然有安全保護，只是不強制要求 `auth.uid()`。

### Q: 如果沒有 user_access 記錄怎麼辦？

**A:** 需要先建立記錄：
1. 取得一個有效的 user UUID（從 auth.users 表或建立新用戶）
2. 在 user_access 表中建立記錄，設定 `can_upload = true`

---

**執行修復 SQL 後，請測試送出功能！**

