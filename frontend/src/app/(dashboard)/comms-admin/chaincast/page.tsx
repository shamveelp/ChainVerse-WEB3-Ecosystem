"use client"

import { ChainCastAccessGuard } from "@/components/comms-admin/ChainCastAccessGuard";
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, ChartBar as BarChart3, Play, Plus, Clock, Users, Eye, TrendingUp, Settings, Loader as Loader2, CircleAlert as AlertCircle, Pause, Trash2, CreditCard as Edit, Video, MessageCircle } from 'lucide-react'
import { RootState } from '@/redux/store'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  communityAdminChainCastApiService
} from '@/services/chainCast/communityAdminChainCastApiService'
import type { ChainCast, ChainCastsResponse, CreateChainCastRequest } from '@/types/comms-admin/chaincast.types'

const statusFilters = [
  { id: 'all', label: 'All ChainCasts', icon: BarChart3 },
  { id: 'live', label: 'Live', icon: Video },
  { id: 'scheduled', label: 'Scheduled', icon: Clock },
  { id: 'ended', label: 'Ended', icon: Eye }
]

function ChainCastPageContent() {
  const router = useRouter()
  const currentAdmin = useSelector((state: RootState) => state.communityAdminAuth?.communityAdmin)

  // State
  const [chainCasts, setChainCasts] = useState<ChainCast[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters and pagination
  const [activeFilter, setActiveFilter] = useState('all')
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | undefined>()
  const [totalCount, setTotalCount] = useState(0)
  const [summary, setSummary] = useState({ live: 0, scheduled: 0, ended: 0 })

  // Action states
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({})

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState<ChainCast | null>(null)
  const [editingChainCast, setEditingChainCast] = useState<ChainCast | null>(null)

  // Create/Edit form
  const [formData, setFormData] = useState<CreateChainCastRequest>({
    title: '',
    description: '',
    maxParticipants: 50,
    settings: {
      allowReactions: true,
      allowChat: true,
      moderationRequired: true,
      recordSession: false
    }
  })

  // Load ChainCasts
  const loadChainCasts = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true)
        setChainCasts([])
      } else {
        setLoadingMore(true)
      }

      setError(null)

      const cursor = reset ? undefined : nextCursor
      const response: ChainCastsResponse = await communityAdminChainCastApiService.getChainCasts(
        activeFilter,
        cursor,
        10,
        'recent'
      )

      if (reset) {
        setChainCasts(response.chainCasts)
      } else {
        setChainCasts(prev => [...prev, ...response.chainCasts])
      }

      setHasMore(response.hasMore)
      setNextCursor(response.nextCursor)
      setTotalCount(response.totalCount)
      if (response.summary) {
        setSummary(response.summary)
      }

    } catch (err: unknown) {
      console.error('Failed to load ChainCasts:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load ChainCasts'
      setError(errorMessage)
      toast.error('Failed to load ChainCasts', {
        description: errorMessage
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Initial load and filter changes
  useEffect(() => {
    loadChainCasts(true)
  }, [activeFilter])

  // Handle filter change
  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId)
  }

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !loadingMore && nextCursor) {
      loadChainCasts(false)
    }
  }

  // Handle create ChainCast
  const handleCreateChainCast = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    try {
      setActionLoading({ create: true })

      const newChainCast = await communityAdminChainCastApiService.createChainCast(formData)

      setChainCasts(prev => [newChainCast, ...prev])
      setTotalCount(prev => prev + 1)

      toast.success('ChainCast created successfully')
      setShowCreateDialog(false)
      resetForm()

    } catch (err: unknown) {
      console.error('Create ChainCast error:', err)
      toast.error('Failed to create ChainCast', {
        description: err instanceof Error ? err.message : 'Please try again'
      })
    } finally {
      setActionLoading({ create: false })
    }
  }

  // Handle start ChainCast
  const handleStartChainCast = async (chainCast: ChainCast) => {
    try {
      setActionLoading({ [chainCast._id]: true })

      const updatedChainCast = await communityAdminChainCastApiService.startChainCast(chainCast._id)

      setChainCasts(prev => prev.map(c => c._id === chainCast._id ? updatedChainCast : c))

      toast.success('ChainCast started successfully')

      // Navigate to the ChainCast room for the admin
      router.push(`/comms-admin/chaincast/${chainCast._id}/room`)

    } catch (err: unknown) {
      console.error('Start ChainCast error:', err)
      toast.error('Failed to start ChainCast', {
        description: err instanceof Error ? err.message : 'Please try again'
      })
    } finally {
      setActionLoading({ [chainCast._id]: false })
    }
  }

  // Handle join live ChainCast (for admin)
  const handleJoinLiveChainCast = (chainCast: ChainCast) => {
    if (chainCast.status === 'live') {
      router.push(`/comms-admin/chaincast/${chainCast._id}/room`)
    }
  }

  // Handle end ChainCast
  const handleEndChainCast = async (chainCast: ChainCast) => {
    try {
      setActionLoading({ [chainCast._id]: true })

      const updatedChainCast = await communityAdminChainCastApiService.endChainCast(chainCast._id)

      setChainCasts(prev => prev.map(c => c._id === chainCast._id ? updatedChainCast : c))

      toast.success('ChainCast ended successfully')

    } catch (err: unknown) {
      console.error('End ChainCast error:', err)
      toast.error('Failed to end ChainCast', {
        description: err instanceof Error ? err.message : 'Please try again'
      })
    } finally {
      setActionLoading({ [chainCast._id]: false })
    }
  }

  // Handle delete ChainCast
  const handleDeleteChainCast = async () => {
    if (!showDeleteDialog) return

    try {
      setActionLoading({ delete: true })

      await communityAdminChainCastApiService.deleteChainCast(showDeleteDialog._id)

      setChainCasts(prev => prev.filter(c => c._id !== showDeleteDialog._id))
      setTotalCount(prev => Math.max(0, prev - 1))

      toast.success('ChainCast deleted successfully')
      setShowDeleteDialog(null)

    } catch (err: unknown) {
      console.error('Delete ChainCast error:', err)
      toast.error('Failed to delete ChainCast', {
        description: err instanceof Error ? err.message : 'Please try again'
      })
    } finally {
      setActionLoading({ delete: false })
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      maxParticipants: 50,
      settings: {
        allowReactions: true,
        allowChat: true,
        moderationRequired: true,
        recordSession: false
      }
    })
    setEditingChainCast(null)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const colors = communityAdminChainCastApiService.getStatusColor(status)
    return (
      <Badge className={`${colors.bg} ${colors.text} ${colors.border} text-xs border`}>
        {status === 'live' && <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Show loading
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto" />
            <p className="text-gray-400">Loading ChainCasts...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
            ChainCast Studio
          </h1>
          <p className="text-gray-400 mt-2">Create and manage live streams for your community</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Schedule ChainCast
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total ChainCasts</p>
                <p className="text-2xl font-bold text-white">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <Video className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Live Now</p>
                <p className="text-2xl font-bold text-white">{summary.live}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Scheduled</p>
                <p className="text-2xl font-bold text-white">{summary.scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-800 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-white">{summary.ended}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-red-800/30">
        {statusFilters.map((filter) => {
          const Icon = filter.icon
          return (
            <Button
              key={filter.id}
              variant={activeFilter === filter.id ? "default" : "ghost"}
              onClick={() => handleFilterChange(filter.id)}
              className={activeFilter === filter.id
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white"
                : "text-gray-400 hover:text-white hover:bg-red-950/30"
              }
            >
              <Icon className="w-4 h-4 mr-2" />
              {filter.label}
            </Button>
          )
        })}
      </div>

      {/* ChainCasts List */}
      <div className="space-y-4">
        {error && chainCasts.length === 0 ? (
          <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Error Loading ChainCasts</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <Button
                onClick={() => loadChainCasts(true)}
                variant="outline"
                className="border-red-600/50 text-red-400 hover:bg-red-950/30"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : chainCasts.length === 0 ? (
          <Card className="bg-black/60 backdrop-blur-xl border-red-800/30">
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No ChainCasts Yet</h3>
              <p className="text-gray-400 mb-6">Schedule your first ChainCast to engage with your community live</p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule ChainCast
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {chainCasts.map((chainCast) => (
              <Card key={chainCast._id} className="bg-black/60 backdrop-blur-xl border-red-800/30 hover:border-red-700/50 transition-all duration-300">

                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-white">{chainCast.title}</h3>
                        {getStatusBadge(chainCast.status)}
                      </div>

                      {chainCast.description && (
                        <p className="text-gray-400">{chainCast.description}</p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-gray-400">
                        {chainCast.scheduledStartTime && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {communityAdminChainCastApiService.formatDateTime(chainCast.scheduledStartTime)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{chainCast.currentParticipants}/{chainCast.maxParticipants} participants</span>
                        </div>

                        {chainCast.stats.totalViews > 0 && (
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span>{communityAdminChainCastApiService.formatViewerCount(chainCast.stats.totalViews)} views</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <TooltipProvider>
                        {chainCast.status === 'scheduled' && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingChainCast(chainCast)
                                    setFormData({
                                      title: chainCast.title,
                                      description: chainCast.description || '',
                                      maxParticipants: chainCast.maxParticipants,
                                      settings: chainCast.settings
                                    })
                                    setShowCreateDialog(true)
                                  }}
                                  className="border-red-600/50 text-red-400 hover:bg-red-950/30"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit ChainCast details</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => handleStartChainCast(chainCast)}
                                  disabled={actionLoading[chainCast._id]}
                                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white"
                                >
                                  {actionLoading[chainCast._id] ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Play className="h-4 w-4 mr-2" />
                                  )}
                                  Go Live
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Start the ChainCast and go live</p>
                              </TooltipContent>
                            </Tooltip>
                          </>
                        )}

                        {chainCast.status === 'live' && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => handleJoinLiveChainCast(chainCast)}
                                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
                                >
                                  <Video className="h-4 w-4 mr-2" />
                                  Join Room
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Join the live ChainCast room</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => handleEndChainCast(chainCast)}
                                  disabled={actionLoading[chainCast._id]}
                                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
                                >
                                  {actionLoading[chainCast._id] ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Pause className="h-4 w-4 mr-2" />
                                  )}
                                  End Stream
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>End the ChainCast for everyone</p>
                              </TooltipContent>
                            </Tooltip>
                          </>
                        )}

                        {chainCast.status === 'ended' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-600/50 text-red-400 hover:bg-red-950/30"
                              >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Analytics
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View ChainCast analytics and stats</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {(chainCast.status === 'scheduled' || chainCast.status === 'ended') && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDeleteDialog(chainCast)}
                                className="border-red-600/50 text-red-400 hover:bg-red-950/30"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete this ChainCast</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="text-center py-4">
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  className="border-red-600/50 text-red-400 hover:bg-red-950/30"
                >
                  {loadingMore && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Load More ChainCasts
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit ChainCast Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingChainCast ? 'Edit ChainCast' : 'Schedule New ChainCast'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingChainCast ? 'Update your ChainCast details' : 'Set up a live stream for your community'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-white">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter ChainCast title"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this ChainCast will be about"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="maxParticipants" className="text-white">Max Participants</Label>
              <Select
                value={formData.maxParticipants?.toString()}
                onValueChange={(value) => setFormData({ ...formData, maxParticipants: parseInt(value) })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue placeholder="Select max participants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 participants</SelectItem>
                  <SelectItem value="25">25 participants</SelectItem>
                  <SelectItem value="50">50 participants</SelectItem>
                  <SelectItem value="100">100 participants</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-white">Settings</Label>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowReactions" className="text-white">Allow Reactions</Label>
                  <p className="text-sm text-slate-400">Let participants react with emojis</p>
                </div>
                <Switch
                  id="allowReactions"
                  checked={formData.settings?.allowReactions}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, allowReactions: checked }
                  })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowChat" className="text-white">Allow Chat</Label>
                  <p className="text-sm text-slate-400">Enable text chat during stream</p>
                </div>
                <Switch
                  id="allowChat"
                  checked={formData.settings?.allowChat}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, allowChat: checked }
                  })}
                />
              </div>


            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                resetForm()
              }}
              disabled={actionLoading.create}
              className="border-slate-600 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateChainCast}
              disabled={actionLoading.create}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white"
            >
              {actionLoading.create && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingChainCast ? 'Update ChainCast' : 'Schedule ChainCast'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Delete ChainCast?</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete "{showDeleteDialog?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(null)}
              disabled={actionLoading.delete}
              className="border-slate-600 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteChainCast}
              disabled={actionLoading.delete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading.delete && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete ChainCast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ChainCastPage() {
  return (
    <ChainCastAccessGuard>
      <ChainCastPageContent />
    </ChainCastAccessGuard>
  );
}