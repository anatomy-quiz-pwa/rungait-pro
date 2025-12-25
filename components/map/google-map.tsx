'use client'

import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api'
import { useState, useMemo } from 'react'

type Location = {
  id: string
  name: string
  lat: number
  lng: number
  description?: string
  contact_info?: string
  has_analysis?: boolean
  address?: string
  city?: string
}

const containerStyle = { width: '100%', height: '100%' }
const defaultCenter = { lat: 25.033, lng: 121.565 }

interface GoogleMapComponentProps {
  locations: Location[]
  height?: string
}

export function GoogleMapComponent({ locations, height = '400px' }: GoogleMapComponentProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
  })

  const [selected, setSelected] = useState<Location | null>(null)

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900/50 border border-slate-700 rounded-lg">
        <div className="text-center text-slate-400">
          <p>Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900/50 border border-slate-700 rounded-lg">
        <div className="text-center text-slate-400">
          <p>Failed to load Google Maps</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900/50 border border-slate-700 rounded-lg">
        <div className="text-center text-slate-400">
          <p>Loading map...</p>
        </div>
      </div>
    )
  }

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

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border border-slate-700">
      <GoogleMap 
        mapContainerStyle={containerStyle} 
        center={center} 
        zoom={locations.length > 0 ? 13 : 12}
        options={{
          styles: mapStyles,
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
            <div style={{ maxWidth: 240, color: '#1f2937' }}>
              <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
                {selected.name}
              </div>
              {selected.address && (
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  📍 {selected.address}
                </div>
              )}
              {selected.city && (
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                  {selected.city}
                </div>
              )}
              {selected.description && (
                <div style={{ fontSize: '14px', marginTop: '8px', marginBottom: '8px' }}>
                  {selected.description}
                </div>
              )}
              {selected.has_analysis && (
                <div style={{ fontSize: '14px', marginTop: '8px', color: '#10b981' }}>
                  🎥 已有跑姿分析案例
                </div>
              )}
              {selected.contact_info && (
                <a 
                  href={selected.contact_info.startsWith('http') ? selected.contact_info : `https://${selected.contact_info}`}
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ 
                    display: 'block', 
                    marginTop: '8px',
                    color: '#06b6d4',
                    textDecoration: 'underline'
                  }}
                >
                  聯絡 / 官網
                </a>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}

