"use client"

import { useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import CommunitySection from "@/components/comms-admin/chats/community-section"
import CommunityChatsSection from "@/components/comms-admin/chats/community-chats-section"
import MobileNavigation from "@/components/comms-admin/chats/mobile-navigation"

export default function Page() {
  const [activeTab, setActiveTab] = useState<"community" | "chats">("community")
  const isMobile = useIsMobile()

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Mobile Navigation */}
      {isMobile && <MobileNavigation activeTab={activeTab} onTabChange={setActiveTab} />}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Desktop: Both sections side by side */}
        {!isMobile && (
          <>
            <div className="w-1/2 border-r border-border">
              <CommunitySection />
            </div>
            <div className="w-1/2">
              <CommunityChatsSection />
            </div>
          </>
        )}

        {/* Mobile: Single section based on active tab */}
        {isMobile && (
          <div className="w-full">{activeTab === "community" ? <CommunitySection /> : <CommunityChatsSection />}</div>
        )}
      </div>
    </div>
  )
}
