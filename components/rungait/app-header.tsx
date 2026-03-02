"use client"

import { Button } from "@/components/ui/button"
import { LogIn, LogOut, User, Shield, FlaskConical } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { CreditsBadge } from "@/components/billing/credits-badge"

export function AppHeader() {
  const { user, userRole, logout, syncSession, isLoading, syncError, clearSyncError } = useAuth()

  const handleLogout = async () => {
    await logout()
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

                <Link href="/upload">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-slate-100">
                    Upload
                  </Button>
                </Link>
                <Link href="/single">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-slate-100">
                    Single
                  </Button>
                </Link>
                <Link href="/lab">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-slate-100 gap-2">
                    <FlaskConical className="h-4 w-4" />
                    Lab
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
                  <span className="text-slate-300">{user.display_name || user.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 bg-transparent text-slate-300 hover:text-white">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                {syncError && (
                  <span className="text-amber-400 text-xs mr-2 hidden sm:inline max-w-[200px] truncate" title={syncError}>
                    {syncError}
                  </span>
                )}
                {isLoading && !syncError && <span className="text-slate-500 text-sm hidden sm:inline">檢查中…</span>}
                <button
                  type="button"
                  onClick={syncSession}
                  title="Google 登入後若仍顯示未登入，請點此同步 session"
                  className="text-slate-500 hover:text-slate-300 text-xs mr-2 hidden sm:inline"
                >
                  剛登入？同步
                </button>
                <Button asChild className="gap-2 bg-cyan-600 hover:bg-cyan-700">
                  <Link href="/login" onClick={clearSyncError}>
                    <LogIn className="h-4 w-4" />
                    Log in
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

    </>
  )
}
