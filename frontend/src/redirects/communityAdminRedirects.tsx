"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/redux/store"

type Props = {
  children: React.ReactNode
}

// ✅ Redirects to login if not authenticated
export const CommunityAdminProtectedRoute = ({ children }: Props) => {
  const router = useRouter()
  const { isAuthenticated, applicationStatus } = useSelector((state: RootState) => state.communityAdminAuth)

  useEffect(() => {
    if (!isAuthenticated) {
      if (applicationStatus === 'pending') {
        router.push("/community-admin/application-submitted")
      } else if (applicationStatus === 'rejected') {
        router.push("/community-admin/get-started")
      } else {
        router.push("/community-admin/login")
      }
    }
  }, [isAuthenticated, applicationStatus, router])

  if (!isAuthenticated) return null // Prevent flicker

  return <>{children}</>
}

// ✅ Redirects to dashboard if already logged in
export const CommunityAdminPreventLoggedIn = ({ children }: Props) => {
  const router = useRouter()
  const { isAuthenticated, applicationStatus } = useSelector((state: RootState) => state.communityAdminAuth)

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard/community-admin")
    } else if (applicationStatus === 'pending') {
      router.push("/community-admin/application-submitted")
    }
  }, [isAuthenticated, applicationStatus, router])

  if (isAuthenticated) return null // Prevent flicker

  return <>{children}</>
}

// ✅ For application flow pages
export const CommunityAdminApplicationFlow = ({ children }: Props) => {
  const router = useRouter()
  const { isAuthenticated, applicationStatus } = useSelector((state: RootState) => state.communityAdminAuth)

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard/community-admin")
    }
  }, [isAuthenticated, router])

  if (isAuthenticated) return null

  return <>{children}</>
}
