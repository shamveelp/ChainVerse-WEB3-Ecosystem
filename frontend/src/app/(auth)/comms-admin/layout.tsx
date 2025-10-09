"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store'
import { COMMUNITY_ADMIN_ROUTES } from '@/routes'

export default function CommunityAdminAuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
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