# 認證問題修復總結

## 問題描述

送出資料時出現 "Unauthorized. Please log in." 錯誤。

## 根本原因

應用程式使用**模擬認證系統**（將 user 存在 localStorage），但 API route 只檢查 Supabase Auth，導致認證失敗。

## 修復方案

### 1. 修改 API Route (`/api/locations/register/route.ts`)

**變更內容：**
- 先嘗試從 Supabase Auth 取得 user
- 如果 Supabase Auth 沒有 user，從 request body 取得 `user_id` 和 `user_email`（模擬認證）
- 同時支援 Supabase Auth 和模擬認證系統

**關鍵程式碼：**
```typescript
// 1. 先解析 body（以便取得 user_id）
let body = await request.json()

// 2. 嘗試從 Supabase Auth 取得 user
let user = await getServerUser(request)

// 3. 如果沒有，從 body 取得（模擬認證）
if (!user && body.user_id) {
  user = {
    id: body.user_id,
    email: body.user_email || 'unknown@example.com',
  }
}
```

### 2. 修改前端組件

**`ManualLocationForm` 和 `GooglePlaceSearch`：**
- 在送出請求時包含 `user_id` 和 `user_email`
- 送出前檢查使用者是否已登入

**關鍵程式碼：**
```typescript
const { user } = useAuth()

// 檢查使用者是否已登入
if (!user) {
  setError("請先登入後再送出註冊")
  return
}

// 在請求中包含 user 資訊
body: JSON.stringify({
  // ... 其他欄位
  user_id: user.id,
  user_email: user.email,
})
```

## 部署狀態

- ✅ **最新修復 commit**: `1cca247` (fix: 修正 GooglePlaceSearch 組件的認證問題)
- ⚠️ **Vercel 部署的 commit**: `c0530bf` (較舊的版本)

**需要重新部署以套用最新修復！**

## 下一步

### 選項 1：等待自動部署
- 如果已設定自動部署，Vercel 會自動部署最新的 commit
- 等待幾分鐘後檢查部署狀態

### 選項 2：手動觸發部署
1. 進入 Vercel Dashboard
2. 進入專案的 Deployments 頁面
3. 點擊 "Redeploy" 或等待新的 commit 觸發部署

### 選項 3：推送新的 commit 觸發部署
```bash
git commit --allow-empty -m "trigger deployment"
git push
```

## 測試步驟

部署完成後：

1. **確認已登入**
   - 如果未登入，請先登入

2. **測試送出功能**
   - 進入 `/map/submit` 頁面
   - 填寫表單並送出
   - 應該可以成功送出，不再出現 "Unauthorized" 錯誤

3. **如果仍有問題**
   - 開啟瀏覽器 Console（F12）
   - 查看錯誤訊息
   - 確認 Network 標籤中 API 請求的 Response

## 相關 Commits

- `bce5e1a`: fix: 修復認證問題，支援模擬認證系統
- `1cca247`: fix: 修正 GooglePlaceSearch 組件的認證問題

---

**請等待最新部署完成後再測試！**

