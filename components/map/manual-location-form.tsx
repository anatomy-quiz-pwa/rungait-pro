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

  // 開發環境：檢查 API Key 是否載入
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      if (!apiKey) {
        console.warn('[ManualLocationForm] ⚠️ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set')
      } else {
        console.log('[ManualLocationForm] ✅ Google Maps API Key loaded:', apiKey.substring(0, 10) + '...')
      }
    }
  }, [apiKey])

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

  // 處理地址/店家選擇
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
    
    // 更新地圖中心並放大
    setMapCenter({ lat, lng })
    
    // 自動填入地址（優先使用 formatted_address）
    if (place.formatted_address) {
      setFormData(prev => ({ ...prev, address: place.formatted_address || '' }))
    } else if (place.vicinity) {
      setFormData(prev => ({ ...prev, address: place.vicinity || '' }))
    }
    
    // 自動填入名稱（如果是店家，使用 name；如果是地址，使用 formatted_address 的第一部分）
    if (place.name) {
      setFormData(prev => ({ ...prev, name: place.name || '' }))
    } else if (place.formatted_address) {
      // 如果是地址，使用地址的第一部分作為名稱
      const addressParts = place.formatted_address.split(',')
      setFormData(prev => ({ ...prev, name: addressParts[0] || place.formatted_address || '' }))
    }
    
    // 如果有電話，自動填入聯絡資訊
    if (place.formatted_phone_number && !formData.contact_info.trim()) {
      setFormData(prev => ({ ...prev, contact_info: place.formatted_phone_number || '' }))
    }
    
    setError(null)
    
    // 顯示成功訊息
    toast({
      title: "位置已設定",
      description: `已找到：${place.name || place.formatted_address}`,
    })
  }, [formData.address, formData.name, formData.contact_info, toast])

  // 處理手動輸入地址並搜尋（使用 Geocoding 作為備用方案）
  const handleSearchAddress = useCallback(async () => {
    if (!formData.address.trim()) {
      setError("請輸入地址或店家名稱")
      return
    }

    if (!isLoaded || !window.google) {
      setError("Google Maps 尚未載入完成，請稍候再試")
      return
    }

    setSearchingAddress(true)
    setError(null)

    try {
      const geocoder = new window.google.maps.Geocoder()
      const searchQuery = formData.address.trim()
      
      // 使用 Geocoding API 搜尋
      geocoder.geocode(
        { 
          address: searchQuery,
          region: 'tw', // 限制搜尋範圍為台灣
        },
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
            
            // 更新地址欄位（使用格式化後的地址）
            if (results[0].formatted_address) {
              setFormData(prev => ({ ...prev, address: results[0].formatted_address }))
            }
            
            // 如果名稱欄位是空的，使用地址的第一部分作為名稱
            if (!formData.name.trim() && results[0].formatted_address) {
              const addressParts = results[0].formatted_address.split(',')
              setFormData(prev => ({ ...prev, name: addressParts[0] || results[0].formatted_address }))
            }
            
            setError(null)
            
            toast({
              title: "位置已找到",
              description: `已定位到：${results[0].formatted_address}`,
            })
          } else if (status === 'ZERO_RESULTS') {
            setError("找不到此地址或店家，請嘗試：\n1. 使用更完整的地址\n2. 輸入店家名稱\n3. 或直接在地圖上點選位置")
          } else if (status === 'OVER_QUERY_LIMIT') {
            setError("搜尋次數已達上限，請稍後再試")
          } else if (status === 'REQUEST_DENIED') {
            setError("搜尋請求被拒絕，請檢查 Google Maps API 設定")
          } else {
            setError(`搜尋失敗：${status}，請重試或直接在地圖上點選位置`)
          }
        }
      )
    } catch (error) {
      setSearchingAddress(false)
      setError("地址搜尋失敗，請重試或直接在地圖上點選位置")
      console.error('Geocoding error:', error)
    }
  }, [formData.address, formData.name, isLoaded, toast])

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
    console.error('[ManualLocationForm] Google Maps load error:', loadError)
    return (
      <Alert className="bg-red-900/30 border-red-600">
        <AlertDescription className="text-red-200">
          <div className="space-y-2">
            <p className="font-semibold">無法載入 Google 地圖</p>
            <p className="text-sm">錯誤訊息：{loadError.message || '未知錯誤'}</p>
            <p className="text-sm">請檢查：</p>
            <ul className="text-sm list-disc list-inside space-y-1 ml-2">
              <li>Vercel 環境變數中是否已設定 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</li>
              <li>Google Cloud Console 中是否已啟用 Maps JavaScript API 和 Places API</li>
              <li>API Key 的 HTTP referrer 限制是否包含你的網域</li>
              <li>請查看瀏覽器 Console 以獲取詳細錯誤訊息</li>
            </ul>
            <p className="text-xs text-slate-400 mt-2">
              詳細修復指南請參考：GOOGLE_MAPS_ERROR_FIX.md
            </p>
          </div>
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
                    fields: [
                      'geometry', 
                      'formatted_address', 
                      'name', 
                      'place_id',
                      'vicinity',
                      'formatted_phone_number',
                      'website',
                      'types',
                    ],
                    types: ['establishment', 'geocode'], // 允許搜尋店家和地址
                  }}
                >
                  <Input
                    ref={addressInputRef}
                    type="text"
                    placeholder="搜尋地址或店家（例如：台北101、星巴克、台北市信義區信義路五段7號）"
                    className="bg-slate-800 border-slate-700"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        // 如果 Autocomplete 沒有選擇，則使用 Geocoding 搜尋
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
              可以輸入地址或店家名稱（例如：台北101、星巴克、7-11），從下拉選單選擇或按 Enter 搜尋
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

