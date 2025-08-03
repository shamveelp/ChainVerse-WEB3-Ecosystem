"use client"
import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext" // Changed import to useAuth
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: ReactNode
  requireAuth?: boolean
  requireGuest?: boolean
  redirectTo?: string
}

export function AuthGuard({ children, requireAuth = false, requireGuest = false, redirectTo }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth() // Uses the useAuth hook
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push(redirectTo || "/user/login")
        return
      }
      if (requireGuest && isAuthenticated) {
        router.push(redirectTo || "/")
        return
      }
    }
  }, [isLoading, isAuthenticated, requireAuth, requireGuest, redirectTo, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return null // Will redirect
  }
  if (requireGuest && isAuthenticated) {
    return null // Will redirect
  }

  return <>{children}</>
}
