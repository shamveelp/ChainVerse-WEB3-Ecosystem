"use client"

import { useState, useEffect, use } from "react"
import { useSelector } from "react-redux"
import { useSearchParams } from "next/navigation"
import { RootState } from "@/redux/store"
import { CommunityView } from "@/components/community/chat/community-view"
import { CommunityChatsView } from "@/components/community/chat/community-chats-view"
import { PillNavigation } from "@/components/community/chat/pill-navigation"
import { toast } from "sonner"
import { communitySocketService } from "@/services/socket/communitySocketService"

type ViewType = "community" | "chats"

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
  const initialView = searchParams.get("tab") === "group" ? "chats" : "community"
  const [activeView, setActiveView] = useState<ViewType>(initialView)
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)
  const token = useSelector((state: RootState) => state.userAuth?.token)

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
      </div>
    </div>
  )
}