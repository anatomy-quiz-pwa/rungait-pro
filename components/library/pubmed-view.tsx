"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Star, ExternalLink, BookmarkPlus } from "lucide-react"
import { listPubmedRecords, listUserCollections, addToCollection, removeFromCollection } from "@/lib/library-content"
import type { PubmedRecord, UserCollection } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

export function PubmedView() {
  const { user } = useAuth()
  const [records, setRecords] = useState<PubmedRecord[]>([])
  const [collections, setCollections] = useState<UserCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    keyword: "",
    yearFrom: 2020,
    yearTo: 2025,
  })

  useEffect(() => {
    loadData()
  }, [filters])

  useEffect(() => {
    if (user) {
      loadCollections()
    }
  }, [user])

  const loadData = async () => {
    setLoading(true)
    const data = await listPubmedRecords(filters)
    setRecords(data)
    setLoading(false)
  }

  const loadCollections = async () => {
    if (!user) return
    const data = await listUserCollections(user.id)
    setCollections(data)
  }

  const handleAddToCollection = async (recordId: string) => {
    if (!user) return
    await addToCollection(user.id, "pubmed", recordId)
    loadCollections()
    alert("已加入收藏")
  }

  const handleRemoveFromCollection = async (collectionId: string) => {
    if (!user) return
    await removeFromCollection(user.id, collectionId)
    loadCollections()
  }

  const isInCollection = (recordId: string) => {
    return collections.some((c) => c.source_id === recordId)
  }

  if (loading) {
    return <div className="text-slate-400 text-center py-8">載入中...</div>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">科學文獻資料庫</h2>
          <p className="text-slate-400 mb-4">瀏覽推薦的跑步步態研究文獻，加入收藏後可用於報告引用。</p>

          <div className="flex gap-3 mb-6">
            <Input
              placeholder="搜尋關鍵字..."
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              className="bg-slate-900 border-slate-700"
            />
            <Input
              type="number"
              placeholder="年份起"
              value={filters.yearFrom}
              onChange={(e) => setFilters({ ...filters, yearFrom: Number.parseInt(e.target.value) })}
              className="bg-slate-900 border-slate-700 w-32"
            />
            <Input
              type="number"
              placeholder="年份迄"
              value={filters.yearTo}
              onChange={(e) => setFilters({ ...filters, yearTo: Number.parseInt(e.target.value) })}
              className="bg-slate-900 border-slate-700 w-32"
            />
          </div>
        </div>

        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.id} className="p-5 bg-slate-900/50 border-slate-700">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h3 className="text-lg font-semibold flex-1">{record.title}</h3>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">{record.year}</Badge>
              </div>

              <p className="text-sm text-slate-400 mb-2">{record.authors}</p>

              {record.journal && <p className="text-sm text-slate-500 italic mb-3">{record.journal}</p>}

              {record.abstract && <p className="text-sm text-slate-300 mb-3 line-clamp-2">{record.abstract}</p>}

              <div className="flex flex-wrap gap-2 mb-3">
                {record.keywords.map((keyword) => (
                  <Badge key={keyword} variant="outline" className="text-xs text-slate-400 border-slate-600">
                    {keyword}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                {record.doi && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(record.url || `https://doi.org/${record.doi}`, "_blank")}
                    className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    DOI
                  </Button>
                )}
                {isInCollection(record.id) ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    className="bg-green-900/30 border-green-700 text-green-400"
                  >
                    <Star className="h-4 w-4 mr-1 fill-current" />
                    已收藏
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddToCollection(record.id)}
                    className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                  >
                    <BookmarkPlus className="h-4 w-4 mr-1" />
                    加入收藏
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="lg:col-span-1">
        <Card className="p-5 bg-slate-900/50 border-slate-700 sticky top-20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-cyan-400" />
            我的收藏
          </h3>

          {collections.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">尚無收藏</p>
          ) : (
            <div className="space-y-3">
              {collections
                .filter((c) => c.source_type === "pubmed")
                .map((collection) => {
                  const record = records.find((r) => r.id === collection.source_id)
                  if (!record) return null

                  return (
                    <div key={collection.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <p className="text-sm font-medium mb-1 line-clamp-2">{record.title}</p>
                      <p className="text-xs text-slate-400 mb-2">
                        {record.authors.split(",")[0]} et al. ({record.year})
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveFromCollection(collection.id)}
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 p-0 h-auto"
                      >
                        移除
                      </Button>
                    </div>
                  )
                })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
