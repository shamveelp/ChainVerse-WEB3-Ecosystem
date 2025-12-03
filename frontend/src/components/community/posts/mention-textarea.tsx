"use client"

import { useState, useRef, useEffect } from 'react'
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'
import { cn } from "@/lib/utils"
import { communityApiService } from '@/services/communityApiService'
import { postsApiService } from '@/services/postsApiService'

interface User {
  _id: string;
  username: string;
  name: string;
  profilePic: string;
  isVerified: boolean;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  disabled?: boolean;
}

export default function MentionTextarea({
  value,
  onChange,
  placeholder = "Write a comment...",
  className,
  maxLength = 1000,
  disabled = false
}: MentionTextareaProps) {
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionUsers, setMentionUsers] = useState<User[]>([])
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 })
  const [isSearching, setIsSearching] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mentionStartPos = useRef(0)

  // Search for users when @ is typed
  const searchUsers = async (query: string) => {
    if (query.length < 1) {
      setMentionUsers([])
      return
    }

    setIsSearching(true)
    try {
      // You'll need to implement this API endpoint
      const response = await postsApiService.searchUsers(query, 5)
      setMentionUsers(response.users || [])
    } catch (error) {
      setMentionUsers([])
    } finally {
      setIsSearching(false)
    }
  }

  // Handle text change and detect mentions
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0
    
    onChange(newValue)

    // Check for @ mention
    const textUpToCursor = newValue.slice(0, cursorPos)
    const mentionMatch = textUpToCursor.match(/@(\w*)$/)
    
    if (mentionMatch) {
      const query = mentionMatch[1]
      mentionStartPos.current = cursorPos - mentionMatch[0].length
      setMentionQuery(query)
      setShowMentions(true)
      setSelectedMentionIndex(0)
      
      // Calculate mention dropdown position
      const textarea = textareaRef.current
      if (textarea) {
        const style = window.getComputedStyle(textarea)
        const fontSize = parseFloat(style.fontSize)
        const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2
        
        // Approximate position calculation
        const lines = textUpToCursor.split('\n').length - 1
        const lastLineLength = textUpToCursor.split('\n').pop()?.length || 0
        
        setMentionPosition({
          top: (lines * lineHeight) + lineHeight + 8,
          left: Math.min(lastLineLength * 8, textarea.offsetWidth - 250)
        })
      }
      
      searchUsers(query)
    } else {
      setShowMentions(false)
      setMentionQuery('')
      setMentionUsers([])
    }
  }

  // Handle mention selection
  const selectMention = (user: User) => {
    const beforeMention = value.slice(0, mentionStartPos.current)
    const afterMention = value.slice(textareaRef.current?.selectionStart || 0)
    const newValue = beforeMention + `@${user.username} ` + afterMention
    
    onChange(newValue)
    setShowMentions(false)
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + user.username.length + 2
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  // Handle keyboard navigation in mentions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showMentions || mentionUsers.length === 0) return

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : mentionUsers.length - 1
        )
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedMentionIndex(prev => 
          prev < mentionUsers.length - 1 ? prev + 1 : 0
        )
        break
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        if (mentionUsers[selectedMentionIndex]) {
          selectMention(mentionUsers[selectedMentionIndex])
        }
        break
      case 'Escape':
        setShowMentions(false)
        break
    }
  }

  // Close mentions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowMentions(false)
    if (showMentions) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMentions])

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "resize-none border-0 bg-transparent text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0",
          className
        )}
        maxLength={maxLength}
        disabled={disabled}
      />

      {/* Mentions Dropdown */}
      {showMentions && (
        <Card 
          className="absolute z-50 bg-slate-800 border-slate-700 shadow-xl max-w-xs w-64"
          style={{
            top: mentionPosition.top,
            left: mentionPosition.left
          }}
        >
          {isSearching ? (
            <div className="p-3 flex items-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Searching users...</span>
            </div>
          ) : mentionUsers.length > 0 ? (
            <div className="py-2">
              {mentionUsers.map((user, index) => (
                <div
                  key={user._id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors",
                    index === selectedMentionIndex 
                      ? "bg-slate-700" 
                      : "hover:bg-slate-700/50"
                  )}
                  onClick={() => selectMention(user)}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.profilePic} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs">
                      {user.name.charAt(0)?.toUpperCase() || user.username.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-white text-sm font-medium truncate">
                        {user.name}
                      </p>
                      {user.isVerified && (
                        <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs truncate">@{user.username}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : mentionQuery.length > 0 ? (
            <div className="p-3 text-slate-400 text-sm">
              No users found for "{mentionQuery}"
            </div>
          ) : (
            <div className="p-3 text-slate-400 text-sm">
              Type to search users...
            </div>
          )}
        </Card>
      )}
    </div>
  )
}