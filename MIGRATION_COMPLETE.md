# Migration 執行完成

## ✅ 已執行

您已經成功執行了：
```sql
ALTER TABLE public.curved_treadmill_locations 
ADD COLUMN IF NOT EXISTS contact_info TEXT;
```

## 下一步：驗證

### 1. 驗證欄位已新增

在 Supabase SQL Editor 中執行：

```sql
-- 確認 contact_info 欄位存在
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'curved_treadmill_locations'
AND column_name = 'contact_info';
```

**預期結果：** 應該看到一行，顯示 `contact_info` (text, nullable)

### 2. 檢查完整表結構

```sql
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'curved_treadmill_locations'
ORDER BY ordinal_position;
```

**預期欄位：**
- ✅ `id` (uuid)
- ✅ `owner_user_id` (uuid)
- ✅ `name` (text)
- ✅ `lat` (numeric)
- ✅ `lng` (numeric)
- ✅ `address` (text, nullable)
- ✅ `city` (text, nullable)
- ✅ `description` (text, nullable)
- ✅ **`contact_info` (text, nullable)** ← 剛新增的
- ✅ `created_at` (timestamptz)
- ✅ `updated_at` (timestamptz)

## 測試應用程式

### 步驟 1：清除快取
- 重新整理瀏覽器（或使用無痕模式）
- 清除瀏覽器快取（可選）

### 步驟 2：測試送出功能
1. 進入 `/map/submit` 頁面
2. 填寫表單：
   - 場地名稱：必填
   - 地址：可選
   - 聯絡資訊：可選（這會寫入 `contact_info` 欄位）
   - 備註：可選
3. 在地圖上選擇位置
4. 點擊「送出註冊」

### 步驟 3：檢查結果
1. **檢查 Console**（F12）
   - 應該沒有欄位錯誤
   - 應該看到成功訊息

2. **檢查 Supabase Table Editor**
   - 進入 Supabase Dashboard → Table Editor
   - 選擇 `curved_treadmill_locations` 表
   - 確認新資料已插入
   - 確認 `contact_info` 欄位有值（如果填寫了）

## 如果仍有問題

### 問題 1：仍然出現欄位錯誤
**可能原因：** Schema cache 需要刷新

**解決方法：**
1. 等待幾分鐘讓 Supabase 刷新 schema cache
2. 或重新部署應用程式

### 問題 2：插入失敗（權限錯誤）
**可能原因：** RLS policy 或 `can_upload` 權限問題

**解決方法：**
1. 確認使用者已登入
2. 確認使用者的 `can_upload` 權限已啟用
3. 檢查 RLS policies 是否正確設定

### 問題 3：其他欄位錯誤
**可能原因：** 表結構不完整

**解決方法：**
執行完整的 migration 檔案（`supabase_migration_curved_treadmill_locations.sql`）

## 完整 Migration 檢查清單

如果只執行了 `ADD COLUMN`，建議檢查以下項目是否完整：

- [ ] 表已建立
- [ ] `contact_info` 欄位已新增 ✅
- [ ] 索引已建立（owner_user_id, location, created_at）
- [ ] RLS 已啟用
- [ ] RLS Policies 已建立（SELECT, INSERT, UPDATE, DELETE）
- [ ] Trigger 已建立（updated_at 自動更新）
- [ ] View 已建立（curved_treadmill_locations_view）

如果需要，可以執行完整的 migration 檔案來確保所有項目都正確設定。

---

**現在請測試應用程式的送出功能，應該可以正常運作了！** 🎉

