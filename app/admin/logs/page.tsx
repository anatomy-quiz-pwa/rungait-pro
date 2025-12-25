"use client"

import { getMockUsageAnalyses } from "@/lib/admin-mock-data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminLogsPage() {
  const logs = getMockUsageAnalyses()

  const exportCSV = () => {
    const csv = [
      ["ID", "User ID", "Analysis ID", "Cost", "Filename", "Size", "Created At"],
      ...logs.map((log) => [
        log.id,
        log.user_id,
        log.analysis_id || "N/A",
        log.cost,
        log.metadata.filename,
        log.metadata.size,
        log.created_at,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `usage-logs-${Date.now()}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">System Logs</h2>
          <p className="text-slate-400 mt-1">Usage history and system events</p>
        </div>
        <Button onClick={exportCSV} className="gap-2 bg-cyan-600 hover:bg-cyan-700">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-950 hover:bg-slate-950">
                <TableHead className="text-slate-300">ID</TableHead>
                <TableHead className="text-slate-300">User</TableHead>
                <TableHead className="text-slate-300">Analysis</TableHead>
                <TableHead className="text-slate-300">Filename</TableHead>
                <TableHead className="text-slate-300">Cost</TableHead>
                <TableHead className="text-slate-300">Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="border-slate-800">
                  <TableCell className="font-mono text-xs text-slate-400">{log.id}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-300">{log.user_id}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">{log.analysis_id || "N/A"}</TableCell>
                  <TableCell className="text-slate-300">{log.metadata.filename}</TableCell>
                  <TableCell className="text-slate-300">{log.cost}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{new Date(log.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
