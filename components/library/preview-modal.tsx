"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface PreviewModalProps {
  open: boolean
  onClose: () => void
  file: {
    name: string
    mime: string
    storage_path: string
    size: number
  }
}

export function PreviewModal({ open, onClose, file }: PreviewModalProps) {
  const handleDownload = () => {
    alert(`下載 ${file.name}（開發中）`)
  }

  const renderPreview = () => {
    if (file.mime.startsWith("image/")) {
      return (
        <div className="flex items-center justify-center bg-slate-900 rounded-lg p-4">
          <img
            src={`/.jpg?height=400&width=600&query=${encodeURIComponent(file.name)}`}
            alt={file.name}
            className="max-w-full max-h-[500px] object-contain"
          />
        </div>
      )
    }

    if (file.mime === "application/pdf") {
      return (
        <div className="bg-slate-900 rounded-lg p-4 h-[500px] flex items-center justify-center">
          <p className="text-slate-400">PDF 預覽（開發中）</p>
        </div>
      )
    }

    if (file.mime.startsWith("video/")) {
      return (
        <div className="bg-slate-900 rounded-lg overflow-hidden">
          <video controls className="w-full max-h-[500px]">
            <source src={file.storage_path} type={file.mime} />
            Your browser does not support video playback.
          </video>
        </div>
      )
    }

    if (file.mime.startsWith("text/")) {
      return (
        <div className="bg-slate-900 rounded-lg p-4 h-[500px] overflow-auto">
          <pre className="text-slate-300 text-sm">文字檔案預覽（開發中）</pre>
        </div>
      )
    }

    return (
      <div className="bg-slate-900 rounded-lg p-8 h-[300px] flex flex-col items-center justify-center gap-3">
        <p className="text-slate-400">此檔案類型無法預覽</p>
        <Button onClick={handleDownload} variant="outline" className="bg-slate-800 border-slate-700">
          <Download className="h-4 w-4 mr-2" />
          下載檔案
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{file.name}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-slate-800">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-slate-400">
            {(file.size / 1024).toFixed(1)} KB • {file.mime}
          </p>
        </DialogHeader>

        {renderPreview()}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={handleDownload}
            className="bg-slate-800 border-slate-700 hover:bg-slate-700"
          >
            <Download className="h-4 w-4 mr-2" />
            下載
          </Button>
          <Button onClick={onClose} className="bg-cyan-500 hover:bg-cyan-600">
            關閉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
