# Register my place 功能實作報告

## 📋 功能概述

完成「Register my place」功能，使用者可以透過兩種方式註冊場地：
1. **搜尋 Google 商家**：使用 Google Places Autocomplete 一鍵帶入商家資訊
2. **手動新增**：在地圖上點選或拖曳 marker 來設定位置

## 🗂️ 新增/修改的檔案

### 新增檔案（5 個）
```
app/map/submit/page.tsx                    # Server Component wrapper
app/map/submit/page-client.tsx              # Client Component（含 Tabs）
components/map/google-place-search.tsx     # Google Places Autocomplete 組件
components/map/manual-location-form.tsx    # 手動選點表單組件
app/api/locations/register/route.ts        # 註冊 API route
```

### 修改檔案（2 個）
```
components/RunGaitMap.tsx                  # 更新 InfoWindow 顯示 address 和 source
components/map/location-form.tsx            # 已存在的檔案（保留作為備用）
```

## 📊 資料庫欄位對應

### Supabase 表：`curved_treadmill_locations`

根據 migration 檔案，實際使用的欄位：

| 前端欄位 | 資料庫欄位 | 類型 | 必填 | 說明 |
|---------|-----------|------|------|------|
| `name` | `name` | TEXT | ✅ | 場地名稱 |
| `lat` | `lat` | DECIMAL(10,8) | ✅ | 緯度 |
| `lng` | `lng` | DECIMAL(11,8) | ✅ | 經度 |
| `address` | `address` | TEXT | ❌ | 地址 |
| `city` | `city` | TEXT | ❌ | 城市 |
| `description` | `description` | TEXT | ❌ | 備註/描述 |
| `contact_info` | `contact_info` | TEXT | ❌ | 聯絡資訊 |
| `source` | `source` | TEXT | ❌ | 來源（'google' 或 'manual'）* |
| `google_place_id` | `google_place_id` | TEXT | ❌ | Google Place ID * |
| `owner_user_id` | `owner_user_id` | UUID | ✅ | 自動填入（auth.uid()） |

*註：`source` 和 `google_place_id` 欄位如果表內不存在，API 會自動忽略這些欄位

## 🔧 功能實作細節

### 1. 路由與頁面結構

#### `/map/submit` 頁面
- **Server Component wrapper** (`page.tsx`)：
  - `export const dynamic = 'force-dynamic'`
  - `export const revalidate = 0`
  - 返回 `<SubmitPageClient />`

- **Client Component** (`page-client.tsx`)：
  - 使用 `Tabs` 組件提供兩個選項
  - Tab A: "搜尋 Google 商家"
  - Tab B: "手動新增（地圖選點）"

### 2. Google Places Autocomplete（Tab A）

**組件**：`components/map/google-place-search.tsx`

**功能**：
- 使用 `@react-google-maps/api` 的 `Autocomplete` 組件
- 搜尋類型：`establishment` 和 `point_of_interest`
- 取得資料：
  - `place_id`
  - `name`
  - `formatted_address`
  - `geometry.location.lat/lng`
  - `website`
  - `formatted_phone_number`
- 顯示預覽卡片
- 送出時呼叫 `/api/locations/register`

### 3. 手動選點功能（Tab B）

**組件**：`components/map/manual-location-form.tsx`

**功能**：
- 顯示 Google Map + draggable marker
- 預設中心點：
  - 如果使用者允許 geolocation，使用使用者位置
  - 否則使用預設位置（台北 101：25.0330, 121.5654）
- 使用者可以：
  - 點擊地圖 → marker 移到該點
  - 拖曳 marker → 更新位置
- 表單欄位：
  - `name` (required)
  - `address` (optional)
  - `contact_info` (optional)
  - `description` (optional)
- 送出時帶上 `lat/lng/source='manual'` 呼叫 API

### 4. API Route

**路徑**：`app/api/locations/register/route.ts`

**功能**：
- 僅接受 POST JSON
- 驗證：
  - `name` 必填
  - `lat/lng` 必填且合理範圍
  - `source` 必為 'google' 或 'manual'
- 去重（如果表有 `google_place_id` 欄位）：
  - 若 `source='google'` 且 `google_place_id` 存在：
    - 先查 locations 是否已有同 `place_id`
    - 有：回傳 409 + 提示已註冊
    - 沒有：插入
- 插入成功回傳 `{ ok: true, id }`
- 錯誤回傳清楚的 error message
- 使用 `lib/supabase-server.ts` 的 `supabaseServer()`

### 5. 前端狀態與 UX

- ✅ 送出中 disable 按鈕 + 顯示 loading
- ✅ 成功後顯示 success toast，並導回 `/map`
- ✅ 失敗顯示錯誤（包含 409 已存在）
- ✅ 未選擇位置時禁用提交按鈕

### 6. 地圖顯示更新

**檔案**：`components/RunGaitMap.tsx`

**更新**：
- InfoWindow 現在顯示：
  - 名稱
  - 地址（如果有）
  - 來源（Google 商家 / 手動新增）
  - 描述（如果有）
  - 聯絡資訊（如果有）

## ✅ 驗證結果

### Build 狀態
- ✅ `pnpm build` 成功完成
- ✅ 無 TypeScript 錯誤
- ✅ 無 lint 錯誤
- ✅ 所有路由正確標記為動態渲染

### 路由狀態
```
Route (app)
├ ƒ /map/submit          ← 新增：註冊頁面
└ ƒ /api/locations/register  ← 新增：註冊 API
```

## 🔍 測試建議

### 1. Google Places 搜尋流程
1. 進入 `/map/submit`
2. 選擇「搜尋 Google 商家」tab
3. 輸入商家名稱（例如：「台北 101」）
4. 從下拉選單選擇商家
5. 確認預覽卡片顯示正確資訊
6. 點擊「送出註冊」
7. 確認成功訊息
8. 檢查 Supabase 資料庫是否有新資料
9. 回到 `/map` 確認新點顯示在地圖上

### 2. 手動選點流程
1. 進入 `/map/submit`
2. 選擇「手動新增（地圖選點）」tab
3. 在地圖上點選位置（或拖曳 marker）
4. 確認已選擇位置顯示
5. 填寫表單（至少填寫名稱）
6. 點擊「送出註冊」
7. 確認成功訊息
8. 檢查 Supabase 資料庫是否有新資料
9. 回到 `/map` 確認新點顯示在地圖上

### 3. 錯誤處理測試
- 未登入時嘗試註冊 → 應顯示 401 錯誤
- 未選擇位置時提交 → 應顯示提示
- 未填寫名稱時提交 → 應顯示驗證錯誤
- 重複註冊相同 Google Place → 應顯示 409 錯誤

## 📝 注意事項

### 資料庫欄位相容性
- API route 會自動處理欄位不存在的情況
- 如果表沒有 `source` 或 `google_place_id` 欄位，這些值會被忽略
- 如果表有這些欄位，會正常寫入

### Google Places API
- 需要啟用 "Places API" 或 "Places API (New)"
- 使用與 Google Maps 相同的 API Key
- 前端使用 `@react-google-maps/api` 的 `Autocomplete` 組件

### RLS Policy
- 插入資料需要：
  - 使用者已登入
  - `user_access.can_upload = true`
- 如果不符合條件，會回傳 403 錯誤

## 🎯 完成狀態

- [x] 確認 Supabase locations 表欄位結構
- [x] 建立 /map/submit 頁面（Server wrapper + Client component）
- [x] 實作 Google Places Autocomplete（Tab A）
- [x] 實作手動選點功能（Tab B）
- [x] 建立 API route /api/locations/register
- [x] 更新 /map 頁面顯示新註冊的點
- [x] 測試完整流程並提交

---

**提交資訊**：
- Commit: 已提交
- Status: ✅ 完成
- Build: ✅ 成功

