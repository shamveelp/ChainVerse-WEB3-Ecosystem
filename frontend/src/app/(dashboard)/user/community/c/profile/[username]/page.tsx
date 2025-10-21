"use client"

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Calendar, MapPin, Link2, MessageCircle, Users, Settings, Loader2, AlertCircle, Building2, Shield, Crown } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { communityExploreApiService, CommunityProfileData } from '@/services/userCommunityServices/communityExploreApiService'
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

interface CommunityProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default function CommunityProfilePage({ params }: CommunityProfilePageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { username } = resolvedParams

  const [activeTab, setActiveTab] = useState('posts')
  const [profile, setProfile] = useState<CommunityProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isJoined, setIsJoined] = useState(false)
  const [joinActionInProgress, setJoinActionInProgress] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)

  // Get current user info
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)

  // Fetch community profile
  useEffect(() => {
    const fetchCommunityProfile = async () => {
      if (!username) return

      setLoading(true)
      setError(null)

      try {
        console.log('Fetching community profile for:', username)
        const response = await communityExploreApiService.getCommunityProfile(username)
        setProfile(response.data)

        // Get membership status if user is logged in
        if (currentUser) {
          try {
            const membershipStatus = await communityExploreApiService.getCommunityMembershipStatus(username)
            setIsJoined(membershipStatus.isJoined)
          } catch (membershipError) {
            console.error('Failed to get membership status:', membershipError)
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch community profile:', err)
        setError(err.message || 'Failed to load community profile')
        toast.error('Failed to load profile', {
          description: err.message || 'Please try again'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCommunityProfile()
  }, [username, currentUser])

  // Format join date
  const formatJoinDate = (dateString: string | Date) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  // Handle join community
  const handleJoinClick = async () => {
    if (!profile || !currentUser || joinActionInProgress) return

    setJoinActionInProgress(true)
    try {
      const result = await communityExploreApiService.joinCommunity(profile.username)
      if (result.success) {
        setIsJoined(true)
        toast.success(result.message || `You joined ${profile.communityName}`)
        
        // Update local members count
        setProfile(prev => prev ? { ...prev, membersCount: result.membersCount } : prev)
      }
    } catch (error: any) {
      console.error('Join error:', error)
      toast.error('Failed to join community', {
        description: error.message || 'Please try again'
      })
    } finally {
      setJoinActionInProgress(false)
    }
  }

  // Handle leave community
  const handleLeaveClick = () => {
    setShowLeaveDialog(true)
  }

  const handleLeaveConfirm = async () => {
    if (!profile || !currentUser || joinActionInProgress) return

    setJoinActionInProgress(true)
    try {
      const result = await communityExploreApiService.leaveCommunity(profile.username)
      if (result.success) {
        setIsJoined(false)
        toast.success(result.message || `You left ${profile.communityName}`)
        
        // Update local members count
        setProfile(prev => prev ? { ...prev, membersCount: result.membersCount } : prev)
        setShowLeaveDialog(false)
      }
    } catch (error: any) {
      console.error('Leave error:', error)
      toast.error('Failed to leave community', {
        description: error.message || 'Please try again'
      })
    } finally {
      setJoinActionInProgress(false)
    }
  }

  // Handle message click
  const handleMessageClick = () => {
    if (!profile) return
    router.push(`/user/community/messages/${profile.username}`)
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
                <p className="text-slate-400">Loading community profile...</p>
              </div>
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
    )
  }

  // Show error
  if (error || !profile) {
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
    <div className="flex min-h-screen bg-slate-950">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
        <div className="max-w-2xl mx-auto h-screen overflow-y-auto scrollbar-hidden">
          <div className="space-y-0">
            {/* Header */}
            <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{profile.communityName}</h2>
                  <p className="text-slate-400">{communityExploreApiService.formatStats(profile.postsCount || 0)} posts</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`border-purple-500/30 ${
                      profile.status === 'approved' 
                        ? 'text-green-400 border-green-500/30' 
                        : 'text-yellow-400 border-yellow-500/30'
                    }`}
                  >
                    {profile.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Banner */}
            <div className="relative h-48 md:h-64">
              <img
                src={profile.banner || 'https://images.pexels.com/photos/924824/pexels-photo-924824.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300'}
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
                    src={profile.logo || ''}
                    alt={profile.communityName}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white text-4xl">
                    <Building2 className="w-16 h-16" />
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-white">{profile.communityName}</h1>
                      {profile.isVerified && (
                        <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-400 mb-2">@{profile.username}</p>
                  </div>

                  {profile.description && (
                    <p className="text-white text-lg leading-relaxed max-w-2xl">{profile.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-slate-400">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="border-slate-600 text-slate-400">
                        {profile.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Created {formatJoinDate(profile.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="font-semibold text-white">
                        {communityExploreApiService.formatStats(profile.membersCount || 0)}
                      </span>
                      <span className="text-slate-400 ml-1">Members</span>
                    </div>
                    <div>
                      <span className="font-semibold text-white">
                        {communityExploreApiService.formatStats(profile.postsCount || 0)}
                      </span>
                      <span className="text-slate-400 ml-1">Posts</span>
                    </div>
                    <div>
                      <span className="font-semibold text-white">
                        {profile.communityAdmins?.length || 0}
                      </span>
                      <span className="text-slate-400 ml-1">Admins</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {currentUser && (
                    <>
                      {profile.settings.allowGroupChat && (
                        <Button onClick={handleMessageClick} variant="outline" className="border-slate-600 hover:bg-slate-800">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      )}
                      <Button
                        onClick={isJoined ? handleLeaveClick : handleJoinClick}
                        disabled={joinActionInProgress}
                        className={`${
                          isJoined
                            ? 'bg-slate-800 text-white hover:bg-red-600 hover:text-white border border-slate-600'
                            : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white'
                        }`}
                      >
                        {joinActionInProgress && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isJoined ? 'Leave' : 'Join Community'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Community Features */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Community Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={`p-3 rounded-lg border ${
                    profile.settings.allowPosts 
                      ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-500'
                  }`}>
                    <div className="text-center">
                      <MessageCircle className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-xs">Posts</p>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${
                    profile.settings.allowGroupChat 
                      ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-500'
                  }`}>
                    <div className="text-center">
                      <Users className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-xs">Group Chat</p>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${
                    profile.settings.allowChainCast 
                      ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-500'
                  }`}>
                    <div className="text-center">
                      <Link2 className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-xs">ChainCast</p>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${
                    profile.settings.allowQuests 
                      ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-500'
                  }`}>
                    <div className="text-center">
                      <Crown className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-xs">Quests</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              {profile.socialLinks && profile.socialLinks.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Social Links</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.socialLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                      >
                        <Link2 className="w-4 h-4" />
                        {link.platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Community Rules */}
              {profile.rules && profile.rules.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Community Rules</h3>
                  <div className="space-y-2">
                    {profile.rules.map((rule, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                        <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {index + 1}
                        </span>
                        <p className="text-slate-300">{rule}</p>
                      </div>
                    ))}
                  </div>
                </div>
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
                      <p className="text-lg text-slate-400">No members to show</p>
                      <p className="text-sm text-slate-500">Community members will appear here</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="events" className="space-y-6">
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                      <p className="text-lg text-slate-400">No events scheduled</p>
                      <p className="text-sm text-slate-500">Community events will appear here</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="about" className="space-y-6">
                    <Card className="bg-slate-800/30 border-slate-700/50 p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">About {profile.communityName}</h4>
                      <div className="space-y-4 text-slate-300">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Description</p>
                          <p>{profile.description}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Category</p>
                          <Badge variant="outline" className="border-slate-600 text-slate-300">
                            {profile.category}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Created</p>
                          <p>{formatJoinDate(profile.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Wallet Address</p>
                          <p className="font-mono text-sm break-all">{profile.walletAddress}</p>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />

      {/* Leave Community Confirmation Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Leave {profile?.communityName}?</DialogTitle>
            <DialogDescription className="text-slate-400">
              You will no longer receive updates and won't be able to participate in community activities.
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
      </Dialog>
    </div>
  )
}