# Vercel 部署錯誤修正總結

## ✅ 錯誤一：pnpm-lock.yaml 缺少 'importers' 欄位

### 問題
Vercel build 時無法解析舊格式的 pnpm-lock.yaml

### 修正方式
已重新生成 pnpm-lock.yaml：
```bash
cd running-gait/fullstack/frontend
rm -f pnpm-lock.yaml
pnpm install
```

### 驗證
- ✅ pnpm-lock.yaml 現在包含 `importers` 欄位（第7行）
- ✅ lockfileVersion: '9.0'（最新格式）

---

## ✅ 錯誤二：ReferenceError: location is not defined

### 問題
在 Server Component 或 build 階段使用了瀏覽器 API（window.location）

### 修正檔案
**`app/report/[id]/page.tsx`**

#### 修正前：
```typescript
const handleCopyLink = () => {
  navigator.clipboard.writeText(window.location.href)
  alert("Link copied to clipboard")
}

// ...

window.location.reload()
```

#### 修正後：
```typescript
const handleCopyLink = () => {
  if (typeof window !== 'undefined') {
    navigator.clipboard.writeText(window.location.href)
    alert("Link copied to clipboard")
  }
}

// ...

if (typeof window !== 'undefined') {
  window.location.reload()
}
```

### 驗證清單
- ✅ `app/report/[id]/page.tsx` 已有 `"use client"` 標記
- ✅ 所有 `window.location` 使用都加上 `typeof window !== 'undefined'` 檢查
- ✅ `components/RunGaitMap.tsx` 已有 `'use client'` 標記
- ✅ `app/map/page.tsx` 是 Server Component，只渲染 Client Component
- ✅ `app/api/locations/route.ts` 是 API route，不使用瀏覽器 API

---

## 📋 檢查清單

### 所有使用 window.location 的地方
1. ✅ `app/report/[id]/page.tsx` - 已加上檢查
   - `window.location.href` (line 114)
   - `window.location.reload()` (line 153)

### 所有 Client Components
1. ✅ `components/RunGaitMap.tsx` - 有 `'use client'`
2. ✅ `app/report/[id]/page.tsx` - 有 `"use client"`

### 所有 Server Components / API Routes
1. ✅ `app/map/page.tsx` - Server Component，只 import Client Component
2. ✅ `app/api/locations/route.ts` - API route，不使用瀏覽器 API

---

## 🚀 部署前檢查

1. ✅ pnpm-lock.yaml 已更新並包含 importers 欄位
2. ✅ 所有 window.location 使用都有 typeof window 檢查
3. ✅ 所有 Client Components 都有 'use client' 標記
4. ✅ 沒有在 Server Component 中使用瀏覽器 API

---

## 📝 注意事項

1. **pnpm-lock.yaml** 必須 commit 到 repo
2. **Vercel Build Command** 應使用 `pnpm run build`（如果使用 pnpm）
3. 所有瀏覽器 API 使用都必須在 Client Component 中，且加上 `typeof window !== 'undefined'` 檢查

