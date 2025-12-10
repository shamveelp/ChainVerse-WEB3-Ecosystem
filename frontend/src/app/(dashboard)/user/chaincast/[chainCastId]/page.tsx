"use client"

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Users,
  Eye,
  Clock,
  Loader2,
  AlertCircle,
  Lock,
  UserX
} from 'lucide-react'
import { RootState } from '@/redux/store'
import { toast } from 'sonner'
import ChainCastRoom from '@/components/chainCast/chainCastRoom'
import {
  userChainCastApiService,
  type ChainCast,
  type CanJoinResponse
} from '@/services/chainCast/userChainCastApiService'
import { USER_ROUTES } from '@/routes'

interface ChainCastPageProps {
  params: Promise<{
    chainCastId: string
  }>
}

export default function ChainCastPage({ params }: ChainCastPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { chainCastId } = resolvedParams

  const currentUser = useSelector((state: RootState) => state.userAuth?.user)
  const isAuthenticated = useSelector((state: RootState) => state.userAuth?.isAuthenticated)

  // State
  const [chainCast, setChainCast] = useState<ChainCast | null>(null)
  const [canJoinData, setCanJoinData] = useState<CanJoinResponse>({ canJoin: false })
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load ChainCast data
  useEffect(() => {
    const loadChainCast = async () => {
      if (!chainCastId || !isAuthenticated) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch ChainCast details
        const chainCastData = await userChainCastApiService.getChainCast(chainCastId)

        // Adapt for user with proper role settings
        const adaptedChainCast = {
          ...chainCastData,
          userRole: chainCastData.isParticipant ? 'participant' : 'viewer',
          canJoin: true,
          canModerate: false, // Regular users start without moderation powers
          isParticipant: chainCastData.isParticipant || false,
          // User permissions - limited by default
          permissions: {
            canStream: false, // Users need to request this
            canModerate: false,
            canReact: true,
            canChat: true
          },
          // User stream settings
          streamData: {
            hasVideo: false,
            hasAudio: true,
            isMuted: false,
            isVideoOff: true
          }
        }

        setChainCast(adaptedChainCast as any)

        // Check if user is already a participant
        if (chainCastData.isParticipant) {
          setHasJoined(true)
          setCanJoinData({ canJoin: true })
        } else {
          // Check if user can join
          const joinPermissions = await userChainCastApiService.canJoinChainCast(chainCastId)
          setCanJoinData(joinPermissions)
        }

      } catch (err: any) {
        console.error('Failed to load ChainCast:', err)
        setError(err.message || 'Failed to load ChainCast')
        toast.error('Failed to load ChainCast', {
          description: err.message || 'Please try again'
        })
      } finally {
        setLoading(false)
      }
    }

    loadChainCast()
  }, [chainCastId, isAuthenticated])

  // Handle join ChainCast
  const handleJoin = async () => {
    if (!chainCast || !currentUser) return

    try {
      setJoining(true)

      const result = await userChainCastApiService.joinChainCast({
        chainCastId: chainCast._id,
        quality: 'medium'
      })

      if (result.success) {
        setHasJoined(true)
        // Update chainCast to reflect participation
        setChainCast((prev: any) => prev ? {
          ...prev,
          isParticipant: true,
          userRole: 'participant'
        } : null)
        toast.success(result.message)
      }

    } catch (error: any) {
      console.error('Join ChainCast error:', error)
      toast.error('Failed to join ChainCast', {
        description: error.message || 'Please try again'
      })
    } finally {
      setJoining(false)
    }
  }

  // Handle leave ChainCast
  const handleLeave = async () => {
    if (!chainCast) return

    try {
      await userChainCastApiService.leaveChainCast(chainCast._id)
      toast.success('Left ChainCast successfully')
      router.back()
    } catch (error: any) {
      console.error('Leave ChainCast error:', error)
      toast.error('Failed to leave ChainCast')
      // Navigate back anyway
      router.back()
    }
  }

  // Handle back navigation
  const handleBack = () => {
    router.back()
  }

  // Show loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto" />
          <p className="text-white text-lg">Loading ChainCast...</p>
        </div>
      </div>
    )
  }

  // Show error or not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-700/50 p-8 max-w-md mx-auto">
          <div className="text-center space-y-4">
            <Lock className="h-16 w-16 text-slate-400 mx-auto" />
            <h1 className="text-xl font-bold text-white">Authentication Required</h1>
            <p className="text-slate-400">You need to be logged in to join ChainCasts.</p>
            <Button
              onClick={() => router.push(USER_ROUTES.LOGIN)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
            >
              Login
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !chainCast) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Card className="bg-slate-900/50 border-slate-700/50 p-8 max-w-md mx-auto">
          <div className="text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="text-xl font-bold text-white">ChainCast Not Found</h1>
            <p className="text-slate-400">{error || 'This ChainCast may have ended or been removed.'}</p>
            <div className="flex gap-3">
              <Button
                onClick={handleBack}
                variant="outline"
                className="border-slate-600 hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
              >
                Retry
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // If user has joined, show the ChainCast room
  if (hasJoined) {
    return <ChainCastRoom chainCast={chainCast} onLeave={handleLeave} />
  }

  // Show ChainCast preview and join interface
  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-red-900/20 to-pink-900/20" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 max-w-2xl w-full p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{chainCast.title}</h1>
                <Badge className={`${chainCast.status === 'live'
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : chainCast.status === 'scheduled'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  } border`}>
                  {chainCast.status === 'live' && <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse" />}
                  {chainCast.status.toUpperCase()}
                </Badge>
              </div>

              {chainCast.description && (
                <p className="text-slate-300 mb-4">{chainCast.description}</p>
              )}

              <div className="flex items-center gap-6 text-slate-400 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{chainCast.currentParticipants}/{chainCast.maxParticipants} participants</span>
                </div>

                {chainCast.stats.totalViews > 0 && (
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{userChainCastApiService.formatViewerCount(chainCast.stats.totalViews)} views</span>
                  </div>
                )}

                {chainCast.scheduledStartTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{userChainCastApiService.formatTime(chainCast.scheduledStartTime)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Info */}
          <CardContent className="bg-slate-800/30 rounded-lg p-4 mb-6">
            <h3 className="text-white font-medium mb-2">Hosted by</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{chainCast.admin.name[0]}</span>
              </div>
              <div>
                <p className="text-white font-medium">{chainCast.admin.name}</p>
                <p className="text-slate-400 text-sm">Community Admin</p>
              </div>
            </div>
          </CardContent>

          {/* ChainCast Settings */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Features</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Reactions</span>
                  <span className={chainCast.settings.allowReactions ? 'text-green-400' : 'text-red-400'}>
                    {chainCast.settings.allowReactions ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Chat</span>
                  <span className={chainCast.settings.allowChat ? 'text-green-400' : 'text-red-400'}>
                    {chainCast.settings.allowChat ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Moderation</span>
                  <span className={chainCast.settings.moderationRequired ? 'text-yellow-400' : 'text-green-400'}>
                    {chainCast.settings.moderationRequired ? 'Required' : 'Open'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Stats</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Peak Viewers</span>
                  <span className="text-white">{chainCast.stats.peakViewers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Reactions</span>
                  <span className="text-white">{chainCast.stats.totalReactions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Avg. Watch Time</span>
                  <span className="text-white">{Math.round(chainCast.stats.averageWatchTime)}s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Join Action */}
          <div className="space-y-4">
            {chainCast.status === 'live' ? (
              canJoinData.canJoin ? (
                <Button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-6 text-lg"
                >
                  {joining ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 bg-red-400 rounded-full mr-2 animate-pulse" />
                  )}
                  {joining ? 'Joining...' : 'Join Live ChainCast'}
                </Button>
              ) : (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <UserX className="h-5 w-5 text-red-400" />
                    <div>
                      <p className="text-red-400 font-medium">Cannot Join ChainCast</p>
                      <p className="text-slate-400 text-sm">{canJoinData.reason || 'Access denied'}</p>
                    </div>
                  </div>
                </div>
              )
            ) : chainCast.status === 'scheduled' ? (
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-blue-400 font-medium">ChainCast Scheduled</p>
                    <p className="text-slate-400 text-sm">
                      Starts {chainCast.scheduledStartTime ? userChainCastApiService.formatDateTime(chainCast.scheduledStartTime) : 'soon'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-500/20 border border-gray-500/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-gray-400 font-medium">ChainCast Ended</p>
                    <p className="text-slate-400 text-sm">This ChainCast has ended</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleBack}
              variant="outline"
              className="w-full border-slate-600 hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Community
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}