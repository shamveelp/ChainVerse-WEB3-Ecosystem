"use client"

import type React from "react"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/AuthContext" // Import AuthProvider and useAuth

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // The checkAuth is now handled within AuthProvider's useEffect
  // No need to call it directly here anymore.

  return (
    <html lang="en">
      <body className={`antialiased`}>
        <AuthProvider>
          {" "}
          {/* Wrap children with AuthProvider */}
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
