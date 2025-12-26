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
  // 讀取環境變數（必須是 NEXT_PUBLIC_ 前綴才能在 client component 中使用）
  // 在 Next.js 中，NEXT_PUBLIC_ 環境變數會在 build 時被內嵌到 client bundle
  // 注意：環境變數必須在 Vercel Environment Variables 中設定，且選擇 Production 環境
  // 如果環境變數在 build 時不存在，它會是 undefined，需要重新部署
  const apiKey = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '')
    : ''
  
  // Debug: 在 client 端檢查 API key
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      console.log('[RunGaitMap] API Key check:', {
        exists: !!key,
        length: key?.length || 0,
        prefix: key?.substring(0, 10) || 'N/A'
      })
    }
  }, [])
  
  // 只有在有 API key 時才載入 Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
    ...(apiKey ? {} : { libraries: [] }),
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

  // 若缺少 API key，顯示清單模式提示
  if (!apiKey || apiKey.trim() === '') {
    return (
      <div className="flex items-center justify-center h-full bg-[#0B0F12]">
        <div className="text-center text-slate-400 p-8 max-w-md">
          <p className="text-lg font-semibold mb-2">⚠️ 地圖功能需要 Google Maps API key</p>
          <p className="text-sm mb-4">目前顯示清單模式</p>
          <p className="text-xs text-slate-500 mb-2">
            請在 Vercel Dashboard → Settings → Environment Variables 中設定：
          </p>
          <p className="text-xs text-cyan-400 font-mono mb-2">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          </p>
          <p className="text-xs text-slate-500 mb-2">
            值：AIzaSyA8ZJkjc18cCppnTCrrtu0105jBewHt1dU
          </p>
          <p className="text-xs text-red-400 mb-2 font-semibold">
            ⚠️ 重要：必須選擇 "Production" 環境（或 "All Environments"）
          </p>
          <p className="text-xs text-slate-500 mt-4">
            設定後請在 Vercel Dashboard 手動觸發 "Redeploy"
          </p>
          <p className="text-xs text-amber-400 mt-2">
            注意：環境變數變更後必須重新部署才會生效
          </p>
        </div>
      </div>
    )
  }

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
      {locations.map(loc => (
        <Marker
          key={loc.id}
          position={{ lat: Number(loc.lat), lng: Number(loc.lng) }}
          onClick={() => setSelected(loc)}
          icon={markerIcon}
        />
      ))}

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

