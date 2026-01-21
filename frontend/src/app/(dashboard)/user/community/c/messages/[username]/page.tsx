"use client"

import { useState, useEffect, use } from "react"
import { useSelector } from "react-redux"
import { useSearchParams } from "next/navigation"
import { RootState } from "@/redux/store"
import { CommunityView } from "@/components/community/chat/community-view"
import { CommunityChatsView } from "@/components/community/chat/community-chats-view"
import { PillNavigation } from "@/components/community/chat/pill-navigation"
import CommunityChainCastList from "@/components/chainCast/communityChainCastList"
import { toast } from "sonner"
import { communitySocketService } from "@/services/socket/communitySocketService"
import { communityApiService } from "@/services/communityApiService"
import { Loader2 } from "lucide-react"

type ViewType = "community" | "chats" | "chaincast"

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
    if (tab === "chaincast") return "chaincast"
    return "community"
  }

  const [activeView, setActiveView] = useState<ViewType>(getInitialView())
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)
  const token = useSelector((state: RootState) => state.userAuth?.token)

  const [communityId, setCommunityId] = useState<string | null>(null)
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false)

  // Fetch community details to get the ID
  useEffect(() => {
    const fetchCommunityDetails = async () => {
      if (!username) return;

      try {
        setIsLoadingCommunity(true);
        const response = await communityApiService.getCommunityProfileByUsername(username);
        if (response.data && response.data._id) {
          setCommunityId(response.data._id);
        }
      } catch (error) {
        console.error("Failed to fetch community details:", error);
        toast.error("Failed to load community details");
      } finally {
        setIsLoadingCommunity(false);
      }
    };

    fetchCommunityDetails();
  }, [username]);

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

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Pill Navigation */}
      <PillNavigation activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content Area - Full Screen */}
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

        {/* ChainCast View */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 bg-slate-950 ${activeView === "chaincast" ? "opacity-100 z-10" : "opacity-0 pointer-events-none"
            }`}
        >
          {activeView === "chaincast" && (
            <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto w-full">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Community ChainCasts</h2>
                  <p className="text-slate-400">Join live streams or watch past recordings from the community.</p>
                </div>

                {isLoadingCommunity ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                  </div>
                ) : communityId ? (
                  <CommunityChainCastList
                    communityId={communityId}
                    communityUsername={username}
                    maxItems={20}
                    className="border-slate-800 bg-slate-900/40"
                  />
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    Could not load community details.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}