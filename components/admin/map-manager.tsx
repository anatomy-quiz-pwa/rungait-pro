"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { approveLocation, rejectLocation } from "@/lib/map"
import type { LocationRow } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, Search } from "lucide-react"

export function MapManager() {
  const { t } = useI18n()
  const [locations, setLocations] = useState<LocationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [cityFilter, setCityFilter] = useState("")

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    // Load all locations (including pending) - needs admin override
    const savedLocations = localStorage.getItem("treadmill_locations")
    const allLocations: LocationRow[] = savedLocations ? JSON.parse(savedLocations) : []
    setLocations(allLocations)
    setLoading(false)
  }

  const handleApprove = async (id: string) => {
    await approveLocation(id)
    await loadLocations()
  }

  const handleReject = async (id: string) => {
    await rejectLocation(id)
    await loadLocations()
  }

  const filteredLocations = locations.filter((loc) =>
    cityFilter ? loc.city?.toLowerCase().includes(cityFilter.toLowerCase()) : true,
  )

  if (loading) {
    return <div className="text-slate-400">{t("loading")}...</div>
  }

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-slate-100">{t("mapManager")}</h3>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <Input
            placeholder={t("city")}
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-48 bg-slate-800 border-slate-700"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-slate-700">
            <TableHead className="text-slate-400">{t("locationName")}</TableHead>
            <TableHead className="text-slate-400">{t("city")}</TableHead>
            <TableHead className="text-slate-400">公開</TableHead>
            <TableHead className="text-slate-400">狀態</TableHead>
            <TableHead className="text-slate-400">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLocations.map((location) => (
            <TableRow key={location.id} className="border-slate-700">
              <TableCell className="text-slate-200">{location.name}</TableCell>
              <TableCell className="text-slate-300">{location.city || "-"}</TableCell>
              <TableCell>
                {location.allow_public ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0">是</Badge>
                ) : (
                  <Badge variant="outline" className="border-slate-600">
                    否
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    location.status === "approved"
                      ? "border-emerald-600 text-emerald-400"
                      : location.status === "rejected"
                        ? "border-red-600 text-red-400"
                        : "border-amber-600 text-amber-400"
                  }
                >
                  {t(location.status)}
                </Badge>
              </TableCell>
              <TableCell>
                {location.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-600 text-emerald-400 hover:bg-emerald-500/10 bg-transparent"
                      onClick={() => handleApprove(location.id)}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      {t("approve")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-500/10 bg-transparent"
                      onClick={() => handleReject(location.id)}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      {t("reject")}
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
