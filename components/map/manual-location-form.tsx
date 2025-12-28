"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { GoogleMap, Marker, useLoadScript, Autocomplete } from '@react-google-maps/api'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Loader2, MapPin, CheckCircle2, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface ManualLocationFormProps {
  onSuccess?: () => void
}

const mapContainerStyle = { width: '100%', height: '400px' }
const defaultCenter = { lat: 25.0330, lng: 121.5654 } // 台北 101

export function ManualLocationForm({ onSuccess }: ManualLocationFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact_info: "",
    description: "",
  })

  // 載入 Google Maps
  const apiKey = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '')
    : ''

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
    libraries: ['places'],
    ...(apiKey ? {} : { libraries: [] }),
  })

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const [searchingAddress, setSearchingAddress] = useState(false)

  // 嘗試取得使用者位置
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          // 如果取得位置失敗，使用預設位置
          console.log('無法取得使用者位置，使用預設位置')
        }
      )
    }
  }, [])

  // 處理地圖點擊事件
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      setSelectedLocation({ lat, lng })
      setError(null)
    }
  }, [])

  // 處理 marker 拖曳
  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      setSelectedLocation({ lat, lng })
      setError(null)
    }
  }, [])

  // 處理地址 Autocomplete 載入
  const onAutocompleteLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete
  }, [])

  // 處理地址選擇
  const onPlaceChanged = useCallback(() => {
    if (!autocompleteRef.current) return

    const place = autocompleteRef.current.getPlace()
    
    if (!place.geometry || !place.geometry.location) {
      setError("無法取得此地點的座標資訊")
      return
    }

    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
    
    // 設定選中的位置
    setSelectedLocation({ lat, lng })
    
    // 更新地圖中心
    setMapCenter({ lat, lng })
    
    // 如果地址欄位是空的，自動填入
    if (!formData.address.trim() && place.formatted_address) {
      setFormData(prev => ({ ...prev, address: place.formatted_address || '' }))
    }
    
    // 如果名稱欄位是空的，自動填入
    if (!formData.name.trim() && place.name) {
      setFormData(prev => ({ ...prev, name: place.name || '' }))
    }
    
    setError(null)
  }, [formData.address, formData.name])

  // 處理手動輸入地址並搜尋（使用 Geocoding）
  const handleSearchAddress = useCallback(async () => {
    if (!formData.address.trim()) {
      setError("請輸入地址")
      return
    }

    if (!isLoaded || !window.google) {
      setError("Google Maps 尚未載入完成")
      return
    }

    setSearchingAddress(true)
    setError(null)

    try {
      const geocoder = new window.google.maps.Geocoder()
      
      geocoder.geocode(
        { address: formData.address.trim() },
        (results, status) => {
          setSearchingAddress(false)
          
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location
            const lat = location.lat()
            const lng = location.lng()
            
            // 設定選中的位置
            setSelectedLocation({ lat, lng })
            
            // 更新地圖中心
            setMapCenter({ lat, lng })
            
            // 如果地址與輸入的不同，更新地址欄位（使用格式化後的地址）
            if (results[0].formatted_address && results[0].formatted_address !== formData.address) {
              setFormData(prev => ({ ...prev, address: results[0].formatted_address }))
            }
            
            setError(null)
          } else {
            setError(`無法找到地址：${status === 'ZERO_RESULTS' ? '找不到此地址' : '搜尋失敗，請重試'}`)
          }
        }
      )
    } catch (error) {
      setSearchingAddress(false)
      setError("地址搜尋失敗，請重試")
      console.error('Geocoding error:', error)
    }
  }, [formData.address, isLoaded])

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
      setError("請在地圖上點選或拖曳 marker 來設定位置")
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
          address: formData.address.trim() || null,
          source: 'manual',
          contact_info: formData.contact_info.trim() || null,
          description: formData.description.trim() || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // 顯示更詳細的錯誤訊息
        const errorMessage = result.error || result.message || '提交失敗'
        const errorDetails = result.details ? ` (${result.details})` : ''
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      toast({
        title: "提交成功！",
        description: "場地已成功註冊，審核通過後將顯示在地圖上",
      })

      onSuccess?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : "提交失敗，請重試"
      setError(message)
      console.error('Location registration error:', error)
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 地圖 */}
      <Card className="p-6 bg-slate-900/50 border-slate-700">
        <div className="mb-4">
          <Label className="text-base font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-cyan-400" />
            在地圖上點選或拖曳 marker 來設定位置 *
          </Label>
          <p className="text-xs text-slate-400 mt-1">
            點擊地圖或拖曳藍色 marker 來設定場地座標，或使用下方地址搜尋
          </p>
        </div>

        {/* 地址搜尋框 */}
        {isLoaded && (
          <div className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Autocomplete
                  onLoad={onAutocompleteLoad}
                  onPlaceChanged={onPlaceChanged}
                  options={{
                    componentRestrictions: { country: 'tw' }, // 限制為台灣
                    fields: ['geometry', 'formatted_address', 'name', 'place_id'],
                  }}
                >
                  <Input
                    ref={addressInputRef}
                    type="text"
                    placeholder="搜尋地址或地點（例如：台北市信義區信義路五段7號）"
                    className="bg-slate-800 border-slate-700"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSearchAddress()
                      }
                    }}
                  />
                </Autocomplete>
              </div>
              <Button
                type="button"
                onClick={handleSearchAddress}
                disabled={searchingAddress || !formData.address.trim()}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {searchingAddress ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              輸入地址後按 Enter 或點擊搜尋按鈕，地圖會自動定位到該位置
            </p>
          </div>
        )}

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
                  draggable
                  onDragEnd={handleMarkerDragEnd}
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
            <Label htmlFor="name">場地名稱 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-slate-800 border-slate-700"
              placeholder="例如：XX 運動中心"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">地址</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="bg-slate-800 border-slate-700"
              placeholder="詳細地址（也可在上方搜尋框輸入地址）"
              rows={2}
            />
            <p className="text-xs text-slate-500">
              提示：您也可以在上方地圖區域的搜尋框輸入地址，系統會自動定位
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_info">聯絡資訊</Label>
            <Input
              id="contact_info"
              value={formData.contact_info}
              onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              className="bg-slate-800 border-slate-700"
              placeholder="電話或 Email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">備註</Label>
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
            送出註冊
          </Button>

          {!selectedLocation && (
            <p className="text-xs text-amber-400 text-center">
              請先在地圖上點選或拖曳 marker 來設定位置
            </p>
          )}
        </form>
      </Card>
    </div>
  )
}

