"use client"

import { useRouter, useSearchParams } from "next/navigation"

interface PillNavigationProps {
  activeView: "community" | "chats" | "chaincast"
  onViewChange: (view: "community" | "chats" | "chaincast") => void
}

import { Home, MessageCircle, Video } from "lucide-react"

export function PillNavigation({ activeView, onViewChange }: PillNavigationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleViewChange = (view: "community" | "chats" | "chaincast") => {
    onViewChange(view)
    // Create new URL with updated tab parameter
    const newSearchParams = new URLSearchParams(searchParams)

    let tabValue = "channel";
    if (view === "chats") tabValue = "group";
    else if (view === "chaincast") tabValue = "chaincast";

    newSearchParams.set("tab", tabValue)
    // Update URL without reloading
    router.push(`?${newSearchParams.toString()}`, { scroll: false })
  }

  return (
    <div className="bg-slate-950 border-b border-slate-700/50 px-4 py-3 flex justify-center flex-shrink-0">
      <div className="flex gap-2 bg-slate-900/50 rounded-full p-1 overflow-x-auto no-scrollbar">
        {/* Community Pill */}
        <button
          onClick={() => handleViewChange("community")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 font-medium text-sm whitespace-nowrap ${activeView === "community"
              ? "bg-cyan-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
            }`}
        >
          <Home size={18} />
          <span>Community</span>
        </button>

        {/* Community Chats Pill */}
        <button
          onClick={() => handleViewChange("chats")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 font-medium text-sm whitespace-nowrap ${activeView === "chats"
              ? "bg-cyan-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
            }`}
        >
          <MessageCircle size={18} />
          <span>Community Chats</span>
        </button>

        {/* ChainCast Pill */}
        <button
          onClick={() => handleViewChange("chaincast")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 font-medium text-sm whitespace-nowrap ${activeView === "chaincast"
              ? "bg-red-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
            }`}
        >
          <Video size={18} />
          <span>ChainCast</span>
        </button>
      </div>
    </div>
  )
}