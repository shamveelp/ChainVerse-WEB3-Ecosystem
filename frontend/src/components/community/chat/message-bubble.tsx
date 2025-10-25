interface MessageBubbleProps {
  author: string
  avatar: string
  content: string
  timestamp: string
  isCurrentUser?: boolean
}

export function MessageBubble({ author, avatar, content, timestamp, isCurrentUser = false }: MessageBubbleProps) {
  return (
    <div className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
        {avatar}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
        <div className="flex items-baseline gap-2 px-3">
          <span className="font-semibold text-foreground text-xs">{author}</span>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>
        <div
          className={`mt-1 px-3 py-2 rounded-lg max-w-xs break-words ${
            isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          }`}
        >
          <p className="text-sm">{content}</p>
        </div>
      </div>
    </div>
  )
}
