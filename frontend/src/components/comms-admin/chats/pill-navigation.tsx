"use client"

import { Home, MessageCircle } from "lucide-react"

interface PillNavigationProps {
  activeView: "community" | "chats"
  onViewChange: (view: "community" | "chats") => void
}

export default function PillNavigation({ activeView, onViewChange }: PillNavigationProps) {
  return (
    <div className="bg-slate-950 border-b border-slate-700/50 px-4 py-3 flex justify-center flex-shrink-0">
      <div className="flex gap-2 bg-slate-900/50 rounded-full p-1">
        {/* Community Pill */}
        <button
          onClick={() => onViewChange("community")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 font-medium text-sm ${
            activeView === "community"
              ? "bg-cyan-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
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
              ? "bg-cyan-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <MessageCircle size={18} />
          <span>Community Chats</span>
        </button>
      </div>
    </div>
  )
}