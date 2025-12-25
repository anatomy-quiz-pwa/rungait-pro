"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, Trash2, Plus, Edit } from "lucide-react"
import { PreviewModal } from "./preview-modal"
import { listPersonalFiles, addPersonalFile, updatePersonalFile, deletePersonalFile } from "@/lib/library-content"
import type { PersonalFile } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"

export function PersonalView() {
  const { user } = useAuth()
  const [files, setFiles] = useState<PersonalFile[]>([])
  const [loading, setLoading] = useState(true)
  const [previewFile, setPreviewFile] = useState<PersonalFile | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editPromptsFile, setEditPromptsFile] = useState<PersonalFile | null>(null)

  useEffect(() => {
    if (user) {
      loadFiles()
    }
  }, [user])

  const loadFiles = async () => {
    if (!user) return
    setLoading(true)
    const data = await listPersonalFiles(user.id)
    setFiles(data)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    if (confirm("確定要刪除此檔案？")) {
      await deletePersonalFile(user.id, id)
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
          <h2 className="text-2xl font-bold mb-2">我的資料庫</h2>
          <p className="text-slate-400">上傳您自己的跑步步態資料、文獻或筆記，用於個人化分析。</p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600">
          <Plus className="h-4 w-4 mr-2" />
          上傳檔案
        </Button>
      </div>

      {files.length === 0 ? (
        <Card className="p-8 bg-slate-900/50 border-slate-700 text-center">
          <p className="text-slate-400 mb-4">尚無上傳的檔案</p>
          <Button onClick={() => setUploadDialogOpen(true)} className="bg-cyan-500 hover:bg-cyan-600">
            <Plus className="h-4 w-4 mr-2" />
            上傳第一個檔案
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {files.map((file) => (
            <Card key={file.id} className="p-4 bg-slate-900/50 border-slate-700">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{file.name}</h3>
                  {file.description && <p className="text-sm text-slate-400 mb-2">{file.description}</p>}
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB • {file.mime} • {new Date(file.created_at).toLocaleDateString()}
                  </p>
                  {file.prompts && file.prompts.length > 0 && (
                    <p className="text-xs text-cyan-400 mt-1">{file.prompts.length} 個 Prompt</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewFile(file)}
                    className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditPromptsFile(file)}
                    className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Prompt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(file.id)}
                    className="bg-red-900/30 border-red-700 hover:bg-red-900/50 text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {previewFile && <PreviewModal open={!!previewFile} onClose={() => setPreviewFile(null)} file={previewFile} />}

      <UploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={() => {
          setUploadDialogOpen(false)
          loadFiles()
        }}
      />

      {editPromptsFile && (
        <EditPromptsDialog
          file={editPromptsFile}
          onClose={() => setEditPromptsFile(null)}
          onSuccess={() => {
            setEditPromptsFile(null)
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
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    mime: "application/pdf",
    size: 1024000,
    storage_path: "/personal/new-file.pdf",
  })

  const handleSubmit = async () => {
    if (!user) return
    await addPersonalFile(user.id, formData)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle>上傳個人檔案</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">檔案名稱</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例：我的步態筆記.pdf"
              className="bg-slate-800 border-slate-700"
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">說明（選填）</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

function EditPromptsDialog({
  file,
  onClose,
  onSuccess,
}: {
  file: PersonalFile
  onClose: () => void
  onSuccess: () => void
}) {
  const { user } = useAuth()
  const [prompts, setPrompts] = useState(file.prompts?.join("\n") || "")

  const handleSave = async () => {
    if (!user) return
    const promptsArray = prompts.split("\n").filter((p) => p.trim())
    await updatePersonalFile(user.id, file.id, { prompts: promptsArray })
    onSuccess()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle>編輯 Prompts - {file.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Prompts（每行一個）</label>
            <Textarea
              value={prompts}
              onChange={(e) => setPrompts(e.target.value)}
              placeholder="輸入分析提示詞，例如：&#10;- 關注腳掌著地角度&#10;- 比較左右腿差異"
              className="bg-slate-800 border-slate-700 min-h-[200px] font-mono text-sm"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={onClose} className="bg-slate-800 border-slate-700">
              取消
            </Button>
            <Button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-600">
              儲存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
