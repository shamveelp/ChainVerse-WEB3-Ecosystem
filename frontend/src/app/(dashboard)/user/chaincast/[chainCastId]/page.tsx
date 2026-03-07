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
import LiveKitChainCastRoom from '@/components/chainCast/LiveKitChainCastRoom'
import {
  userChainCastApiService,
  type ChainCast,
  type CanJoinResponse
} from '@/services/chainCast/userChainCastApiService'
import { USER_ROUTES } from '@/routes'
import { motion } from 'framer-motion'

interface ChainCastPageProps {
  params: Promise<{
    chainCastId: string
  }>
}

export default function ChainCastPage({ params }: ChainCastPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { chainCastId } = resolvedParams

  const isAuthenticated = useSelector((state: RootState) => state.userAuth?.isAuthenticated)

  // State
  const [chainCast, setChainCast] = useState<ChainCast | null>(null)
  const [canJoinData, setCanJoinData] = useState<CanJoinResponse>({ canJoin: false })
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [livekitToken, setLivekitToken] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState<string | null>(null)
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
        setChainCast(chainCastData as unknown as ChainCast)

        // Check if user is already a participant (legacy check, but we'll still do it)
        const joinPermissions = await userChainCastApiService.canJoinChainCast(chainCastId)
        setCanJoinData(joinPermissions)

      } catch (err: unknown) {
        console.error('Failed to load ChainCast:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load ChainCast'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadChainCast()
  }, [chainCastId, isAuthenticated])

  // Handle join ChainCast
  const handleJoin = async () => {
    if (!chainCast) return

    try {
      setJoining(true)

      const result = await userChainCastApiService.joinChainCast({
        chainCastId: chainCast._id,
        quality: 'medium'
      })

      if (result.success && result.livekitToken && result.serverUrl) {
        setLivekitToken(result.livekitToken)
        setServerUrl(result.serverUrl)
        toast.success("Successfully joined the ChainCast!")
      } else {
        throw new Error(result.message || "Failed to obtain LiveKit credentials")
      }

    } catch (err: unknown) {
      console.error('Join ChainCast error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to join ChainCast'
      toast.error(errorMessage)
    } finally {
      setJoining(false)
    }
  }

  // Handle leave
  const handleLeave = () => {
    setLivekitToken(null)
    router.back()
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
          <p className="text-white text-lg">Loading ChainCast...</p>
        </div>
      </div>
    )
  }

  // Show error or not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900 shadow-2xl border-slate-800 p-8 max-w-md mx-auto rounded-3xl">
          <div className="text-center space-y-6">
            <div className="bg-slate-800 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="h-10 w-10 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Authentication Required</h1>
            <p className="text-slate-400">Join our community to participate in exclusive live ChainCasts.</p>
            <Button
              onClick={() => router.push(USER_ROUTES.LOGIN)}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-full py-6 font-bold shadow-lg shadow-red-900/40 tarnsition-all"
            >
              Login to Continue
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !chainCast) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="bg-slate-900 border-slate-800 p-8 max-w-md mx-auto rounded-3xl">
          <div className="text-center space-y-6">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" strokeWidth={1.5} />
            <h1 className="text-2xl font-bold text-white">ChainCast Not Found</h1>
            <p className="text-slate-400">{error || 'This ChainCast may have ended or been removed.'}</p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="rounded-full border-slate-700 hover:bg-slate-800"
              >
                Go Back
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // If user has token, show the LiveKit room
  if (livekitToken && serverUrl) {
    return (
      <LiveKitChainCastRoom
        token={livekitToken}
        serverUrl={serverUrl}
        chainCast={chainCast}
        onLeave={handleLeave}
      />
    )
  }

  // Show ChainCast preview and join interface
  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center p-4">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-red-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <Card className="bg-slate-900/60 backdrop-blur-3xl border-slate-800/50 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 md:p-12">
            {/* Header */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => router.back()}
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white hover:bg-white/5 rounded-full"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>

                <Badge className={`${chainCast.status === 'live'
                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                  } px-4 py-1.5 rounded-full text-sm font-bold border`}
                >
                  {chainCast.status === 'live' && <span className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse" />}
                  {chainCast.status.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                  {chainCast.title}
                </h1>

                {chainCast.description && (
                  <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-xl">
                    {chainCast.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-6 border-y border-slate-800/50">
                <div className="space-y-1">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Host</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-red-600 to-pink-600 flex items-center justify-center text-[10px] font-bold">
                      {chainCast.admin.name[0]}
                    </div>
                    <p className="text-white font-semibold text-sm truncate">{chainCast.admin.name}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Viewers</p>
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>{chainCast.currentParticipants}/{chainCast.maxParticipants}</span>
                  </div>
                </div>

                {chainCast.scheduledStartTime && (
                  <div className="space-y-1">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Starts At</p>
                    <div className="flex items-center gap-2 text-white font-semibold">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span>{new Date(chainCast.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Area */}
              <div className="pt-4">
                {chainCast.status === 'live' ? (
                  canJoinData.canJoin ? (
                    <Button
                      onClick={handleJoin}
                      disabled={joining}
                      className="w-full bg-red-600 hover:bg-red-700 text-white rounded-2xl py-8 text-xl font-black transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-red-900/20 group"
                    >
                      {joining ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <div className="flex items-center">
                          JOIN LIVE SESSION
                        </div>
                      )}
                    </Button>
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                      <UserX className="h-8 w-8 text-red-500 mx-auto mb-2" />
                      <h4 className="text-red-500 font-bold">Access Restricted</h4>
                      <p className="text-slate-400 text-sm">{canJoinData.reason || "You don't have permission to join this ChainCast."}</p>
                    </div>
                  )
                ) : (
                  <Button
                    disabled
                    className="w-full bg-slate-800 text-slate-500 rounded-2xl py-8 text-xl font-black cursor-not-allowed"
                  >
                    {chainCast.status.toUpperCase()}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}