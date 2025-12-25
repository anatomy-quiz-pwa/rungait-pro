"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, Edit, Trash2, Plus, Star } from "lucide-react"
import { PreviewModal } from "./preview-modal"
import {
  listOfficialFiles,
  addOfficialFile,
  updateOfficialFile,
  deleteOfficialFile,
  addToCollection,
} from "@/lib/library-content"
import type { OfficialFile } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

export function OfficialView() {
  const { user, userRole } = useAuth()
  const [files, setFiles] = useState<OfficialFile[]>([])
  const [loading, setLoading] = useState(true)
  const [previewFile, setPreviewFile] = useState<OfficialFile | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editFile, setEditFile] = useState<OfficialFile | null>(null)

  const isAdmin = userRole === "admin"

  useEffect(() => {
    loadFiles()
  }, [])

  const loadFiles = async () => {
    setLoading(true)
    const data = await listOfficialFiles()
    setFiles(data)
    setLoading(false)
  }

  const handleAddToFavorites = async (fileId: string) => {
    if (!user) return
    await addToCollection(user.id, "official_file", fileId)
    alert("已加入收藏")
  }

  const handleDelete = async (id: string) => {
    if (confirm("確定要刪除此檔案？")) {
      await deleteOfficialFile(id)
      loadFiles()
    }
  }

  if (loading) {
    return <div className="text-slate-400 text-center py-8">載入中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">官方課程資料庫</h2>
          <p className="text-slate-400">包含課程教學用的標準跑步步態資料，適合一般教學與評估使用。</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setUploadDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600">
            <Plus className="h-4 w-4 mr-2" />
            上傳檔案
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {files.map((file) => (
          <Card key={file.id} className="p-4 bg-slate-900/50 border-slate-700">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{file.name}</h3>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">{file.version}</Badge>
                  {file.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-slate-400 border-slate-600">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-slate-400 mb-2">{file.description}</p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB • {file.mime} • {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2">
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
                  onClick={() => handleAddToFavorites(file.id)}
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                >
                  <Star className="h-4 w-4 mr-1" />
                  收藏
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditFile(file)}
                      className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(file.id)}
                      className="bg-red-900/30 border-red-700 hover:bg-red-900/50 text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {previewFile && <PreviewModal open={!!previewFile} onClose={() => setPreviewFile(null)} file={previewFile} />}

      {isAdmin && (
        <UploadDialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onSuccess={() => {
            setUploadDialogOpen(false)
            loadFiles()
          }}
        />
      )}

      {isAdmin && editFile && (
        <EditDialog
          file={editFile}
          onClose={() => setEditFile(null)}
          onSuccess={() => {
            setEditFile(null)
            loadFiles()
          }}
        />
      )}
    </div>
  )
}

function UploadDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: "",
    version: "v1.0",
    mime: "application/pdf",
    size: 1024000,
    storage_path: "/official/new-file.pdf",
  })

  const handleSubmit = async () => {
    const tags = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    await addOfficialFile({ ...formData, tags })
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle>上傳新檔案</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">檔案名稱</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">說明</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">標籤（逗號分隔）</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="教學, 基準"
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">版本</label>
            <Input
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={onClose} className="bg-slate-800 border-slate-700">
              取消
            </Button>
            <Button onClick={handleSubmit} className="bg-cyan-500 hover:bg-cyan-600">
              上傳
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditDialog({
  file,
  onClose,
  onSuccess,
}: {
  file: OfficialFile
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: file.name,
    description: file.description,
    tags: file.tags.join(", "),
    version: file.version,
  })

  const handleSubmit = async () => {
    const tags = formData.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    await updateOfficialFile(file.id, { ...formData, tags })
    onSuccess()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle>編輯檔案資訊</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">檔案名稱</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">說明</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">標籤（逗號分隔）</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">版本</label>
            <Input
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={onClose} className="bg-slate-800 border-slate-700">
              取消
            </Button>
            <Button onClick={handleSubmit} className="bg-cyan-500 hover:bg-cyan-600">
              儲存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
