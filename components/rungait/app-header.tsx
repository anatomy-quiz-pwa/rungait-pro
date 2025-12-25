"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LogIn, LogOut, User, Shield } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CreditsBadge } from "@/components/billing/credits-badge"

export function AppHeader() {
  const { user, userRole, login, logout } = useAuth()
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [email, setEmail] = useState("")
  const [loginStatus, setLoginStatus] = useState<string>("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!email) return
    setIsLoggingIn(true)
    const result = await login(email)
    setLoginStatus(result.message || "")
    setIsLoggingIn(false)
    if (result.success) {
      setTimeout(() => {
        setShowLoginDialog(false)
        setLoginStatus("")
        setEmail("")
      }, 1500)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#0B0F12]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0B0F12]/80">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <span className="font-semibold text-lg">Gait Analysis</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 flex-1 ml-8">
            {user && (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-slate-100">
                    Dashboard
                  </Button>
                </Link>

                <Link href="/library">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-slate-100">
                    Library
                  </Button>
                </Link>

                <Link href="/map">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-slate-100">
                    Map
                  </Button>
                </Link>

                {userRole === "admin" && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <CreditsBadge />

                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-300">{user.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="gap-2 bg-transparent">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <Button onClick={() => setShowLoginDialog(true)} className="gap-2 bg-cyan-600 hover:bg-cyan-700">
                <LogIn className="h-4 w-4" />
                Log in
              </Button>
            )}
          </div>
        </div>
      </header>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Sign in with Email</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter your email to receive a magic login link
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>
            {loginStatus && (
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-sm text-cyan-400">{loginStatus}</p>
              </div>
            )}
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn || !email}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              {isLoggingIn ? "Sending..." : "Send Login Link"}
            </Button>
            <p className="text-xs text-slate-500 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
