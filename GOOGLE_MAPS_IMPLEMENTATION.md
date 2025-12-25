# Google Maps 串接實作文件

## 📋 檔案清單

### 1. 新增檔案

#### `/components/RunGaitMap.tsx` (Client Component)
- 使用 `@react-google-maps/api` 套件
- 從環境變數讀取 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- 使用 `useEffect` 呼叫 `GET /api/locations`
- 顯示 locations 為 Marker
- 點擊 Marker 顯示 InfoWindow（name/description/has_analysis/contact_url）
- 錯誤處理與載入狀態

#### `/app/map/page.tsx` (Server Component)
- 全螢幕地圖顯示範例
- 使用 `100vw` x `100vh` 尺寸

### 2. 已存在的檔案（無需修改）

#### `/app/api/locations/route.ts`
- 已實作 `GET /api/locations` API
- 回傳格式：`{ success: true, count: number, data: Location[] }`

---

## 📝 完整程式碼

### 檔案 1: `/components/RunGaitMap.tsx`

```typescript
'use client'

import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api'
import { useState, useMemo, useEffect } from 'react'

type Location = {
  id: string
  name: string
  lat: number
  lng: number
  description?: string
  contact_info?: string
  contact_url?: string
  has_analysis?: boolean
  address?: string
  city?: string
}

const containerStyle = { width: '100%', height: '100%' }
const defaultCenter = { lat: 25.033, lng: 121.565 }

export default function RunGaitMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
  })

  const [locations, setLocations] = useState<Location[]>([])
  const [selected, setSelected] = useState<Location | null>(null)

  useEffect(() => {
    fetch('/api/locations')
      .then(r => r.json())
      .then(result => {
        if (result.success && result.data) {
          setLocations(result.data)
        } else {
          console.error('Failed to load locations:', result.error)
          setLocations([])
        }
      })
      .catch((error) => {
        console.error('Error fetching locations:', error)
        setLocations([])
      })
  }, [])

  // 計算地圖中心點（如果有 locations，使用第一個；否則使用預設）
  const center = useMemo(() => {
    return locations.length > 0 
      ? { lat: locations[0].lat, lng: locations[0].lng }
      : defaultCenter
  }, [locations])

  // 建立自訂 marker icon
  const markerIcon = useMemo(() => {
    if (typeof window === 'undefined' || !window.google) {
      return undefined
    }
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="12" fill="#06b6d4" stroke="#ffffff" stroke-width="2"/>
          <circle cx="16" cy="16" r="6" fill="#ffffff"/>
        </svg>
      `),
      scaledSize: new window.google.maps.Size(32, 32),
    }
  }, [])

  // 深色主題地圖樣式
  const mapStyles = useMemo(() => [
    {
      featureType: 'all',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca3af' }],
    },
    {
      featureType: 'all',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#1f2937' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#0f172a' }],
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#111827' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#1f2937' }],
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ color: '#111827' }],
    },
  ], [])

  // 錯誤處理：缺少 API Key
  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0B0F12]">
        <div className="text-center text-slate-400 p-8">
          <p className="text-lg font-semibold mb-2">❌ Google Maps API Key 未設定</p>
          <p className="text-sm">請在環境變數中設定 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
        </div>
      </div>
    )
  }

  // 錯誤處理：地圖載入失敗
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0B0F12]">
        <div className="text-center text-slate-400 p-8">
          <p className="text-lg font-semibold mb-2">❌ Google Maps 載入失敗</p>
          <p className="text-sm">請檢查 API Key 是否正確，或網路連線是否正常</p>
          {loadError.message && (
            <p className="text-xs mt-2 text-slate-500">{loadError.message}</p>
          )}
        </div>
      </div>
    )
  }

  // 載入中狀態
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0B0F12]">
        <div className="text-center text-slate-400">
          <p>Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <GoogleMap 
      mapContainerStyle={containerStyle} 
      center={center} 
      zoom={locations.length > 0 ? 13 : 12}
      options={{
        styles: mapStyles,
        fullscreenControl: true,
        mapTypeControl: false,
        streetViewControl: false,
      }}
    >
      {/* 顯示所有 locations 為 Marker */}
      {locations.map(loc => (
        <Marker
          key={loc.id}
          position={{ lat: Number(loc.lat), lng: Number(loc.lng) }}
          onClick={() => setSelected(loc)}
          icon={markerIcon}
        />
      ))}

      {/* 點擊 Marker 顯示 InfoWindow */}
      {selected && (
        <InfoWindow
          position={{ lat: Number(selected.lat), lng: Number(selected.lng) }}
          onCloseClick={() => setSelected(null)}
        >
          <div style={{ maxWidth: 280, color: '#1f2937', padding: '4px' }}>
            {/* Name */}
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px', color: '#111827' }}>
              {selected.name}
            </div>
            
            {/* Description */}
            {selected.description && (
              <div style={{ fontSize: '14px', marginBottom: '8px', color: '#374151', lineHeight: '1.5' }}>
                {selected.description}
              </div>
            )}
            
            {/* Has Analysis */}
            {selected.has_analysis && (
              <div style={{ fontSize: '14px', marginBottom: '8px', color: '#10b981', fontWeight: 500 }}>
                🎥 已有跑姿分析案例
              </div>
            )}
            
            {/* Contact URL */}
            {(selected.contact_url || selected.contact_info) && (
              <a 
                href={
                  selected.contact_url 
                    ? (selected.contact_url.startsWith('http') ? selected.contact_url : `https://${selected.contact_url}`)
                    : (selected.contact_info?.startsWith('http') ? selected.contact_info : `https://${selected.contact_info}`)
                }
                target="_blank" 
                rel="noreferrer" 
                style={{ 
                  display: 'block', 
                  marginTop: '8px',
                  color: '#06b6d4',
                  textDecoration: 'underline',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                🔗 聯絡 / 官網
              </a>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}
```

### 檔案 2: `/app/map/page.tsx`

```typescript
import RunGaitMap from '@/components/RunGaitMap'

export default function MapPage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <RunGaitMap />
    </div>
  )
}
```

---

## 🔧 設定步驟

### 1. 安裝套件

```bash
cd running-gait/fullstack/frontend
pnpm add @react-google-maps/api
# 或
npm install @react-google-maps/api
```

### 2. 環境變數設定

在 `.env.local` 檔案中設定：

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. 確認 API 端點

確保 `/app/api/locations/route.ts` 已實作並回傳正確格式：

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "uuid",
      "name": "地點名稱",
      "lat": 25.033,
      "lng": 121.565,
      "description": "地點描述",
      "contact_url": "https://example.com",
      "has_analysis": true
    }
  ]
}
```

---

## ✅ 功能檢查清單

- [x] 使用 `@react-google-maps/api` 套件
- [x] 從環境變數讀取 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [x] `useEffect` 呼叫 `GET /api/locations`
- [x] locations 以 Marker 顯示
- [x] 點擊 Marker 顯示 InfoWindow
- [x] InfoWindow 顯示 name/description/has_analysis/contact_url
- [x] 缺少 API key 時顯示明確錯誤訊息
- [x] 地圖載入失敗時顯示明確錯誤訊息
- [x] 全螢幕地圖顯示範例

---

## 🎨 功能特點

1. **自動載入資料**：組件載入時自動從 API 取得 locations
2. **自訂 Marker Icon**：青色圓點標記，符合專案設計風格
3. **深色主題**：地圖樣式符合專案深色主題
4. **互動式 InfoWindow**：點擊標記顯示詳細資訊
5. **錯誤處理**：完整的錯誤處理與使用者提示
6. **響應式設計**：適配不同螢幕尺寸

---

## 📝 注意事項

1. **API Key 安全性**：`NEXT_PUBLIC_` 前綴的環境變數會暴露在前端，請在 Google Cloud Console 設定：
   - HTTP referrer 限制（限制特定網域）
   - API 限制（只啟用 Maps JavaScript API）

2. **資料格式**：確保 API 回傳的資料包含以下欄位：
   - `id`: 唯一識別碼
   - `name`: 地點名稱
   - `lat`: 緯度
   - `lng`: 經度
   - `description`: 描述（選填）
   - `contact_url` 或 `contact_info`: 聯絡資訊（選填）
   - `has_analysis`: 是否有分析案例（選填）

3. **地圖中心點**：如果有 locations，會使用第一個 location 作為中心點；否則使用預設中心點（台北 101）

---

## 🚀 使用方式

1. 確保環境變數已設定
2. 啟動開發伺服器：`npm run dev` 或 `pnpm dev`
3. 訪問 `/map` 頁面即可看到全螢幕 Google Maps
4. 點擊地圖上的標記可查看詳細資訊

