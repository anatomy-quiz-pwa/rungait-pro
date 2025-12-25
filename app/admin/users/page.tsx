"use client"

import { useState } from "react"
import { getMockAdminUsers } from "@/lib/admin-mock-data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Eye } from "lucide-react"
import Link from "next/link"

export default function AdminUsersPage() {
  const [users] = useState(getMockAdminUsers())
  const [searchTerm, setSearchTerm] = useState("")

  const filteredUsers = users.filter((user) => user.email.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Users</h2>
          <p className="text-slate-400 mt-1">Manage user accounts and quotas</p>
        </div>
        <Button className="gap-2 bg-cyan-600 hover:bg-cyan-700">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by email..."
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
                <TableHead className="text-slate-300">Email</TableHead>
                <TableHead className="text-slate-300">Role</TableHead>
                <TableHead className="text-slate-300">Plan</TableHead>
                <TableHead className="text-slate-300">Usage</TableHead>
                <TableHead className="text-slate-300">Joined</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const totalQuota = user.monthly_quota + user.credits_extra
                const usagePercent = (user.used_this_month / totalQuota) * 100

                return (
                  <TableRow key={user.id} className="border-slate-800">
                    <TableCell className="font-medium text-slate-200">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">{user.plan_id}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <span>{user.used_this_month}</span>
                          <span className="text-slate-600">/</span>
                          <span>{totalQuota}</span>
                        </div>
                        <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500" style={{ width: `${usagePercent}%` }} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
