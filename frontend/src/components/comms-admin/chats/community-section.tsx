"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import MessageBubble from "@/components/comms-admin/chats/message-bubble"
import ReactionPicker from "@/components/comms-admin/chats/reaction-picker"
import { mockCommunityMessages } from "@/lib/mock-data/mock-data"

interface Message {
  id: string
  sender: "admin" | "user"
  senderName: string
  senderAvatar: string
  content: string
  timestamp: string
  reactions: { emoji: string; count: number; userReacted: boolean }[]
}

export default function CommunitySection() {
  const [messages, setMessages] = useState<Message[]>(mockCommunityMessages)
  const [newMessage, setNewMessage] = useState("")
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      sender: "admin",
      senderName: "Admin",
      senderAvatar: "👨‍💼",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      reactions: [],
    }

    setMessages([...messages, message])
    setNewMessage("")
  }

  const handleAddReaction = (messageId: string, emoji: string) => {
    setMessages(
      messages.map((msg) => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions.find((r) => r.emoji === emoji)
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions.map((r) =>
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.userReacted ? r.count - 1 : r.count + 1,
                      userReacted: !r.userReacted,
                    }
                  : r,
              ),
            }
          } else {
            return {
              ...msg,
              reactions: [...msg.reactions, { emoji, count: 1, userReacted: true }],
            }
          }
        }
        return msg
      }),
    )
    setShowReactionPicker(null)
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-4">
        <h2 className="text-xl font-bold text-foreground">Community</h2>
        <p className="text-sm text-muted-foreground">Channel • Admin only messaging</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="group">
            <MessageBubble message={message} onReactionClick={() => setShowReactionPicker(message.id)} />
            {showReactionPicker === message.id && (
              <div className="mt-2 ml-auto w-fit">
                <ReactionPicker
                  onSelectReaction={(emoji) => handleAddReaction(message.id, emoji)}
                  onClose={() => setShowReactionPicker(null)}
                />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Admin Only */}
      <div className="border-t border-border px-4 py-4 bg-card">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSendMessage()
            }}
            placeholder="Send a message to the community..."
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="icon"
            className="bg-primary hover:bg-primary/90"
          >
            <Send size={18} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">✓ Admin messaging enabled</p>
      </div>
    </div>
  )
}
