# 查看 Vercel Server-Side 日誌指南

## 部署狀態

✅ 構建成功（Commit: `a6d8e54`）
✅ 所有路由已正確生成
✅ `/api/locations/register` 已部署為動態路由（ƒ）

## 如何查看 Server-Side 日誌

### 方法 1：Vercel Dashboard（推薦）

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇你的專案
3. 點擊 **"Deployments"** 標籤
4. 選擇最新的部署（應該是最上面的）
5. 點擊部署項目，進入詳細頁面
6. 點擊 **"Functions"** 標籤
7. 找到 `/api/locations/register` 函數
8. 點擊該函數，查看 **"Logs"** 標籤

### 方法 2：Vercel CLI

如果你有安裝 Vercel CLI：

```bash
vercel logs --follow
```

這會即時顯示所有 serverless function 的日誌。

### 方法 3：Vercel Dashboard - Real-time Logs

1. 前往 Vercel Dashboard
2. 選擇你的專案
3. 點擊 **"Logs"** 標籤（在左側導航欄）
4. 選擇 **"Functions"** 過濾器
5. 選擇 `/api/locations/register`
6. 日誌會即時更新

## 測試步驟

### 1. 前往生產環境

打開你的 Vercel 部署 URL（例如：`https://your-project.vercel.app`）

### 2. 測試提交功能

1. 前往 `/map/submit` 頁面
2. 填寫表單：
   - 場地名稱（必填）
   - 地址（可選）
   - 在地圖上點選位置
3. 點擊「送出註冊」

### 3. 查看日誌

在 Vercel Dashboard 的 Logs 中，你應該會看到類似這樣的日誌：

```
[POST /api/locations/register] 🔍 Querying user_access table for users with can_upload = true...
[POST /api/locations/register] 📊 Query result: { count: 2, users: [...] }
[POST /api/locations/register] ✅ Using existing user_id from user_access for mock user: 06a4851c-0fa2-42ba-a707-ad389d8573aa, Original: user_1234567890, can_upload: true, display_name: 林世奇
[POST /api/locations/register] 📝 Preparing insert data with owner_user_id: 06a4851c-0fa2-42ba-a707-ad389d8573aa
[POST /api/locations/register] 💾 Attempting to insert data: { ... }
```

### 4. 如果出現 RLS 錯誤

你會看到：

```
[POST /api/locations/register] ❌ RLS policy violation detected!
[POST /api/locations/register] Attempted owner_user_id: ...
[POST /api/locations/register] Checking if this user_id exists in user_access with can_upload = true...
[POST /api/locations/register] User found in user_access: { ... }
[POST /api/locations/register] can_upload status: true/false
```

## 常見問題

### Q: 看不到日誌？

A: 確認：
1. 你已經提交了表單（觸發了 API 請求）
2. 選擇了正確的函數（`/api/locations/register`）
3. 日誌過濾器設置正確

### Q: 日誌延遲？

A: Vercel 的日誌可能有幾秒鐘的延遲，請稍等片刻。

### Q: 如何下載完整日誌？

A: 在 Vercel Dashboard 的 Logs 頁面，點擊右上角的「Download」按鈕。

## 下一步

1. 測試提交功能
2. 查看 Vercel Logs
3. 如果仍有問題，提供完整的日誌輸出
4. 如果成功，確認資料已出現在 Supabase 表中

