"use client"

import { useEffect, useRef } from "react"

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"]

interface ReactionPickerProps {
  onSelectReaction: (emoji: string) => void
  onClose: () => void
}

export default function ReactionPicker({ onSelectReaction, onClose }: ReactionPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  return (
    <div ref={pickerRef} className="bg-card border border-border rounded-lg p-2 shadow-lg flex gap-1 flex-wrap w-48">
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelectReaction(emoji)}
          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
