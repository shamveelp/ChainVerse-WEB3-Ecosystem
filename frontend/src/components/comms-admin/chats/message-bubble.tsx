"use client"

import { Smile } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  sender: "admin" | "user"
  senderName: string
  senderAvatar: string
  content: string
  timestamp: string
  reactions: { emoji: string; count: number; userReacted: boolean }[]
}

interface MessageBubbleProps {
  message: Message
  onReactionClick: () => void
}

export default function MessageBubble({ message, onReactionClick }: MessageBubbleProps) {
  const isAdmin = message.sender === "admin"

  return (
    <div className={cn("flex gap-3 group", isAdmin ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0",
          isAdmin ? "bg-primary/20" : "bg-muted",
        )}
      >
        {message.senderAvatar}
      </div>

      {/* Message Content */}
      <div className={cn("flex flex-col gap-1", isAdmin ? "items-end" : "items-start")}>
        {/* Sender Info */}
        <div className={cn("flex gap-2 text-xs", isAdmin ? "flex-row-reverse" : "flex-row")}>
          <span className="font-semibold text-foreground">{message.senderName}</span>
          <span className="text-muted-foreground">{message.timestamp}</span>
        </div>

        {/* Message Bubble */}
        <div
          className={cn(
            "px-4 py-2 rounded-2xl max-w-xs break-words",
            isAdmin ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none",
          )}
        >
          <p className="text-sm">{message.content}</p>
        </div>

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={onReactionClick}
                className={cn(
                  "px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors",
                  reaction.userReacted ? "bg-primary/20 text-primary" : "bg-muted hover:bg-muted/80",
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="font-medium">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Reaction Button */}
        <button
          onClick={onReactionClick}
          className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 p-1 hover:bg-muted rounded-full"
          title="Add reaction"
        >
          <Smile size={16} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}
