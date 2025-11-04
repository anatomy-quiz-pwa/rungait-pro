# 環境變數設定指南

## 目前狀態

目前專案使用 **本地 Mock API** (`/api/mock`)，所以這兩個環境變數可以暫時**留空**。

---

## 情境 1：目前階段（使用 Mock 資料）

### 設定值

在 Vercel 環境變數設定中：

```
NEXT_PUBLIC_API_BASE_URL = (留空)
NEXT_PUBLIC_CDN_URL = (留空)
```

**說明：**
- 留空時，前端會使用相對路徑 `/api/mock` 取得假資料
- 影片會使用相對路徑或本地檔案

---

## 情境 2：有後端 API（例如 Flask/Python 後端）

### 設定值

```
NEXT_PUBLIC_API_BASE_URL = https://your-backend-api.com
# 或
NEXT_PUBLIC_API_BASE_URL = https://your-flask-app.herokuapp.com
# 或
NEXT_PUBLIC_API_BASE_URL = https://api.example.com
```

**範例：**
```
NEXT_PUBLIC_API_BASE_URL = https://rungait-api.vercel.app
```

**後端 API 需要提供的端點：**
- `GET /analysis/:id` - 取得分析結果
- `POST /analysis` - 上傳影片並開始分析
- `GET /comparison/:id1/:id2` - 取得比較結果

---

## 情境 3：有 CDN 服務（存放影片）

### 設定值

#### 選項 A：使用 Vercel Blob Storage
```
NEXT_PUBLIC_CDN_URL = https://your-project.vercel-storage.com
```

**設定步驟：**
1. 在 Vercel Dashboard 啟用 Blob Storage
2. 取得 Storage URL
3. 將 URL 填入環境變數

#### 選項 B：使用 Cloudflare R2
```
NEXT_PUBLIC_CDN_URL = https://your-bucket.r2.cloudflarestorage.com
```

#### 選項 C：使用 AWS CloudFront
```
NEXT_PUBLIC_CDN_URL = https://d1234567890.cloudfront.net
```

#### 選項 D：使用自訂 CDN
```
NEXT_PUBLIC_CDN_URL = https://cdn.rungait.com
```

---

## 情境 4：完整設定（後端 + CDN）

### 設定值

```
NEXT_PUBLIC_API_BASE_URL = https://api.rungait.com
NEXT_PUBLIC_CDN_URL = https://cdn.rungait.com
```

---

## 在 Vercel 設定步驟

1. **前往環境變數設定頁面：**
   https://vercel.com/anatomy-quiz-pwas-projects/rungait-pro/settings/environment-variables

2. **新增環境變數：**
   - 點擊 "Add New"
   - Key: `NEXT_PUBLIC_API_BASE_URL`
   - Value: (你的 API URL，或留空)
   - 選擇環境：Production / Preview / Development

3. **重複步驟 2 新增 CDN URL**

4. **重新部署：**
   - 在 Vercel Dashboard 點擊 "Redeploy"
   - 或推送新的 commit 到 GitHub

---

## 目前建議（開發階段）

由於目前使用 Mock API，建議：

```
NEXT_PUBLIC_API_BASE_URL = (留空)
NEXT_PUBLIC_CDN_URL = (留空)
```

**優點：**
- 不需要額外設定
- 可以立即測試功能
- 等後端準備好後再填入真實 URL

---

## 未來連接真實後端時

需要修改以下檔案來使用環境變數：

### `src/app/analyze/page.tsx`

```typescript
// 修改前
const response = await fetch('/api/mock?type=analysis');

// 修改後
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const response = await fetch(`${apiBaseUrl}/analysis/${id}`);
```

### `src/components/VideoPlayer.tsx` 或相關元件

```typescript
// 修改前
<VideoPlayer src={videoUrl} />

// 修改後
const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || '';
const fullVideoUrl = cdnUrl ? `${cdnUrl}${videoUrl}` : videoUrl;
<VideoPlayer src={fullVideoUrl} />
```

---

## 總結

**目前階段（使用 Mock）：兩個變數都留空即可**

**未來有後端時：**
- `NEXT_PUBLIC_API_BASE_URL` = 你的後端 API 網址
- `NEXT_PUBLIC_CDN_URL` = 你的 CDN 網址（如果有）

