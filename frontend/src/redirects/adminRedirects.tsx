"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/redux/store"

type Props = {
  children: React.ReactNode
}

// ✅ Redirects to login if not authenticated
export const AdminProtectedRoute = ({ children }: Props) => {
  const router = useRouter()
  const { isAuthenticated } = useSelector((state: RootState) => state.adminAuth)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admin/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) return null // Prevent flicker
  return <>{children}</>
}

// ✅ Redirects to dashboard if already logged in
export const AdminPreventLoggedIn = ({ children }: Props) => {
  const router = useRouter()
  const { isAuthenticated } = useSelector((state: RootState) => state.adminAuth)

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/admin")
    }
  }, [isAuthenticated, router])

  if (isAuthenticated) return null // Prevent flicker
  return <>{children}</>
}
