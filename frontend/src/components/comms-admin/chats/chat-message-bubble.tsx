"use client"

import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  sender: "admin" | "user"
  senderName: string
  senderAvatar: string
  content: string
  timestamp: string
}

interface ChatMessageBubbleProps {
  message: ChatMessage
}

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isAdmin = message.sender === "admin"

  return (
    <div className={cn("flex gap-3", isAdmin ? "flex-row-reverse" : "flex-row")}>
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
      </div>
    </div>
  )
}
