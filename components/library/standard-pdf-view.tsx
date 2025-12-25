"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Eye, Download, Trash2, Plus, Star, FileText } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { StandardPdfUploadDialog } from "./standard-pdf-upload-dialog"
import { PdfPreviewModal } from "./pdf-preview-modal"
import type { OfficialFile } from "@/lib/types"
import { listOfficialFiles, deleteOfficialFile, addToCollection } from "@/lib/library-content"

export function StandardPdfView() {
  const { user, userRole } = useAuth()
  const [files, setFiles] = useState<OfficialFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [previewFile, setPreviewFile] = useState<OfficialFile | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  const isAdmin = userRole === "admin"

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

  const handleAddToFavorites = async (fileId: string) => {
    if (!user) return
    await addToCollection(user.id, "official_file", fileId)
    alert("已加入收藏")
  }

  const handleDelete = async (id: string) => {
    if (confirm("確定要刪除此 PDF 檔案？")) {
      await deleteOfficialFile(id)
      loadFiles()
    }
  }

  const handleDownload = (file: OfficialFile) => {
    // Simulated download - would use signed URL in production
    alert(`下載檔案：${file.name}`)
  }

  const filteredFiles = files.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return <div className="text-slate-400 text-center py-8">載入中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">標準資料庫（基本資料庫）</h2>
          <p className="text-slate-400 mb-4">提供跑步解剖教學用的標準 PDF 資料；一般教學與評估可直接引用。</p>
          <p className="text-sm text-amber-400/80">ⓘ 此區僅支援 PDF；影片或圖片請改以報告附件或個人資料庫上傳。</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setUploadDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600">
            <Plus className="h-4 w-4 mr-2" />
            上傳 PDF
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="搜尋檔案名稱或說明..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md bg-slate-800 border-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredFiles.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            {searchTerm ? "找不到符合的 PDF 檔案" : "尚無 PDF 檔案"}
          </div>
        )}

        {filteredFiles.map((file) => (
          <Card key={file.id} className="p-5 bg-slate-900/50 border-slate-700">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4 flex-1">
                <div className="p-3 rounded-lg bg-red-500/10 text-red-400 shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-semibold">{file.name}</h3>
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">{file.version}</Badge>
                    {file.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-slate-400 border-slate-600">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-slate-400 mb-2 line-clamp-2">{file.description}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB • PDF • {new Date(file.created_at).toLocaleDateString("zh-TW")}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewFile(file)}
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  預覽
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(file)}
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                >
                  <Download className="h-4 w-4 mr-1" />
                  下載
                </Button>
                {user && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddToFavorites(file.id)}
                    className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(file.id)}
                    className="bg-red-900/30 border-red-700 hover:bg-red-900/50 text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {previewFile && <PdfPreviewModal open={!!previewFile} onClose={() => setPreviewFile(null)} file={previewFile} />}

      {isAdmin && (
        <StandardPdfUploadDialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onSuccess={() => {
            setUploadDialogOpen(false)
            loadFiles()
          }}
        />
      )}
    </div>
  )
}
