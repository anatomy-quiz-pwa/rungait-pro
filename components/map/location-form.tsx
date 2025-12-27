"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { Loader2, MapPin, CheckCircle2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LocationFormProps {
  onSuccess?: () => void
}

const mapContainerStyle = { width: '100%', height: '400px' }
const defaultCenter = { lat: 25.033, lng: 121.565 } // 台北 101

export function LocationForm({ onSuccess }: LocationFormProps) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    address: "",
    description: "",
    contact_info: "",
  })

  // 載入 Google Maps
  const apiKey = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '')
    : ''

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
    ...(apiKey ? {} : { libraries: [] }),
  })

  // 處理地圖點擊事件
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      setSelectedLocation({ lat, lng })
      setError(null)
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
      featureType: 'all',
      elementType: 'geometry',
      stylers: [{ color: '#1f2937' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#111827' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#374151' }],
    },
  ], [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 驗證必填欄位
    if (!formData.name.trim()) {
      setError("請輸入場地名稱")
      return
    }

    if (!selectedLocation) {
      setError("請在地圖上點選位置")
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/locations/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
          city: formData.city.trim() || null,
          address: formData.address.trim() || null,
          description: formData.description.trim() || null,
          contact_info: formData.contact_info.trim() || null,
          source: 'manual',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '提交失敗')
      }

      // 使用 toast 替代 alert
      if (typeof window !== 'undefined' && window.location) {
        alert(t("submitSuccess") || "提交成功！審核通過後若選擇開放將自動獲得 5 點數")
      }
      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : "提交失敗，請重試"
      setError(message)
      console.error('Location submission error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loadError) {
    return (
      <Alert className="bg-red-900/30 border-red-600">
        <AlertDescription className="text-red-200">
          無法載入地圖，請檢查 Google Maps API Key 設定
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* 地圖選擇位置 */}
      <Card className="p-6 bg-slate-900/50 border-slate-700">
        <div className="mb-4">
          <Label className="text-base font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-cyan-400" />
            在地圖上點選位置 *
          </Label>
          <p className="text-xs text-slate-400 mt-1">
            點擊地圖上的位置來設定場地座標
          </p>
        </div>

        {!isLoaded ? (
          <div className="flex items-center justify-center h-[400px] bg-slate-800 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="relative">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={13}
              onClick={handleMapClick}
              options={{
                styles: mapStyles,
                disableDefaultUI: false,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
              }}
            >
              {selectedLocation && (
                <Marker
                  position={selectedLocation}
                  icon={{
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="15" fill="#06b6d4" stroke="#ffffff" stroke-width="3"/>
                        <circle cx="20" cy="20" r="7" fill="#ffffff"/>
                      </svg>
                    `),
                    scaledSize: new google.maps.Size(40, 40),
                  }}
                />
              )}
            </GoogleMap>
          </div>
        )}

        {selectedLocation && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-emerald-300">
              已選擇位置：{selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </span>
          </div>
        )}
      </Card>

      {/* 表單 */}
      <Card className="p-6 bg-slate-900/50 border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="bg-red-900/30 border-red-600">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{t("locationName")} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-slate-800 border-slate-700"
              placeholder="例如：XX 運動中心"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">{t("city")}</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="bg-slate-800 border-slate-700"
                placeholder="例如：台北市"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_info">{t("contactInfo")}</Label>
              <Input
                id="contact_info"
                value={formData.contact_info}
                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                className="bg-slate-800 border-slate-700"
                placeholder="電話或 Email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t("address")}</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="bg-slate-800 border-slate-700"
              placeholder="詳細地址"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("notes")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-800 border-slate-700"
              placeholder="其他備註資訊"
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-cyan-600 hover:bg-cyan-700" 
            disabled={loading || !selectedLocation}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("submit")}
          </Button>

          {!selectedLocation && (
            <p className="text-xs text-amber-400 text-center">
              請先在地圖上點選位置
            </p>
          )}
        </form>
      </Card>
    </div>
  )
}
