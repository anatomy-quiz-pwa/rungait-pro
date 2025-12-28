"use client"

import { useState, useRef, useEffect } from "react"
import { useLoadScript, Autocomplete } from "@react-google-maps/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Loader2, MapPin, CheckCircle2, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

interface GooglePlaceSearchProps {
  onSuccess?: () => void
}

interface PlaceData {
  place_id: string
  name: string
  formatted_address: string
  lat: number
  lng: number
  website?: string
  formatted_phone_number?: string
  url?: string
}

export function GooglePlaceSearch({ onSuccess }: GooglePlaceSearchProps) {
  const [loading, setLoading] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const { toast } = useToast()

  const apiKey = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '')
    : ''

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey || '',
    libraries: ['places'],
    ...(apiKey ? {} : { libraries: [] }),
  })

  const onPlaceSelected = () => {
    if (!autocompleteRef.current) return

    const place = autocompleteRef.current.getPlace()
    
    if (!place.geometry || !place.geometry.location) {
      setError("無法取得此地點的座標資訊")
      return
    }

    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()

    setSelectedPlace({
      place_id: place.place_id || '',
      name: place.name || '',
      formatted_address: place.formatted_address || '',
      lat,
      lng,
      website: place.website,
      formatted_phone_number: place.formatted_phone_number,
      url: place.url,
    })
    setError(null)
  }

  const handleSubmit = async () => {
    if (!selectedPlace) {
      setError("請先選擇一個地點")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/locations/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedPlace.name,
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
          address: selectedPlace.formatted_address,
          source: 'google',
          google_place_id: selectedPlace.place_id,
          contact_info: selectedPlace.formatted_phone_number || selectedPlace.website || null,
          description: selectedPlace.website ? `網站: ${selectedPlace.website}` : null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(result.error || "此地點已經註冊過了")
        }
        throw new Error(result.error || '提交失敗')
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
          無法載入 Google Places API，請檢查 API Key 設定
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-700">
      <div className="space-y-6">
        <div>
          <Label className="text-base font-semibold mb-2 block">
            搜尋 Google 商家
          </Label>
          <p className="text-xs text-slate-400 mb-4">
            輸入商家名稱或地址，從 Google 搜尋結果中選擇
          </p>

          {!isLoaded ? (
            <div className="flex items-center justify-center h-12 bg-slate-800 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
            </div>
          ) : (
            <Autocomplete
              onLoad={(autocomplete) => {
                autocompleteRef.current = autocomplete
              }}
              onPlaceChanged={onPlaceSelected}
              options={{
                types: ['establishment', 'point_of_interest'],
              }}
            >
              <Input
                placeholder="搜尋商家名稱或地址..."
                className="bg-slate-800 border-slate-700"
              />
            </Autocomplete>
          )}
        </div>

        {error && (
          <Alert className="bg-red-900/30 border-red-600">
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {selectedPlace && (
          <Card className="p-4 bg-emerald-500/10 border-emerald-500/30">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-emerald-300 mb-1">
                    {selectedPlace.name}
                  </h3>
                  <div className="space-y-1 text-sm text-slate-300">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                      <span>{selectedPlace.formatted_address}</span>
                    </div>
                    {selectedPlace.formatted_phone_number && (
                      <div>📞 {selectedPlace.formatted_phone_number}</div>
                    )}
                    {selectedPlace.website && (
                      <div className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        <a
                          href={selectedPlace.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline"
                        >
                          {selectedPlace.website}
                        </a>
                      </div>
                    )}
                    <div className="text-xs text-slate-400 mt-2">
                      座標: {selectedPlace.lat.toFixed(6)}, {selectedPlace.lng.toFixed(6)}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                送出註冊
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Card>
  )
}

