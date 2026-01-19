"use client"

import { useState, useEffect, use } from "react"
import { useSelector } from "react-redux"
import { useSearchParams } from "next/navigation"
import { RootState } from "@/redux/store"
import { CommunityView } from "@/components/community/chat/community-view"
import { CommunityChatsView } from "@/components/community/chat/community-chats-view"
import { PillNavigation } from "@/components/community/chat/pill-navigation"
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"
import ChainCastJoinButton from "@/components/chainCast/chainCastJoinButton"
import CommunityChainCastList from "@/components/chainCast/communityChainCastList"
import { toast } from "sonner"
import { communitySocketService } from "@/services/socket/communitySocketService"
import { communityExploreApiService, type Community } from "@/services/userCommunityServices/communityExploreApiService"

type ViewType = "community" | "chats" | "chaincasts"

interface CommunityPageProps {
  params: Promise<{
    username: string
  }>
}

export default function CommunityPage({ params }: CommunityPageProps) {
  // Resolve params using React's use hook
  const { username } = use(params)
  const searchParams = useSearchParams()

  // Initialize activeView based on tab query parameter
  const getInitialView = (): ViewType => {
    const tab = searchParams.get("tab")
    if (tab === "group") return "chats"
    if (tab === "chaincasts") return "chaincasts"
    return "community"
  }

  const [activeView, setActiveView] = useState<ViewType>(getInitialView())
  const [communityData, setCommunityData] = useState<Community | null>(null)
  const [loading, setLoading] = useState(true)

  const currentUser = useSelector((state: RootState) => state.userAuth?.user)
  const token = useSelector((state: RootState) => state.userAuth?.token)

  // Load community data
  useEffect(() => {
    const loadCommunityData = async () => {
      try {
        setLoading(true)
        const data = await communityExploreApiService.getCommunityProfile(username)
        setCommunityData(data)
      } catch (error: unknown) {
        console.error('Failed to load community data:', error)
        toast.error('Failed to load community details')
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      loadCommunityData()
    }
  }, [username])

  // Connect to community socket when component mounts
  useEffect(() => {
    if (!token) return

    const connectSocket = async () => {
      try {
        await communitySocketService.connect(token)
        console.log('Connected to community socket')
      } catch (error: unknown) {
        console.error('Failed to connect to community socket:', error)
        toast.error('Connection Error', {
          description: error instanceof Error ? error.message : 'Failed to connect to real-time messaging'
        })
      }
    }

    connectSocket()

    // Cleanup on unmount
    return () => {
      communitySocketService.disconnect()
    }
  }, [token])

  const handleViewChange = (view: ViewType) => {
    setActiveView(view)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
          <div className="h-screen flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
              <p className="text-slate-400">Loading community...</p>
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
        <div className="h-screen flex flex-col">
          {/* Enhanced Pill Navigation with ChainCasts tab */}
          <div className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{communityData?.communityName || 'Community'}</h2>
                <p className="text-slate-400">
                  {communityData?.memberCount ? `${communityData.memberCount} members` : ''}
                </p>
              </div>
            </div>

            {/* ChainCast Join Button */}
            {communityData?._id && (
              <div className="mb-4">
                <ChainCastJoinButton
                  communityId={communityData._id}
                  communityUsername={username}
                  variant="inline"
                  className="w-full"
                />
              </div>
            )}

            {/* Navigation Pills */}
            <div className="flex space-x-1 bg-slate-900/50 rounded-lg p-1">
              <button
                onClick={() => handleViewChange("community")}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeView === "community"
                    ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-400/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
              >
                Community
              </button>
              <button
                onClick={() => handleViewChange("chats")}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeView === "chats"
                    ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-400/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
              >
                Group Chat
              </button>
              <button
                onClick={() => handleViewChange("chaincasts")}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeView === "chaincasts"
                    ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-white border border-red-400/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
              >
                ChainCasts
              </button>
            </div>
          </div>

          {/* Main Content Area - Fixed Height */}
          <div className="flex-1 overflow-hidden relative">
            {/* Community View */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${activeView === "community" ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            >
              <CommunityView />
            </div>

            {/* Community Chats View */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${activeView === "chats" ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            >
              <CommunityChatsView />
            </div>

            {/* ChainCasts View */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${activeView === "chaincasts" ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
            >
              <div className="h-full overflow-y-auto p-4">
                {communityData?._id ? (
                  <CommunityChainCastList
                    communityId={communityData._id}
                    communityUsername={username}
                    showHeader={false}
                    maxItems={20}
                    className="h-full"
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-400">Loading ChainCasts...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  )
}