"use client"

import { Home, MessageCircle } from "lucide-react"

interface PillNavigationProps {
  activeView: "community" | "chats"
  onViewChange: (view: "community" | "chats") => void
}

export function PillNavigation({ activeView, onViewChange }: PillNavigationProps) {
  return (
    <div className="bg-background border-b border-border px-4 py-3 flex justify-center">
      <div className="flex gap-2 bg-muted rounded-full p-1">
        {/* Community Pill */}
        <button
          onClick={() => onViewChange("community")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 font-medium text-sm ${
            activeView === "community"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home size={18} />
          <span>Community</span>
        </button>

        {/* Community Chats Pill */}
        <button
          onClick={() => onViewChange("chats")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 font-medium text-sm ${
            activeView === "chats"
              ? "bg-primary text-primary-foreground shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageCircle size={18} />
          <span>Community Chats</span>
        </button>
      </div>
    </div>
  )
}
