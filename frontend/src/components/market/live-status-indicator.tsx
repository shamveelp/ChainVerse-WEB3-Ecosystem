"use client"

import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface LiveStatusIndicatorProps {
  isLive: boolean
  lastUpdate: Date | null
  className?: string
}

export function LiveStatusIndicator({ isLive, lastUpdate, className }: LiveStatusIndicatorProps) {
  const formatLastUpdate = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`
    } else {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant={isLive ? "default" : "secondary"} className="flex items-center gap-1">
        {isLive ? (
          <>
            <Wifi className="h-3 w-3" />
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            Offline
          </>
        )}
      </Badge>
      {lastUpdate && <span className="text-xs text-muted-foreground">Updated {formatLastUpdate(lastUpdate)}</span>}
    </div>
  )
}
