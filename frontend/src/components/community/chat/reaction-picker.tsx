"use client"

interface ReactionPickerProps {
  onSelectReaction: (emoji: string) => void
  onClose: () => void
}

const REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🔥"]

export function ReactionPicker({ onSelectReaction, onClose }: ReactionPickerProps) {
  return (
    <div className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-lg shadow-lg p-2 flex gap-1 z-50">
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelectReaction(emoji)}
          className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded transition-colors text-lg"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
