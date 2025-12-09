"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import CommunitySection from "@/components/comms-admin/chats/community-section"
import CommunityChatsSection from "@/components/comms-admin/chats/community-chats-section"
import PillNavigation from "@/components/comms-admin/chats/pill-navigation"
import { toast } from "sonner"
import { communitySocketService } from "@/services/socket/communitySocketService"
import { useCommunityAdminAuth } from "@/hooks/communityAdmin/useAuthCheck"
import { Loader2 } from "lucide-react"

type ViewType = "community" | "chats"

export default function Page() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')

  // Determine active view based on URL parameter
  const activeView: ViewType = tab === 'group' ? 'chats' : 'community'

  const { isReady, isAuthenticated, admin: currentAdmin, token, loading: authLoading } = useCommunityAdminAuth()

  // Handle view changes by updating URL
  const handleViewChange = (view: ViewType) => {
    const newTab = view === 'chats' ? 'group' : 'channel'
    router.push(`${pathname}?tab=${newTab}`)
  }

  // Connect to community socket when component mounts and auth is ready
  useEffect(() => {
    if (!isReady || !isAuthenticated || !token) return

    const connectSocket = async () => {
      try {
        await communitySocketService.connect(token)
      } catch (error: any) {
        console.error('Failed to connect to community socket:', error)
        toast.error('Connection Error', {
          description: 'Failed to connect to real-time messaging'
        })
      }
    }

    connectSocket()

    // Cleanup on unmount or auth changes
    return () => {
      communitySocketService.disconnect()
    }
  }, [isReady, isAuthenticated, token])

  // Show loading while authentication is being checked
  if (!isReady || authLoading) {
    return (
      <div className="flex min-h-screen bg-slate-950 items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
          <p className="text-slate-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show error if not authenticated
  if (!isAuthenticated || !currentAdmin || !token) {
    return (
      <div className="flex min-h-screen bg-slate-950 items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl font-semibold text-white">Authentication Required</p>
          <p className="text-slate-400">Please log in as a community admin to access this page.</p>
          <p className="text-xs text-slate-500">
            Ready: {isReady ? '✓' : '✗'} | Auth: {isAuthenticated ? '✓' : '✗'} | Token: {token ? '✓' : '✗'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="h-screen flex flex-col">
          {/* Pill Navigation */}
          <PillNavigation activeView={activeView} onViewChange={handleViewChange} />

          {/* Main Content Area - Fixed Height */}
          <div className="flex-1 overflow-hidden relative">
            {/* Community View */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${activeView === "community" ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            >
              <CommunitySection />
            </div>

            {/* Community Chats View */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${activeView === "chats" ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            >
              <CommunityChatsSection />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
