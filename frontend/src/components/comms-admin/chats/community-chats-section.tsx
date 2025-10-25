"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ChatMessageBubble from "@/components/comms-admin/chats/chat-message-bubble"
import { mockCommunityChats } from "@/lib/mock-data/mock-data"

interface ChatMessage {
  id: string
  sender: "admin" | "user"
  senderName: string
  senderAvatar: string
  content: string
  timestamp: string
}

export default function CommunityChatsSection() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockCommunityChats)
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      senderName: "You",
      senderAvatar: "👤",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }

    setMessages([...messages, message])
    setNewMessage("")

    // Simulate admin response
    setTimeout(() => {
      const adminResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "admin",
        senderName: "Admin",
        senderAvatar: "👨‍💼",
        content: "Thanks for your message! We appreciate your participation.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }
      setMessages((prev) => [...prev, adminResponse])
    }, 1000)
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-4">
        <h2 className="text-xl font-bold text-foreground">Community Chats</h2>
        <p className="text-sm text-muted-foreground">Group • Everyone can message</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border px-4 py-4 bg-card">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSendMessage()
            }}
            placeholder="Type a message..."
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
      </div>
    </div>
  )
}
