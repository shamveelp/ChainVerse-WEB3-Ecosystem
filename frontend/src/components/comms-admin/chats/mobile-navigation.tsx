"use client"

import { MessageCircle, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavigationProps {
  activeTab: "community" | "chats"
  onTabChange: (tab: "community" | "chats") => void
}

export default function MobileNavigation({ activeTab, onTabChange }: MobileNavigationProps) {
  return (
    <div className="border-b border-border bg-card px-4 py-3">
      <div className="flex gap-2">
        <button
          onClick={() => onTabChange("community")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
            activeTab === "community"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          <Home size={18} />
          <span className="text-sm font-medium">Community</span>
        </button>
        <button
          onClick={() => onTabChange("chats")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
            activeTab === "chats"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          <MessageCircle size={18} />
          <span className="text-sm font-medium">Chats</span>
        </button>
      </div>
    </div>
  )
}
