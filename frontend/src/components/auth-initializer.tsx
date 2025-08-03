"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/stores/user-auth-store"

export function AuthInitializer() {
  const checkAuth = useAuthStore((state) => state.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return null // This component doesn't render anything, it just initializes auth
}
