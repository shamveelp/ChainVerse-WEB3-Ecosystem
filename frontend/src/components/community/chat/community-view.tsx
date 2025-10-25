"use client"

import { useState } from "react"
import { ReactionPicker } from "./reaction-picker"

interface Message {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
  reactions: Record<string, number>
  isAdmin: boolean
}

const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    author: "Sarah Admin",
    avatar: "👩‍💼",
    content:
      "Welcome to our community! This is a read-only channel where we share important updates and announcements.",
    timestamp: "10:30 AM",
    reactions: { "❤️": 12, "👍": 8 },
    isAdmin: true,
  },
  {
    id: "2",
    author: "Sarah Admin",
    avatar: "👩‍💼",
    content:
      "We just launched our new feature! Check it out and let us know what you think by reacting to this message.",
    timestamp: "11:15 AM",
    reactions: { "❤️": 24, "👍": 18, "😂": 5 },
    isAdmin: true,
  },
  {
    id: "3",
    author: "Sarah Admin",
    avatar: "👩‍💼",
    content: "Reminder: Our community guidelines are in place to keep this space positive and productive for everyone.",
    timestamp: "2:45 PM",
    reactions: { "👍": 15 },
    isAdmin: true,
  },
]

export function CommunityView() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(
      messages.map((msg) => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions }
          reactions[emoji] = (reactions[emoji] || 0) + 1
          return { ...msg, reactions }
        }
        return msg
      }),
    )
    setSelectedMessageId(null)
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold text-foreground">Community Channel</h2>
        <p className="text-sm text-muted-foreground">Admin only • Read-only for members</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
              {message.avatar}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-foreground text-sm">{message.author}</span>
                <span className="text-xs text-muted-foreground">{message.timestamp}</span>
              </div>
              <p className="text-foreground text-sm mt-1 break-words">{message.content}</p>

              {/* Reactions */}
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(message.reactions).map(([emoji, count]) => (
                  <button
                    key={emoji}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors text-xs"
                    onClick={() => setSelectedMessageId(selectedMessageId === message.id ? null : message.id)}
                  >
                    <span>{emoji}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </button>
                ))}

                {/* Add Reaction Button */}
                <div className="relative">
                  <button
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted hover:bg-muted/80 transition-colors text-xs"
                    onClick={() => setSelectedMessageId(selectedMessageId === message.id ? null : message.id)}
                  >
                    +
                  </button>

                  {/* Reaction Picker */}
                  {selectedMessageId === message.id && (
                    <ReactionPicker
                      onSelectReaction={(emoji) => handleReaction(message.id, emoji)}
                      onClose={() => setSelectedMessageId(null)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Disabled Input Area */}
      <div className="bg-card border-t border-border px-4 py-3">
        <div className="flex gap-2 opacity-50 pointer-events-none">
          <input
            type="text"
            placeholder="Only admins can post in this channel"
            disabled
            className="flex-1 px-3 py-2 rounded-lg bg-muted text-foreground text-sm placeholder-muted-foreground"
          />
          <button disabled className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
