"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Video,
  Users,
  Loader2,
  Play,
  Eye,
  Clock,
  AlertCircle
} from "lucide-react"
import { RootState } from "@/redux/store"
import { toast } from "sonner"
import {
  userChainCastApiService,
  type ChainCast,
  type JoinChainCastRequest,
  type CanJoinResponse
} from "@/services/chainCast/userChainCastApiService"
import { chainCastSocketService } from "@/services/socket/chainCastSocketService"

interface ChainCastJoinButtonProps {
  communityId?: string
  communityUsername?: string
  className?: string
  variant?: 'button' | 'card' | 'inline'
  size?: 'sm' | 'lg' | 'default'
  showDetails?: boolean
}

export default function ChainCastJoinButton({
  communityId,
  communityUsername,
  className,
  variant = 'card',
  size = 'default',
  showDetails = true
}: ChainCastJoinButtonProps) {
  const router = useRouter()
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)
  const token = useSelector((state: RootState) => state.userAuth?.token)

  // State
  const [liveChainCast, setLiveChainCast] = useState<ChainCast | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [canJoin, setCanJoin] = useState<CanJoinResponse>({ canJoin: false })
  const [error, setError] = useState<string | null>(null)

  // Check for live ChainCasts in this community
  const checkLiveChainCasts = async () => {
    if (!communityId || !currentUser) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await userChainCastApiService.getCommunityChainCasts(
        communityId,
        'live',
        undefined,
        1
      )

      if (response.chainCasts.length > 0) {
        const liveChainCast = response.chainCasts[0]
        setLiveChainCast(liveChainCast)

        // Check if user can join
        if (!liveChainCast.isParticipant) {
          const canJoinResponse = await userChainCastApiService.canJoinChainCast(liveChainCast._id)
          setCanJoin(canJoinResponse)
        } else {
          setCanJoin({ canJoin: true })
        }
      } else {
        setLiveChainCast(null)
        setCanJoin({ canJoin: false })
      }

    } catch (error: unknown) {
      console.error('Failed to check live ChainCasts:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to check live ChainCasts'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkLiveChainCasts()

    // Set up polling to check for live ChainCasts every 30 seconds
    const interval = setInterval(checkLiveChainCasts, 30000)
    return () => clearInterval(interval)
  }, [communityId, currentUser])

  // Handle join ChainCast
  const handleJoinChainCast = async () => {
    if (!liveChainCast || !currentUser || !token) return

    try {
      setJoining(true)

      // Navigate directly to ChainCast page for joining
      router.push(`/user/chaincast/${liveChainCast._id}`)

    } catch (error: unknown) {
      console.error('Join ChainCast error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to join ChainCast'
      toast.error('Failed to join ChainCast', {
        description: errorMessage || 'Please try again'
      })
    } finally {
      setJoining(false)
    }
  }

  // Handle view ChainCast (if already participating)
  const handleViewChainCast = () => {
    if (!liveChainCast) return
    router.push(`/user/chaincast/${liveChainCast._id}`)
  }

  // Don't show anything if user is not logged in
  if (!currentUser) {
    return null
  }

  // Show loading state
  if (loading) {
    if (variant === 'button') {
      return (
        <Button
          disabled
          size={size}
          variant="outline"
          className={`border-slate-600 ${className}`}
        >
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Checking...
        </Button>
      )
    }

    return (
      <Card className={`bg-slate-800/50 border-slate-700/50 ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            <span className="text-sm text-slate-400">Checking for live streams...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show error state
  if (error) {
    if (variant === 'button') return null

    return (
      <Card className={`bg-red-500/10 border-red-500/30 ${className}`}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400">Failed to check ChainCasts</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Don't show anything if no live ChainCast
  if (!liveChainCast) {
    return null
  }

  // Button variant
  if (variant === 'button') {
    if (liveChainCast.isParticipant) {
      return (
        <Button
          onClick={handleViewChainCast}
          size={size}
          className={`bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white ${className}`}
        >
          <Eye className="h-4 w-4 mr-2" />
          View Live
        </Button>
      )
    } else if (canJoin.canJoin) {
      return (
        <Button
          onClick={handleJoinChainCast}
          disabled={joining}
          size={size}
          className={`bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white ${className}`}
        >
          {joining ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {joining ? 'Joining...' : 'Join Live'}
        </Button>
      )
    } else {
      return (
        <Button
          disabled
          size={size}
          variant="outline"
          className={`border-slate-600 text-slate-500 ${className}`}
          title={canJoin.reason || "Cannot join ChainCast"}
        >
          <Clock className="h-4 w-4 mr-2" />
          Full
        </Button>
      )
    }
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Video className="h-5 w-5 text-red-400" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div>
            <span className="font-medium text-white">{liveChainCast.title}</span>
            <Badge className="ml-2 bg-red-500/20 text-red-400 border-red-500/30 text-xs">
              LIVE
            </Badge>
          </div>
        </div>

        {liveChainCast.isParticipant ? (
          <Button
            onClick={handleViewChainCast}
            size="sm"
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        ) : canJoin.canJoin ? (
          <Button
            onClick={handleJoinChainCast}
            disabled={joining}
            size="sm"
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
          >
            {joining ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            Join
          </Button>
        ) : (
          <Button
            disabled
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-500"
            title={canJoin.reason || "Cannot join ChainCast"}
          >
            <Clock className="h-4 w-4 mr-1" />
            Full
          </Button>
        )}
      </div>
    )
  }

  // Card variant (default)
  return (
    <Card className={`bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/20 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Video className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-white truncate">{liveChainCast.title}</h4>
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                LIVE
              </Badge>
            </div>

            {showDetails && (
              <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{liveChainCast.currentParticipants}/{liveChainCast.maxParticipants}</span>
                </div>

                {liveChainCast.stats.totalViews > 0 && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{userChainCastApiService.formatViewerCount(liveChainCast.stats.totalViews)}</span>
                  </div>
                )}

                <span className="text-xs text-slate-500">by {liveChainCast.admin.name}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              {showDetails && liveChainCast.description && (
                <p className="text-sm text-slate-400 truncate flex-1 mr-3">
                  {liveChainCast.description}
                </p>
              )}

              {liveChainCast.isParticipant ? (
                <Button
                  onClick={handleViewChainCast}
                  size="sm"
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              ) : canJoin.canJoin ? (
                <Button
                  onClick={handleJoinChainCast}
                  disabled={joining}
                  size="sm"
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
                >
                  {joining ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-1" />
                  )}
                  Join
                </Button>
              ) : (
                <Button
                  disabled
                  size="sm"
                  variant="outline"
                  className="border-slate-600 text-slate-500"
                  title={canJoin.reason || "Cannot join ChainCast"}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Full
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}