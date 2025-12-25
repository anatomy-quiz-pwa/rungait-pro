"use client"

import { useState } from "react"
import { getMockApiTokens } from "@/lib/admin-mock-data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Copy, Ban, Check } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function AdminSystemAPIPage() {
  const [tokens] = useState(getMockApiTokens())
  const [showNewToken, setShowNewToken] = useState(false)
  const [newToken, setNewToken] = useState("")
  const [copied, setCopied] = useState(false)

  const generateNewToken = () => {
    // Mock token generation
    const mockToken = `gait_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    setNewToken(mockToken)
    setShowNewToken(true)
  }

  const copyToken = () => {
    navigator.clipboard.writeText(newToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">System API</h2>
          <p className="text-slate-400 mt-1">Manage API tokens for external integrations</p>
        </div>
        <Button onClick={generateNewToken} className="gap-2 bg-cyan-600 hover:bg-cyan-700">
          <Plus className="h-4 w-4" />
          Generate Token
        </Button>
      </div>

      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-950 hover:bg-slate-950">
                <TableHead className="text-slate-300">Token ID</TableHead>
                <TableHead className="text-slate-300">User</TableHead>
                <TableHead className="text-slate-300">Scope</TableHead>
                <TableHead className="text-slate-300">Expires</TableHead>
                <TableHead className="text-slate-300">Last Used</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id} className="border-slate-800">
                  <TableCell className="font-mono text-xs text-slate-400">
                    {token.token_hash.substring(0, 20)}...
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-300">{token.user_id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                      {token.scope}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {new Date(token.expires_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {token.last_used ? new Date(token.last_used).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={token.revoked ? "destructive" : "default"}>
                      {token.revoked ? "Revoked" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!token.revoked && (
                      <Button variant="ghost" size="sm" className="gap-2 text-red-400 hover:text-red-300">
                        <Ban className="h-4 w-4" />
                        Revoke
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={showNewToken} onOpenChange={setShowNewToken}>
        <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">New API Token Generated</DialogTitle>
            <DialogDescription className="text-slate-400">
              Copy this token now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-sm text-slate-200 break-all">
              {newToken}
            </div>
            <Button onClick={copyToken} className="w-full gap-2 bg-cyan-600 hover:bg-cyan-700">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Token"}
            </Button>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-400">
                Store this token securely. It provides access to your analysis data and literature database.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
