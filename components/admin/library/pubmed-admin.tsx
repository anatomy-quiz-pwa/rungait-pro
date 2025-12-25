"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FlaskConical, ExternalLink, Edit, Trash2, Plus, Upload } from "lucide-react"
import { useRouter } from "next/navigation"

interface PubmedEntry {
  id: string
  title: string
  authors: string
  year: number
  journal: string
  doi: string
  created_at: string
}

export function PubmedAdmin() {
  const router = useRouter()
  const [entries, setEntries] = useState<PubmedEntry[]>([
    {
      id: "1",
      title: "Biomechanical Analysis of Running Gait Patterns",
      authors: "Smith J, Johnson K",
      year: 2023,
      journal: "Journal of Biomechanics",
      doi: "10.1016/j.jbiomech.2023.01.001",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Effects of Footwear on Running Economy",
      authors: "Chen L, Wang Y",
      year: 2024,
      journal: "Sports Medicine",
      doi: "10.1007/s40279-024-01234-5",
      created_at: new Date().toISOString(),
    },
  ])
  const [searchTerm, setSearchTerm] = useState("")

  const handleDelete = (id: string) => {
    if (confirm("確定要刪除此文獻推薦？")) {
      setEntries(entries.filter((e) => e.id !== id))
    }
  }

  const handleImportCSV = () => {
    alert("CSV 匯入功能：批次匯入 PubMed 文獻（開發中）")
  }

  const filteredEntries = entries.filter(
    (e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.authors.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-slate-900/50 border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold mb-1">PubMed 文獻推薦管理</h3>
            <p className="text-sm text-slate-400">管理推薦給使用者的科學文獻</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleImportCSV} className="bg-slate-800 border-slate-700">
              <Upload className="h-4 w-4 mr-2" />
              CSV 匯入
            </Button>
            <Button className="bg-cyan-500 hover:bg-cyan-600">
              <Plus className="h-4 w-4 mr-2" />
              新增文獻
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/library/source/pubmed")}
              className="bg-slate-800 border-slate-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              前往使用者視角
            </Button>
          </div>
        </div>

        <Input
          placeholder="搜尋標題或作者..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4 bg-slate-800 border-slate-700"
        />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">標題</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">作者（年份）</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">期刊</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">DOI</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <FlaskConical className="h-5 w-5 text-blue-400" />
                      <p className="font-medium line-clamp-2">{entry.title}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-400">
                    {entry.authors} ({entry.year})
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-400">{entry.journal}</td>
                  <td className="py-3 px-4">
                    <a
                      href={`https://doi.org/${entry.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-cyan-400 hover:underline"
                    >
                      {entry.doi}
                    </a>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" className="bg-slate-800 border-slate-700">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(entry.id)}
                        className="bg-red-900/30 border-red-700 hover:bg-red-900/50 text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredEntries.length === 0 && (
            <div className="text-center py-12 text-slate-400">{searchTerm ? "找不到符合的文獻" : "尚無推薦文獻"}</div>
          )}
        </div>
      </Card>
    </div>
  )
}
