"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"

interface Message {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: string
  isCurrentUser: boolean
}

const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    author: "Sarah Admin",
    avatar: "👩‍💼",
    content: "Hey everyone! How is everyone doing today?",
    timestamp: "10:30 AM",
    isCurrentUser: false,
  },
  {
    id: "2",
    author: "You",
    avatar: "👤",
    content: "Hi Sarah! Doing great, thanks for asking!",
    timestamp: "10:32 AM",
    isCurrentUser: true,
  },
  {
    id: "3",
    author: "John Developer",
    avatar: "👨‍💻",
    content: "Just finished the new feature implementation",
    timestamp: "10:35 AM",
    isCurrentUser: false,
  },
  {
    id: "4",
    author: "You",
    avatar: "👤",
    content: "That sounds awesome! Can't wait to see it in action.",
    timestamp: "10:36 AM",
    isCurrentUser: true,
  },
  {
    id: "5",
    author: "Emma Designer",
    avatar: "🎨",
    content: "The UI looks fantastic! Great work on the design system.",
    timestamp: "10:40 AM",
    isCurrentUser: false,
  },
  {
    id: "6",
    author: "You",
    avatar: "👤",
    content: "Thanks Emma! Let's sync up tomorrow to discuss the next phase.",
    timestamp: "10:42 AM",
    isCurrentUser: true,
  },
]

export function CommunityChatsView() {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES)
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: String(messages.length + 1),
        author: "You",
        avatar: "👤",
        content: inputValue,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isCurrentUser: true,
      }
      setMessages([...messages, newMessage])
      setInputValue("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold text-foreground">Community Chat</h2>
        <p className="text-sm text-muted-foreground">Everyone can chat here</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
            {/* Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
              {message.avatar}
            </div>

            {/* Message Bubble */}
            <div className={`flex flex-col ${message.isCurrentUser ? "items-end" : "items-start"}`}>
              <div className="flex items-baseline gap-2 px-3">
                <span className="font-semibold text-foreground text-xs">{message.author}</span>
                <span className="text-xs text-muted-foreground">{message.timestamp}</span>
              </div>
              <div
                className={`mt-1 px-3 py-2 rounded-lg max-w-xs break-words ${
                  message.isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-card border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-lg bg-muted text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
