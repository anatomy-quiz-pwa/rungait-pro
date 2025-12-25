"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, ExternalLink, Trash2, Plus } from "lucide-react"
import { listOfficialFiles, deleteOfficialFile } from "@/lib/library-content"
import { StandardPdfUploadDialog } from "@/components/library/standard-pdf-upload-dialog"
import type { OfficialFile } from "@/lib/types"
import { useRouter } from "next/navigation"

export function StandardPdfAdmin() {
  const router = useRouter()
  const [files, setFiles] = useState<OfficialFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setLoading(true)
    const data = await listOfficialFiles()
    const pdfFiles = data.filter((f) => f.mime === "application/pdf")
    setFiles(pdfFiles)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm("確定要刪除此 PDF？")) {
      await deleteOfficialFile(id)
      loadFiles()
    }
  }

  const handleBatchDelete = () => {
    alert("批次刪除功能：選取檔案後批次移除（開發中）")
  }

  const filteredFiles = files.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-slate-900/50 border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold mb-1">標準資料庫 PDF 管理</h3>
            <p className="text-sm text-slate-400">管理教學用標準 PDF 檔案，僅限管理員操作</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBatchDelete} className="bg-slate-800 border-slate-700">
              批次刪除
            </Button>
            <Button onClick={() => setUploadDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600">
              <Plus className="h-4 w-4 mr-2" />
              上傳 PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/library/source/official")}
              className="bg-slate-800 border-slate-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              前往使用者視角
            </Button>
          </div>
        </div>

        <Input
          placeholder="搜尋檔案名稱或說明..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4 bg-slate-800 border-slate-700"
        />

        {loading ? (
          <div className="text-center py-8 text-slate-400">載入中...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">檔案名稱</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">版本</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">大小</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">上傳日期</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-red-400" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{file.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">{file.version}</Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB</td>
                    <td className="py-3 px-4 text-sm text-slate-400">
                      {new Date(file.created_at).toLocaleDateString("zh-TW")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(file.id)}
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

            {filteredFiles.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                {searchTerm ? "找不到符合的檔案" : "尚無 PDF 檔案"}
              </div>
            )}
          </div>
        )}
      </Card>

      <StandardPdfUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={() => {
          setUploadDialogOpen(false)
          loadFiles()
        }}
      />
    </div>
  )
}
