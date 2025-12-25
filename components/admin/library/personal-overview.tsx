"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserLibraryStats {
  user_id: string
  email: string
  file_count: number
  total_size: number
  last_upload: string
}

export function PersonalOverview() {
  const router = useRouter()
  const [stats, setStats] = useState<UserLibraryStats[]>([
    {
      user_id: "1",
      email: "coach@example.com",
      file_count: 12,
      total_size: 8900000,
      last_upload: "2025-01-05",
    },
    {
      user_id: "2",
      email: "researcher@example.com",
      file_count: 28,
      total_size: 15600000,
      last_upload: "2025-01-07",
    },
  ])
  const [searchTerm, setSearchTerm] = useState("")

  const filteredStats = stats.filter((s) => s.email.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-slate-900/50 border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold mb-1">個人資料庫概覽</h3>
            <p className="text-sm text-slate-400">查看各使用者的個人資料庫使用統計</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/library/source/personal")}
            className="bg-slate-800 border-slate-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            前往使用者視角
          </Button>
        </div>

        <Input
          placeholder="搜尋使用者 email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4 bg-slate-800 border-slate-700"
        />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">使用者</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">檔案數</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">總容量</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">最近上傳</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.map((stat) => (
                <tr key={stat.user_id} className="border-b border-slate-800 hover:bg-slate-800/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-green-400" />
                      <p className="font-medium">{stat.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge className="bg-slate-700 text-slate-300">{stat.file_count} 個</Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-400">{(stat.total_size / 1024 / 1024).toFixed(1)} MB</td>
                  <td className="py-3 px-4 text-sm text-slate-400">{stat.last_upload}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" className="bg-slate-800 border-slate-700">
                        檢視檔案
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredStats.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              {searchTerm ? "找不到符合的使用者" : "尚無使用者資料"}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
