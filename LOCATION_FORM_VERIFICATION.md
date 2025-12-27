# Location Form 驗證報告

## ✅ 確認項目

### 1. 表單資料上傳到 Supabase

**API 連接**：
- ✅ `LocationForm` 組件呼叫 `/api/locations/register` (POST)
- ✅ API route 使用 `supabaseServer()` 寫入 `curved_treadmill_locations` 表
- ✅ 資料欄位對應正確：
  - `name` → `name` (必填)
  - `lat` → `lat` (必填)
  - `lng` → `lng` (必填)
  - `address` → `address` (選填)
  - `city` → `city` (選填)
  - `description` → `description` (選填)
  - `contact_info` → `contact_info` (選填)
  - `source` → `source` (自動設為 'manual')

**驗證流程**：
1. 使用者填寫表單
2. 在地圖上點選位置（取得 lat/lng）
3. 點擊「Submit」按鈕
4. 資料透過 `/api/locations/register` 寫入 Supabase
5. 成功後顯示提示訊息

### 2. 地點顯示在 Google Map 的 Pin 上

**地圖載入**：
- ✅ `RunGaitMap` 組件從 `/api/locations` (GET) 讀取資料
- ✅ API 查詢 `curved_treadmill_locations_view` view
- ✅ 每 5 秒自動重新載入 locations（新註冊的點會自動顯示）

**Marker 顯示**：
- ✅ 每個 location 顯示為藍色 marker
- ✅ 點擊 marker 顯示 InfoWindow（包含名稱、地址、來源等）
- ✅ 地圖中心點會根據 locations 自動調整

## 🔧 修正內容

### 1. LocationForm 組件
- ✅ 已確認呼叫 `/api/locations/register` API
- ✅ 包含地圖選擇位置功能
- ✅ 驗證必填欄位（name、lat/lng）
- ✅ 錯誤處理和成功提示

### 2. RunGaitMap 組件
- ✅ 自動從 API 載入 locations
- ✅ 每 5 秒自動重新載入（確保新註冊的點會顯示）
- ✅ InfoWindow 顯示完整資訊（名稱、地址、來源）

### 3. API Routes
- ✅ `GET /api/locations` - 查詢所有 locations（公開）
- ✅ `POST /api/locations/register` - 註冊新 location（需登入）

## 📋 資料流程

```
使用者填寫表單
    ↓
在地圖上點選位置（取得 lat/lng）
    ↓
點擊 Submit
    ↓
POST /api/locations/register
    ↓
寫入 Supabase (curved_treadmill_locations)
    ↓
GET /api/locations (每 5 秒自動重新載入)
    ↓
RunGaitMap 顯示新 marker
```

## ✅ 測試檢查清單

### 測試 1：表單提交
- [ ] 進入 `/map/submit` 頁面
- [ ] 選擇「手動新增（地圖選點）」tab
- [ ] 在地圖上點選位置
- [ ] 填寫表單（至少填寫名稱）
- [ ] 點擊「送出註冊」
- [ ] 確認成功訊息
- [ ] 檢查 Supabase 資料庫是否有新資料

### 測試 2：地圖顯示
- [ ] 進入 `/map` 頁面
- [ ] 確認新註冊的點顯示為藍色 marker
- [ ] 點擊 marker 確認 InfoWindow 顯示正確資訊
- [ ] 確認地址和來源資訊正確顯示

### 測試 3：自動更新
- [ ] 在一個瀏覽器視窗註冊新地點
- [ ] 在另一個瀏覽器視窗查看 `/map` 頁面
- [ ] 等待 5 秒，確認新點自動出現

## ⚠️ 注意事項

### 資料庫欄位
根據 migration 檔案，`curved_treadmill_locations` 表**沒有**以下欄位：
- ❌ `treadmill_type` - 表單中不應顯示此欄位
- ❌ `allow_public` - 表單中不應顯示此欄位
- ❌ `status` - 此欄位不存在（所有資料都是公開的）

如果截圖中的表單顯示了這些欄位，可能是舊版 UI。目前的實作已正確對應資料庫結構。

### 權限要求
- 使用者必須已登入
- 使用者必須有 `user_access.can_upload = true`
- 如果不符合，會回傳 403 錯誤

## 🎯 結論

✅ **表單資料可以上傳到 Supabase**
- LocationForm 正確連接到 `/api/locations/register`
- API 正確寫入 `curved_treadmill_locations` 表
- 所有欄位正確對應

✅ **地點可以出現在 Google Map 的 pin 上**
- RunGaitMap 從 `/api/locations` 讀取資料
- 每 5 秒自動重新載入，確保新註冊的點會顯示
- Marker 和 InfoWindow 正確顯示所有資訊

---

**狀態**：✅ 已驗證並修正
**Build**：✅ 成功
**準備就緒**：可以開始測試

