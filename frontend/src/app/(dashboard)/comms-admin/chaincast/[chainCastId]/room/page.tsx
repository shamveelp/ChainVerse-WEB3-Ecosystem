"use client"

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import {
  communityAdminChainCastApiService
} from '@/services/chainCast/communityAdminChainCastApiService'
import type { ChainCast } from '@/types/comms-admin/chaincast.types'
import LiveKitChainCastRoom from '@/components/chainCast/LiveKitChainCastRoom'
import { toast } from 'sonner'
import { Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface AdminChainCastRoomPageProps {
  params: Promise<{
    chainCastId: string
  }>
}

export default function AdminChainCastRoomPage({ params }: AdminChainCastRoomPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { chainCastId } = resolvedParams

  const isAuthenticated = useSelector((state: RootState) => state.communityAdminAuth?.isAuthenticated)

  const [chainCast, setChainCast] = useState<ChainCast | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load ChainCast data and Start it
  useEffect(() => {
    const startAndLoadChainCast = async () => {
      if (!chainCastId || !isAuthenticated) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // First try to start it (which now returns the LiveKit token)
        let chainCastData: ChainCast
        try {
          chainCastData = await communityAdminChainCastApiService.startChainCast(chainCastId)
        } catch (startErr: any) {
          // If already started, just get it
          console.log("ChainCast might already be started, fetching data...")
          chainCastData = await communityAdminChainCastApiService.getChainCast(chainCastId)
        }

        if (!chainCastData.livekitToken) {
          // If we don't have a token, it means the start failed or it's not live
          throw new Error("Could not obtain LiveKit token. Ensure the ChainCast is live.")
        }

        setChainCast(chainCastData)

      } catch (err: unknown) {
        console.error('Failed to load ChainCast:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load ChainCast'
        setError(errorMessage)
        toast.error('Failed to load ChainCast', {
          description: errorMessage
        })
      } finally {
        setLoading(false)
      }
    }

    startAndLoadChainCast()
  }, [chainCastId, isAuthenticated])

  // Handle leave
  const handleLeave = () => {
    router.push('/comms-admin/chaincast')
  }

  // Show loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-12 w-12 text-red-500 mx-auto" />
          </motion.div>
          <p className="text-white text-lg font-medium">Initializing Live Room...</p>
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
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all shadow-lg shadow-red-900/20"
          >
            Back to ChainCasts
          </button>
        </div>
      </div>
    )
  }

  return (
    <LiveKitChainCastRoom
      token={chainCast.livekitToken!}
      serverUrl={chainCast.serverUrl!}
      chainCast={chainCast}
      onLeave={handleLeave}
    />
  )
}