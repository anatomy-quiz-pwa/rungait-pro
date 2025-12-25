"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"
import type { OfficialFile } from "@/lib/types"

interface PdfPreviewModalProps {
  open: boolean
  onClose: () => void
  file: OfficialFile
}

export function PdfPreviewModal({ open, onClose, file }: PdfPreviewModalProps) {
  // In production, would get signed URL from Supabase Storage
  const previewUrl = `/placeholder.pdf?file=${encodeURIComponent(file.name)}`

  const handleDownload = () => {
    alert(`下載：${file.name}`)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-4xl h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">{file.name}</DialogTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDownload} className="bg-slate-800 border-slate-700">
                <Download className="h-4 w-4 mr-1" />
                下載
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(previewUrl, "_blank")}
                className="bg-slate-800 border-slate-700"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                新視窗
              </Button>
            </div>
          </div>
          <p className="text-sm text-slate-400">{file.description}</p>
        </DialogHeader>

        <div className="flex-1 overflow-hidden rounded-lg bg-slate-800 border border-slate-700">
          <embed src={previewUrl} type="application/pdf" className="w-full h-full" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
