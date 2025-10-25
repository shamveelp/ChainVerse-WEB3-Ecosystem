"use client"

import { useState } from "react"
import { CommunityView } from "@/components/community/chat/community-view"
import { CommunityChatsView } from "@/components/community/chat/community-chats-view"
import { PillNavigation } from "@/components/community/chat/pill-navigation"

type ViewType = "community" | "chats"

export default function CommunityPage() {
  const [activeView, setActiveView] = useState<ViewType>("community")

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Pill Navigation */}
      <PillNavigation activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content Area - Full Screen */}
      <div className="flex-1 overflow-hidden relative">
        {/* Community View */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            activeView === "community" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <CommunityView />
        </div>

        {/* Community Chats View */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            activeView === "chats" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <CommunityChatsView />
        </div>
      </div>
    </div>
  )
}
