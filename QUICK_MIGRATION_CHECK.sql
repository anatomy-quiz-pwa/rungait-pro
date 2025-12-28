-- ============================================
-- 快速檢查 Migration 狀態
-- ============================================
-- 在 Supabase SQL Editor 中執行此查詢來檢查 migration 狀態

-- 1. 檢查表是否存在
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'curved_treadmill_locations'
    ) THEN '✅ Table exists'
    ELSE '❌ Table does NOT exist'
  END AS table_status;

-- 2. 檢查所有欄位（特別是 contact_info）
SELECT 
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name = 'contact_info' THEN '✅ This is the field we need!'
    ELSE ''
  END AS note
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'curved_treadmill_locations'
ORDER BY ordinal_position;

-- 3. 檢查 contact_info 欄位是否存在
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'curved_treadmill_locations'
      AND column_name = 'contact_info'
    ) THEN '✅ contact_info column EXISTS'
    ELSE '❌ contact_info column does NOT exist - You need to run the migration!'
  END AS contact_info_status;

-- 4. 檢查索引
SELECT 
  indexname,
  CASE 
    WHEN indexname LIKE '%owner_user_id%' THEN '✅ Owner index'
    WHEN indexname LIKE '%location%' THEN '✅ Location index'
    WHEN indexname LIKE '%created_at%' THEN '✅ Created at index'
    ELSE 'Other index'
  END AS index_type
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'curved_treadmill_locations';

-- 5. 檢查 RLS 是否啟用
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'curved_treadmill_locations'
      AND rowsecurity = true
    ) THEN '✅ RLS is ENABLED'
    ELSE '❌ RLS is NOT enabled'
  END AS rls_status;

-- 6. 檢查 RLS Policies
SELECT 
  policyname,
  cmd AS command_type,
  CASE 
    WHEN policyname LIKE '%select%' THEN '✅ SELECT policy'
    WHEN policyname LIKE '%insert%' THEN '✅ INSERT policy'
    WHEN policyname LIKE '%update%' THEN '✅ UPDATE policy'
    WHEN policyname LIKE '%delete%' THEN '✅ DELETE policy'
    ELSE 'Other policy'
  END AS policy_type
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'curved_treadmill_locations';

-- 7. 檢查 View
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'curved_treadmill_locations_view'
    ) THEN '✅ View exists'
    ELSE '❌ View does NOT exist'
  END AS view_status;

-- ============================================
-- 如果 contact_info 欄位不存在，執行以下 SQL 來新增它：
-- ============================================
-- ALTER TABLE public.curved_treadmill_locations 
-- ADD COLUMN IF NOT EXISTS contact_info TEXT;

