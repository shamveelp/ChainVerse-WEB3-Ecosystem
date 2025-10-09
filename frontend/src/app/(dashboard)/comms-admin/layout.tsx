"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { Sidebar } from '@/components/comms-admin/sidebar'
import { Navbar } from '@/components/comms-admin/navbar'
import type { RootState } from '@/redux/store'
import { COMMUNITY_ADMIN_ROUTES } from '@/routes'

export default function CommunityAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-600/5 to-red-800/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-red-500/3 to-red-700/3 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Layout */}
      <div className="relative z-10 flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}