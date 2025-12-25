"use client"

import { Card } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/i18n-provider"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function StudentsTable() {
  const { t } = useI18n()

  // Mock data
  const students = [
    {
      email: "student1@example.com",
      uploadCount: 12,
      creditsBalance: 5,
      lastLogin: "2025-01-07",
    },
    {
      email: "student2@example.com",
      uploadCount: 8,
      creditsBalance: 2,
      lastLogin: "2025-01-06",
    },
  ]

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-700">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">{t("studentAnalytics")}</h3>
      <Table>
        <TableHeader>
          <TableRow className="border-slate-700">
            <TableHead className="text-slate-400">Email</TableHead>
            <TableHead className="text-slate-400">{t("uploadCount")}</TableHead>
            <TableHead className="text-slate-400">{t("credits")}</TableHead>
            <TableHead className="text-slate-400">{t("lastLogin")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.email} className="border-slate-700">
              <TableCell className="text-slate-200">{student.email}</TableCell>
              <TableCell className="text-slate-300">{student.uploadCount}</TableCell>
              <TableCell className="text-slate-300">{student.creditsBalance}</TableCell>
              <TableCell className="text-slate-300">{student.lastLogin}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
