"use client"
import { useEffect, ReactNode } from "react"
import { useAuthStore } from "@/stores/user-auth-store"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return <>{children}</>
}