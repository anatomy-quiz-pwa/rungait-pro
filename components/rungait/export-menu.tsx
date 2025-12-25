"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Download, FileText, Sheet } from "lucide-react"

interface ExportMenuProps {
  onExportPDF?: () => void
  onExportCSV?: () => void
}

export function ExportMenu({ onExportPDF, onExportCSV }: ExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
        <DropdownMenuItem onClick={onExportPDF} className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700">
          <FileText className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer hover:bg-slate-700 focus:bg-slate-700">
          <Sheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
