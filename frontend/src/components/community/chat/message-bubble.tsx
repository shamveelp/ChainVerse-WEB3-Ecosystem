"use client"

interface MessageBubbleProps {
  content: string
  isCurrentUser: boolean
  timestamp: string
  senderName: string
  isEdited?: boolean
  className?: string
}

export function MessageBubble({ 
  content, 
  isCurrentUser, 
  timestamp, 
  senderName, 
  isEdited = false,
  className = "" 
}: MessageBubbleProps) {
  return (
    <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"} ${className}`}>
      <div className={`flex items-baseline gap-2 px-3 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
        <span className="font-semibold text-white text-xs">
          {isCurrentUser ? "You" : senderName}
        </span>
        <span className="text-xs text-slate-500">
          {timestamp}
        </span>
        {isEdited && (
          <span className="text-xs text-slate-500">(edited)</span>
        )}
      </div>
      <div
        className={`mt-1 px-3 py-2 rounded-lg max-w-xs break-words ${
          isCurrentUser 
            ? "bg-cyan-600 text-white rounded-br-none" 
            : "bg-slate-800 text-slate-200 rounded-bl-none"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}