-- ============================================
-- Curved Treadmill Locations Migration
-- ============================================
-- 此 SQL 可直接在 Supabase SQL Editor 執行
-- 建立 curved_treadmill_locations 表、索引、RLS policies 和 view

-- 1. 建立主表
CREATE TABLE IF NOT EXISTS public.curved_treadmill_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  address TEXT,
  city TEXT,
  description TEXT,
  contact_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 建立索引
CREATE INDEX IF NOT EXISTS idx_curved_treadmill_locations_owner_user_id 
  ON public.curved_treadmill_locations(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_curved_treadmill_locations_location 
  ON public.curved_treadmill_locations(lat, lng);

CREATE INDEX IF NOT EXISTS idx_curved_treadmill_locations_created_at 
  ON public.curved_treadmill_locations(created_at DESC);

-- 3. 建立 updated_at 自動更新 trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_curved_treadmill_locations_updated_at
  BEFORE UPDATE ON public.curved_treadmill_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. 啟用 RLS
ALTER TABLE public.curved_treadmill_locations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- SELECT: 所有人都可以讀取
CREATE POLICY "curved_treadmill_locations_select_public"
  ON public.curved_treadmill_locations
  FOR SELECT
  USING (true);

-- INSERT: 需登入且 user_access.can_upload=true 且 owner_user_id=auth.uid()
CREATE POLICY "curved_treadmill_locations_insert_authenticated_with_upload_permission"
  ON public.curved_treadmill_locations
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND owner_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_access
      WHERE user_access.user_id = auth.uid()
      AND user_access.can_upload = true
    )
  );

-- UPDATE: 只允許 owner 更新
CREATE POLICY "curved_treadmill_locations_update_owner_only"
  ON public.curved_treadmill_locations
  FOR UPDATE
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- DELETE: 只允許 owner 刪除
CREATE POLICY "curved_treadmill_locations_delete_owner_only"
  ON public.curved_treadmill_locations
  FOR DELETE
  USING (owner_user_id = auth.uid());

-- 6. 建立 View: curved_treadmill_locations_view
-- 包含 is_registered_user, can_upload, has_analysis 欄位
CREATE OR REPLACE VIEW public.curved_treadmill_locations_view AS
SELECT 
  loc.id,
  loc.owner_user_id,
  loc.name,
  loc.lat,
  loc.lng,
  loc.address,
  loc.city,
  loc.description,
  loc.contact_info,
  loc.created_at,
  loc.updated_at,
  -- is_registered_user: 檢查是否存在於 user_access
  EXISTS (
    SELECT 1 FROM public.user_access ua
    WHERE ua.user_id = loc.owner_user_id
  ) AS is_registered_user,
  -- can_upload: 從 user_access 取得
  COALESCE(
    (SELECT ua.can_upload FROM public.user_access ua WHERE ua.user_id = loc.owner_user_id),
    false
  ) AS can_upload,
  -- has_analysis: 檢查是否存在於 jobs
  EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.user_id = loc.owner_user_id
  ) AS has_analysis
FROM public.curved_treadmill_locations loc;

-- 7. 為 View 啟用 RLS（View 繼承底層表的 RLS）
-- 由於 View 是 SELECT only，會自動繼承 SELECT policy

-- 8. 授予權限（如果需要）
GRANT SELECT ON public.curved_treadmill_locations_view TO anon, authenticated;

-- ============================================
-- 完成
-- ============================================
-- 執行後請檢查：
-- 1. 表是否建立成功
-- 2. 索引是否建立成功
-- 3. RLS policies 是否生效
-- 4. View 是否可正常查詢

