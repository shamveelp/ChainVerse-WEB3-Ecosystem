"use client"

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Phone, Video, MoveHorizontal as MoreHorizontal, Send, Paperclip, Smile, Image as ImageIcon } from 'lucide-react'

const conversations = [
  {
    id: '1',
    user: {
      name: 'Vitalik Buterin',
      username: 'vitalikbuterin',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
      verified: true,
      online: true
    },
    lastMessage: {
      content: 'The new EIP proposal looks promising! When can we discuss the implementation details?',
      timestamp: '2m',
      sender: 'them',
      read: false
    },
    unreadCount: 2
  },
  {
    id: '2',
    user: {
      name: 'Andre Cronje',
      username: 'andrecronje',
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100',
      verified: true,
      online: false
    },
    lastMessage: {
      content: 'Thanks for the feedback on the protocol design. I\'ll incorporate your suggestions.',
      timestamp: '1h',
      sender: 'me',
      read: true
    },
    unreadCount: 0
  },
  {
    id: '3',
    user: {
      name: 'Balaji Srinivasan',
      username: 'balajis',
      avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=100',
      verified: true,
      online: true
    },
    lastMessage: {
      content: 'Great article on decentralization! Would love to collaborate on the next piece.',
      timestamp: '3h',
      sender: 'them',
      read: true
    },
    unreadCount: 0
  },
  {
    id: '4',
    user: {
      name: 'Hayden Adams',
      username: 'haydenzadams',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100',
      verified: true,
      online: false
    },
    lastMessage: {
      content: 'The AMM improvements are ready for testing. Can you review the smart contracts?',
      timestamp: '5h',
      sender: 'them',
      read: true
    },
    unreadCount: 1
  },
  {
    id: '5',
    user: {
      name: 'NFT Artist',
      username: 'nftartist',
      avatar: 'https://images.pexels.com/photos/712513/pexels-photo-712513.jpeg?auto=compress&cs=tinysrgb&w=100',
      verified: false,
      online: true
    },
    lastMessage: {
      content: 'The new collection drop is scheduled for next week. Excited to see the community response!',
      timestamp: '1d',
      sender: 'them',
      read: true
    },
    unreadCount: 0
  }
]

const mockMessages = [
  {
    id: '1',
    sender: 'them',
    content: 'Hey! I saw your post about the new DeFi protocol. Really interesting approach to yield optimization.',
    timestamp: '10:30 AM',
    type: 'text'
  },
  {
    id: '2',
    sender: 'me',
    content: 'Thanks! I\'ve been working on it for months. The key innovation is in how we handle liquidity provisioning.',
    timestamp: '10:32 AM',
    type: 'text'
  },
  {
    id: '3',
    sender: 'them',
    content: 'That sounds fascinating. Have you considered the potential MEV implications?',
    timestamp: '10:35 AM',
    type: 'text'
  },
  {
    id: '4',
    sender: 'me',
    content: 'Actually yes, we\'ve implemented several MEV protection mechanisms. Let me share the technical documentation.',
    timestamp: '10:37 AM',
    type: 'text'
  },
  {
    id: '5',
    sender: 'me',
    content: 'protocol-docs.pdf',
    timestamp: '10:37 AM',
    type: 'file'
  },
  {
    id: '6',
    sender: 'them',
    content: 'Perfect! I\'ll review this over the weekend. The new EIP proposal looks promising too!',
    timestamp: '10:40 AM',
    type: 'text'
  },
  {
    id: '7',
    sender: 'them',
    content: 'When can we discuss the implementation details?',
    timestamp: '2m ago',
    type: 'text'
  }
]

export default function MessagesContent() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Handle sending message
      console.log('Sending message:', newMessage)
      setNewMessage('')
    }
  }

  return (
    <div className="flex h-screen">
      {/* Conversations List */}
      <div className="w-80 border-r border-slate-700/50 bg-slate-900/30">
        <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Messages</h2>
            <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="overflow-y-auto h-full">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation)}
              className={`p-4 cursor-pointer transition-colors border-b border-slate-800/30 ${
                selectedConversation.id === conversation.id
                  ? 'bg-slate-800/50'
                  : 'hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conversation.user.avatar} alt={conversation.user.name} />
                    <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
                      {conversation.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.user.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-white truncate">{conversation.user.name}</p>
                      {conversation.user.verified && (
                        <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{conversation.lastMessage.timestamp}</span>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-cyan-500 text-white h-5 min-w-[20px] text-xs rounded-full flex items-center justify-center">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className={`text-sm truncate ${
                    !conversation.lastMessage.read ? 'text-white font-medium' : 'text-slate-400'
                  }`}>
                    {conversation.lastMessage.sender === 'me' ? 'You: ' : ''}
                    {conversation.lastMessage.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && (
          <>
            {/* Chat Header */}
            <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selectedConversation.user.avatar} alt={selectedConversation.user.name} />
                      <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
                        {selectedConversation.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {selectedConversation.user.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-white">{selectedConversation.user.name}</p>
                      {selectedConversation.user.verified && (
                        <div className="w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">
                      {selectedConversation.user.online ? 'Online now' : `Last seen ${selectedConversation.lastMessage.timestamp}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {mockMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${message.sender === 'me' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        message.sender === 'me'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                          : 'bg-slate-800 text-white'
                      }`}
                    >
                      {message.type === 'file' ? (
                        <div className="flex items-center gap-2 p-2 bg-white/10 rounded-lg">
                          <Paperclip className="h-4 w-4" />
                          <span className="text-sm">{message.content}</span>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      )}
                    </div>
                    <p className={`text-xs text-slate-400 mt-1 ${
                      message.sender === 'me' ? 'text-right' : 'text-left'
                    }`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="border-t border-slate-700/50 p-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <ImageIcon className="h-5 w-5" />
                </Button>
                
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400 pr-12"
                  />
                  <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white">
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}