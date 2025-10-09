"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/redux/store"
import { COMMUNITY_ADMIN_ROUTES } from "@/routes"

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
        router.push(COMMUNITY_ADMIN_ROUTES.APPLICATION_SUBMITTED)
      } else if (applicationStatus === 'rejected') {
        router.push(COMMUNITY_ADMIN_ROUTES.GET_STARTED)
      } else {
        router.push(COMMUNITY_ADMIN_ROUTES.LOGIN)
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
      router.push(COMMUNITY_ADMIN_ROUTES.DASHBOARD)
    } else if (applicationStatus === 'pending') {
      router.push(COMMUNITY_ADMIN_ROUTES.APPLICATION_SUBMITTED)
    }
  }, [isAuthenticated, applicationStatus, router])

  if (isAuthenticated) return null // Prevent flicker

  return <>{children}</>
}

// ✅ For application flow pages
export const CommunityAdminApplicationFlow = ({ children }: Props) => {
  const router = useRouter()
  const { isAuthenticated } = useSelector((state: RootState) => state.communityAdminAuth)

  useEffect(() => {
    if (isAuthenticated) {
      router.push(COMMUNITY_ADMIN_ROUTES.DASHBOARD)
    }
  }, [isAuthenticated, router])

  if (isAuthenticated) return null

  return <>{children}</>
}