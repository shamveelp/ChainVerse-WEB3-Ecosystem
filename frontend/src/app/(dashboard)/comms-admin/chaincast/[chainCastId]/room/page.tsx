"use client"

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import {
  communityAdminChainCastApiService
} from '@/services/chainCast/communityAdminChainCastApiService'
import type { ChainCast } from '@/types/comms-admin/chaincast.types'
import ChainCastRoom from '@/components/chainCast/chainCastRoom'
import { toast } from 'sonner'
import { Loader2, AlertCircle } from 'lucide-react'

interface AdminChainCastRoomPageProps {
  params: Promise<{
    chainCastId: string
  }>
}

export default function AdminChainCastRoomPage({ params }: AdminChainCastRoomPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { chainCastId } = resolvedParams

  const currentAdmin = useSelector((state: RootState) => state.communityAdminAuth?.communityAdmin)
  const isAuthenticated = useSelector((state: RootState) => state.communityAdminAuth?.isAuthenticated)

  const [chainCast, setChainCast] = useState<ChainCast | null>(null)
  const [loading, setLoading] = useState(true)
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

        const chainCastData = await communityAdminChainCastApiService.getChainCast(chainCastId)

        // Convert to match ChainCast interface expected by ChainCastRoom
        const adaptedChainCast = {
          ...chainCastData,
          userRole: 'admin', // Community admin is always admin in the chaincast
          canJoin: true,
          canModerate: true,
          isParticipant: true,
          // Ensure admin has all permissions
          permissions: {
            canStream: true,
            canModerate: true,
            canReact: true,
            canChat: true
          },
          // Admin stream settings
          streamData: {
            hasVideo: true,
            hasAudio: true,
            isMuted: false,
            isVideoOff: false
          }
        }

        setChainCast(adaptedChainCast as any)

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

  // Handle leave (admin leaves but chaincast continues)
  const handleLeave = async () => {
    try {
      toast.success('Left ChainCast (still running)')
      router.push('/comms-admin/chaincast')
    } catch (error: any) {
      console.error('Failed to leave ChainCast:', error)
      toast.error('Failed to leave ChainCast')
      // Navigate back anyway
      router.push('/comms-admin/chaincast')
    }
  }

  // Handle hang up (admin ends the chaincast for everyone)
  const handleHangUp = async () => {
    try {
      if (chainCast?.status === 'live') {
        await communityAdminChainCastApiService.endChainCast(chainCastId)
        toast.success('ChainCast ended successfully')
      }

      router.push('/comms-admin/chaincast')
    } catch (error: any) {
      console.error('Failed to end ChainCast:', error)
      toast.error('Failed to end ChainCast')
      // Navigate back anyway
      router.push('/comms-admin/chaincast')
    }
  }

  // Show loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto" />
          <p className="text-white text-lg">Loading ChainCast Room...</p>
        </div>
      </div>
    )
  }

  // Show error or not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-white">Authentication Required</h1>
          <p className="text-slate-400">You need to be logged in as a community admin.</p>
        </div>
      </div>
    )
  }

  if (error || !chainCast) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold text-white">ChainCast Not Found</h1>
          <p className="text-slate-400">{error || 'This ChainCast may have ended or been removed.'}</p>
          <button
            onClick={() => router.push('/comms-admin/chaincast')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Back to ChainCasts
          </button>
        </div>
      </div>
    )
  }

  return <ChainCastRoom chainCast={chainCast} onLeave={handleLeave} onHangUp={handleHangUp} />
}