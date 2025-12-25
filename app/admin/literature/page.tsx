"use client"

import { useState } from "react"
import { getMockLiteratureNorms } from "@/lib/admin-mock-data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Download, Upload, Edit, Trash } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminLiteraturePage() {
  const [literature] = useState(getMockLiteratureNorms())
  const [searchTerm, setSearchTerm] = useState("")

  const filteredLiterature = literature.filter(
    (item) =>
      item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.doi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const exportCSV = () => {
    const csv = [
      ["Phase", "Joint", "Min", "Max", "Units", "Author", "Year", "DOI", "Note"],
      ...filteredLiterature.map((item) => [
        item.phase,
        item.joint,
        item.min_value,
        item.max_value,
        item.units,
        item.author,
        item.year,
        item.doi || "",
        item.note || "",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    if (typeof document === 'undefined') return
    
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `literature-norms-${Date.now()}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Literature Database</h2>
          <p className="text-slate-400 mt-1">Manage normative data and citations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={exportCSV} variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>
      </div>

      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by author, DOI, or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-950 border-slate-800"
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-950 hover:bg-slate-950">
                <TableHead className="text-slate-300">Phase</TableHead>
                <TableHead className="text-slate-300">Joint</TableHead>
                <TableHead className="text-slate-300">Range</TableHead>
                <TableHead className="text-slate-300">Author</TableHead>
                <TableHead className="text-slate-300">Year</TableHead>
                <TableHead className="text-slate-300">DOI</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLiterature.map((item) => (
                <TableRow key={item.id} className="border-slate-800">
                  <TableCell>
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                      {item.phase}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300 capitalize">{item.joint}</TableCell>
                  <TableCell className="text-slate-300">
                    {item.min_value} - {item.max_value} {item.units}
                  </TableCell>
                  <TableCell className="text-slate-300">{item.author}</TableCell>
                  <TableCell className="text-slate-400">{item.year}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">{item.doi || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
