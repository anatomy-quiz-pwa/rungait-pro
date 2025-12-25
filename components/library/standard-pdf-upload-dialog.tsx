"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText } from "lucide-react"
import { addOfficialFile } from "@/lib/library-content"

interface StandardPdfUploadDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function StandardPdfUploadDialog({ open, onClose, onSuccess }: StandardPdfUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: "",
    version: "v1.0",
  })
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
      if (!formData.name) {
        setFormData((prev) => ({ ...prev, name: selectedFile.name.replace(".pdf", "") }))
      }
    } else {
      alert("請選擇 PDF 檔案")
      e.target.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      alert("請選擇檔案")
      return
    }
    if (!formData.name.trim()) {
      alert("請輸入檔案名稱")
      return
    }

    setUploading(true)
    try {
      // Simulated upload - would use Supabase Storage in production
      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      await addOfficialFile({
        name: formData.name,
        description: formData.description,
        tags,
        version: formData.version,
        mime: "application/pdf",
        size: file.size,
        storage_path: `/standard-pdf/${Date.now()}-${file.name}`,
      })

      alert("上傳成功！")
      onSuccess()
    } catch (error) {
      console.error("[v0] Upload error:", error)
      alert("上傳失敗，請重試")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg">
        <DialogHeader>
          <DialogTitle>上傳 PDF 至標準資料庫</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-cyan-500/50 transition-colors">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" className="cursor-pointer">
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-red-400" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                  <p className="text-sm text-slate-300 mb-1">點擊選擇 PDF 檔案</p>
                  <p className="text-xs text-slate-500">僅接受 .pdf 格式</p>
                </div>
              )}
            </label>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">檔案名稱 *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例：跑步步態基準資料 2024"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">說明</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="簡述此 PDF 的內容、適用場景或參考價值..."
              rows={3}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">版本</label>
              <Input
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="v1.0"
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
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
            <Button variant="outline" onClick={onClose} disabled={uploading} className="bg-slate-800 border-slate-700">
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={uploading || !file} className="bg-cyan-500 hover:bg-cyan-600">
              {uploading ? "上傳中..." : "確認上傳"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
