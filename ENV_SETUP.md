# 環境變數設定說明

## 環境變數說明

### `NEXT_PUBLIC_API_BASE_URL`
**用途：** 後端 API 的基礎 URL，用於取得步態分析資料

**設定建議：**

#### 開發環境（本地）
```bash
# 選項 1：使用本地 mock API（目前）
NEXT_PUBLIC_API_BASE_URL=

# 選項 2：本地後端服務（例如 Flask/Express）
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

#### 生產環境（Vercel）
```bash
# 實際後端 API URL
NEXT_PUBLIC_API_BASE_URL=https://api.rungait.com
# 或
NEXT_PUBLIC_API_BASE_URL=https://your-backend.vercel.app
```

**使用方式：**
```typescript
// 在程式碼中使用
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const response = await fetch(`${apiUrl}/analysis/${id}`);
// 如果留空，則使用相對路徑：fetch(`/api/mock`)
```

---

### `NEXT_PUBLIC_CDN_URL`
**用途：** CDN 資源 URL，用於存放影片、圖片等大型靜態資源

**設定建議：**

#### 開發環境（本地）
```bash
# 留空，使用本地 public 資料夾
NEXT_PUBLIC_CDN_URL=

# 或使用本地資源伺服器
NEXT_PUBLIC_CDN_URL=http://localhost:9000
```

#### 生產環境（Vercel）
```bash
# Vercel Blob Storage
NEXT_PUBLIC_CDN_URL=https://your-project.vercel-storage.com

# 或使用其他 CDN 服務
NEXT_PUBLIC_CDN_URL=https://cdn.rungait.com
# Cloudflare R2
NEXT_PUBLIC_CDN_URL=https://your-bucket.r2.cloudflarestorage.com
# AWS CloudFront
NEXT_PUBLIC_CDN_URL=https://d1234567890.cloudfront.net
```

**使用方式：**
```typescript
// 在程式碼中使用
const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || '';
const videoUrl = `${cdnUrl}/videos/gait-analysis-001.mp4`;
// 如果留空，則使用相對路徑：`/videos/gait-analysis-001.mp4`
```

---

## 設定步驟

### 1. 本地開發環境

在專案根目錄建立 `.env.local` 檔案：

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_CDN_URL=
```

### 2. Vercel 生產環境

在 Vercel 專案設定中：

1. 進入 Vercel Dashboard
2. 選擇專案 → Settings → Environment Variables
3. 新增以下變數：
   - `NEXT_PUBLIC_API_BASE_URL` = `https://your-backend-api.com`
   - `NEXT_PUBLIC_CDN_URL` = `https://your-cdn-url.com`
4. 選擇要套用的環境（Production、Preview、Development）
5. 重新部署專案

---

## 注意事項

1. **`NEXT_PUBLIC_` 前綴**：這是 Next.js 的約定，表示變數會在客戶端（瀏覽器）可存取
2. **安全性**：這些變數會暴露在客戶端，不要放入敏感資訊（如 API keys）
3. **環境分離**：開發、預覽、生產環境可以設定不同的值
4. **預設行為**：如果變數為空，程式碼應該要有 fallback 機制（使用相對路徑）

