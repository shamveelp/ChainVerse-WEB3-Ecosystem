"use client"

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Calendar,
  Users,
  Settings,
  Loader2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Hash,
  Shield,
  Crown
} from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"
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
  communityExploreApiService,
  type CommunityProfile,
  type JoinCommunityResponse
} from '@/services/userCommunityServices/communityExploreApiService'
import Image from 'next/image'

interface CommunityProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default function CommunityProfilePage({ params }: CommunityProfilePageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { username } = resolvedParams

  const [community, setCommunity] = useState<CommunityProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('posts')
  const [isMember, setIsMember] = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  const [joinActionInProgress, setJoinActionInProgress] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)

  // Get current user info
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)

  // Fetch community data
  useEffect(() => {
    const fetchCommunity = async () => {
      if (!username) return

      try {
        setLoading(true)
        setError(null)


        const communityData = await communityExploreApiService.getCommunityProfile(username)

        setCommunity(communityData)
        setIsMember(communityData.isMember)
        setMemberCount(communityData.memberCount)


      } catch (err: any) {
        console.error('Failed to fetch community:', err)
        setError(err.message || 'Failed to load community profile')
        toast.error('Failed to load community', {
          description: err.message || 'Please try again'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCommunity()
  }, [username])

  // Handle join community
  const handleJoinClick = async () => {
    if (!community || !currentUser || joinActionInProgress) return

    setJoinActionInProgress(true)
    try {
      const result: JoinCommunityResponse = await communityExploreApiService.joinCommunity(community.username)

      if (result.success) {
        setIsMember(true)
        setMemberCount(result.memberCount)
        setCommunity(prev => prev ? { ...prev, isMember: true, memberCount: result.memberCount } : prev)
        toast.success(result.message)
      }
    } catch (error: any) {
      console.error('Join community error:', error)
      toast.error('Failed to join community', {
        description: error.message || 'Please try again'
      })
    } finally {
      setJoinActionInProgress(false)
    }
  }

  // Handle leave community confirmation
  const handleLeaveClick = () => {
    setShowLeaveDialog(true)
  }

  // Handle actual leave community
  const handleLeaveConfirm = async () => {
    if (!community || !currentUser || joinActionInProgress) return

    setJoinActionInProgress(true)
    try {
      const result: JoinCommunityResponse = await communityExploreApiService.leaveCommunity(community.username)

      if (result.success) {
        setIsMember(false)
        setMemberCount(result.memberCount)
        setCommunity(prev => prev ? { ...prev, isMember: false, memberCount: result.memberCount } : prev)
        toast.success(result.message)
        setShowLeaveDialog(false)
      }
    } catch (error: any) {
      console.error('Leave community error:', error)
      toast.error('Failed to leave community', {
        description: error.message || 'Please try again'
      })
    } finally {
      setJoinActionInProgress(false)
    }
  }

  // Navigate to members page
  const handleMembersClick = () => {
    router.push(`/user/community/c/${username}/members`)
  }

  // Handle settings click (for admins)
  const handleSettingsClick = () => {
    router.push(`/user/community/c/${username}/settings`)
  }

  // Format join date
  const formatJoinDate = (dateString: string | Date) => {
    if (!dateString) return ''
    return communityExploreApiService.formatDate(dateString)
  }

  // Show loading
  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
          <div className="max-w-2xl mx-auto h-screen overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto" />
                <p className="text-slate-400">Loading community...</p>
              </div>
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
    )
  }

  // Show error
  if (error || !community) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
          <div className="max-w-2xl mx-auto h-screen overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                <p className="text-slate-400">{error || 'Community not found'}</p>
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="border-slate-600 hover:bg-slate-800"
                >
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto border-x border-slate-800 min-h-screen bg-slate-950">
      <div className="space-y-0">
        {/* Header */}
        <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{community.communityName}</h2>
              <p className="text-slate-400">
                {communityExploreApiService.formatMemberCount(memberCount)} members
              </p>
            </div>
            {community.isAdmin && (
              <Button variant="ghost" size="icon" onClick={handleSettingsClick} className="text-slate-400 hover:text-white">
                <Settings className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Banner */}
        <div className="relative h-48 md:h-64">
          <Image
            src={community.banner || 'https://images.pexels.com/photos/924824/pexels-photo-924824.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300'}
            alt="Community banner"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'https://images.pexels.com/photos/924824/pexels-photo-924824.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
        </div>

        {/* Community Info */}
        <div className="px-4 pb-4">
          <div className="relative -mt-16 md:-mt-20 mb-4">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 ring-4 ring-slate-950 bg-slate-950">
              <AvatarImage
                src={community.logo || ''}
                alt={community.communityName}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-4xl">
                {communityExploreApiService.getCommunityAvatarFallback(community.communityName)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="space-y-3 flex-1 min-w-0">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{community.communityName}</h1>
                  {community.isVerified && (
                    <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-slate-400">@{community.username}</p>
                  {community.memberRole && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${community.memberRole === 'admin' ? 'border-yellow-500/30 text-yellow-400' :
                        community.memberRole === 'moderator' ? 'border-blue-500/30 text-blue-400' :
                          'border-green-500/30 text-green-400'
                        }`}
                    >
                      {community.memberRole === 'admin' && <Crown className="w-3 h-3 mr-1" />}
                      {community.memberRole === 'moderator' && <Shield className="w-3 h-3 mr-1" />}
                      {community.memberRole}
                    </Badge>
                  )}
                </div>
              </div>

              {community.description && (
                <p className="text-white text-lg leading-relaxed max-w-2xl line-clamp-3 md:line-clamp-none break-words">{community.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-slate-400 text-sm">
                <div className="flex items-center gap-1">
                  <Hash className="w-4 h-4" />
                  <span>{community.category}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created {formatJoinDate(community.createdAt)}</span>
                </div>
              </div>

              <div className="flex gap-6 text-sm">
                <div
                  className="hover:underline cursor-pointer"
                  onClick={handleMembersClick}
                >
                  <span className="font-semibold text-white">
                    {communityExploreApiService.formatMemberCount(memberCount)}
                  </span>
                  <span className="text-slate-400 ml-1">Members</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {currentUser ? (
                <>
                  {isMember && (
                    <Button
                      onClick={() => router.push(`/user/community/c/messages/${username}`)}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Go to Chats
                    </Button>
                  )}
                  <Button
                    onClick={isMember ? handleLeaveClick : handleJoinClick}
                    disabled={joinActionInProgress}
                    variant={isMember ? "outline" : "default"}
                    className={`${isMember
                      ? 'border-slate-600 hover:bg-slate-800 text-slate-300 hover:text-white'
                      : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white'
                      }`}
                  >
                    {joinActionInProgress && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isMember ? 'Leave' : 'Join Community'}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => router.push('/auth/login')}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white"
                >
                  Login to Join
                </Button>
              )}
            </div>
          </div>

          {/* Social Links */}
          {community.socialLinks && community.socialLinks.length > 0 && (
            <div className="flex gap-4 mb-6 text-slate-400">
              {community.socialLinks.map((link: any, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  {link.platform}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}

          {/* Community Rules */}
          {community.rules && community.rules.length > 0 && (
            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-4 mb-6">
              <h3 className="text-white font-semibold mb-3">Community Rules</h3>
              <div className="space-y-2">
                {community.rules.map((rule, index) => (
                  <p key={index} className="text-slate-300 text-sm">
                    {index + 1}. {rule}
                  </p>
                ))}
              </div>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 border border-slate-700/50">
              <TabsTrigger value="posts" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                Posts
              </TabsTrigger>
              <TabsTrigger value="members" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                Members
              </TabsTrigger>
              <TabsTrigger value="events" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                Events
              </TabsTrigger>
              <TabsTrigger value="about" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                About
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 pb-6">
              <TabsContent value="posts" className="space-y-6">
                <div className="text-center py-12">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-lg text-slate-400">No posts yet</p>
                  <p className="text-sm text-slate-500">Community posts will appear here</p>
                </div>
              </TabsContent>

              <TabsContent value="members" className="space-y-6">
                <div className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-lg text-slate-400">Members</p>
                  <Button
                    variant="outline"
                    onClick={handleMembersClick}
                    className="mt-4 border-slate-600 hover:bg-slate-800"
                  >
                    View All Members
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="events" className="space-y-6">
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-lg text-slate-400">No events yet</p>
                  <p className="text-sm text-slate-500">Community events will appear here</p>
                </div>
              </TabsContent>

              <TabsContent value="about" className="space-y-6">
                <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 p-6">
                  <h3 className="text-white font-semibold mb-4">About {community.communityName}</h3>
                  <div className="space-y-4 text-slate-300">
                    <p className="break-words whitespace-pre-wrap">{community.description}</p>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                      <div>
                        <p className="text-slate-400 text-sm">Category</p>
                        <p className="text-white">{community.category}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Members</p>
                        <p className="text-white">{communityExploreApiService.formatMemberCount(memberCount)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Created</p>
                        <p className="text-white">{formatJoinDate(community.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Status</p>
                        <div className="flex items-center gap-2">
                          <p className="text-white">Active</p>
                          {community.isVerified && (
                            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>


      {/* Leave Community Confirmation Dialog */}
      < Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog} >
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Leave {community?.communityName}?</DialogTitle>
            <DialogDescription className="text-slate-400">
              You will no longer have access to community posts and discussions. You can rejoin anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLeaveDialog(false)}
              disabled={joinActionInProgress}
              className="border-slate-600 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLeaveConfirm}
              disabled={joinActionInProgress}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {joinActionInProgress && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Leave Community
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </div >
  )
}