import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { I18nProvider } from "@/lib/i18n/i18n-provider"
import { AppHeader } from "@/components/rungait/app-header"

export const metadata: Metadata = {
  title: "Running Gait Analysis",
  description: "Clinical-grade running gait analysis and biomechanical assessment",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-[#0B0F12] text-slate-100">
        <I18nProvider>
          <AuthProvider>
            <AppHeader />
            <main className="min-h-screen">{children}</main>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
