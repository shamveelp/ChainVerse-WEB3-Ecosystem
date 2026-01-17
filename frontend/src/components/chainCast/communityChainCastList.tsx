"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Video,
  Users,
  Eye,
  Clock,
  Play,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import {
  userChainCastApiService,
  type ChainCast,
  type ChainCastsResponse
} from '@/services/chainCast/userChainCastApiService'

interface CommunityChainCastListProps {
  communityId: string
  communityUsername: string
  className?: string
  showHeader?: boolean
  maxItems?: number
}

export default function CommunityChainCastList({
  communityId,
  communityUsername,
  className = '',
  showHeader = true,
  maxItems = 5
}: CommunityChainCastListProps) {
  const router = useRouter()

  // State
  const [chainCasts, setChainCasts] = useState<ChainCast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'live' | 'scheduled'>('all')

  // Load community ChainCasts
  const loadChainCasts = async (filterType: 'all' | 'live' | 'scheduled' = 'all') => {
    try {
      setLoading(true)
      setError(null)

      const response: ChainCastsResponse = await userChainCastApiService.getCommunityChainCasts(
        communityId,
        filterType,
        undefined,
        maxItems
      )

      setChainCasts(response.chainCasts)

    } catch (err: unknown) {
      console.error('Failed to load community ChainCasts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load ChainCasts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (communityId) {
      loadChainCasts(filter)
    }
  }, [communityId, filter])

  // Handle ChainCast click
  const handleChainCastClick = (chainCast: ChainCast) => {
    if (chainCast.status === 'live' && chainCast.canJoin) {
      router.push(`/user/chaincast/${chainCast._id}`)
    } else if (chainCast.status === 'scheduled') {
      toast.info('ChainCast is scheduled', {
        description: chainCast.scheduledStartTime
          ? `Starts ${userChainCastApiService.formatDateTime(chainCast.scheduledStartTime)}`
          : 'Check back later'
      })
    } else {
      toast.info('ChainCast is not available')
    }
  }

  // Handle join ChainCast
  const handleJoinChainCast = async (e: React.MouseEvent, chainCast: ChainCast) => {
    e.stopPropagation()

    if (chainCast.status === 'live' && chainCast.canJoin) {
      router.push(`/user/chaincast/${chainCast._id}`)
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const colors = userChainCastApiService.getStatusColor(status)
    return (
      <Badge className={`${colors.bg} ${colors.text} ${colors.border} text-xs border`}>
        {status === 'live' && <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card className={`bg-slate-900/50 backdrop-blur-sm border-slate-700/50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`bg-slate-900/50 backdrop-blur-sm border-slate-700/50 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center py-8 space-y-3">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-slate-400">{error}</p>
            <Button
              onClick={() => loadChainCasts(filter)}
              variant="outline"
              size="sm"
              className="border-slate-600 hover:bg-slate-800"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (chainCasts.length === 0) {
    return (
      <Card className={`bg-slate-900/50 backdrop-blur-sm border-slate-700/50 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center py-8 space-y-3">
            <Video className="h-12 w-12 text-slate-600 mx-auto" />
            <p className="text-slate-400">No ChainCasts available</p>
            <p className="text-slate-500 text-sm">Check back later for live streams</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-slate-900/50 backdrop-blur-sm border-slate-700/50 ${className}`}>
      {showHeader && (
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Video className="h-5 w-5 text-red-400" />
              ChainCasts
            </h3>
            {chainCasts.length >= maxItems && (
              <Button
                onClick={() => router.push(`/user/community/c/${communityUsername}/chaincasts`)}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                View All
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'live', label: 'Live' },
              { id: 'scheduled', label: 'Scheduled' }
            ].map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setFilter(tab.id as 'all' | 'live' | 'scheduled')}
                variant={filter === tab.id ? "secondary" : "ghost"}
                size="sm"
                className={`flex-1 text-xs ${filter === tab.id
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                  }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <CardContent className="p-0">
        <ScrollArea className="max-h-96">
          <div className="space-y-0">
            {chainCasts.map((chainCast, index) => (
              <div
                key={chainCast._id}
                className={`p-4 hover:bg-slate-800/30 transition-colors cursor-pointer ${index !== chainCasts.length - 1 ? 'border-b border-slate-800/50' : ''
                  }`}
                onClick={() => handleChainCastClick(chainCast)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <Video className="h-6 w-6 text-white" />
                    </div>
                    {chainCast.status === 'live' && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white truncate">{chainCast.title}</h4>
                      {getStatusBadge(chainCast.status)}
                    </div>

                    {chainCast.description && (
                      <p className="text-sm text-slate-400 mb-2 line-clamp-1">{chainCast.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{chainCast.currentParticipants}/{chainCast.maxParticipants}</span>
                      </div>

                      {chainCast.stats.totalViews > 0 && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{userChainCastApiService.formatViewerCount(chainCast.stats.totalViews)}</span>
                        </div>
                      )}

                      {chainCast.scheduledStartTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{userChainCastApiService.formatTime(chainCast.scheduledStartTime)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <span>by {chainCast.admin.name}</span>
                      </div>

                      {chainCast.status === 'live' && chainCast.canJoin && (
                        <Button
                          onClick={(e) => handleJoinChainCast(e, chainCast)}
                          size="sm"
                          className="ml-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Join
                        </Button>
                      )}

                      {chainCast.status === 'scheduled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-auto border-blue-600/50 text-blue-400 hover:bg-blue-600/20 text-xs"
                          disabled
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Scheduled
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}