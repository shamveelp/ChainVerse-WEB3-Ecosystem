"use client"

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Calendar, MapPin, Link2, MessageCircle, MoveHorizontal as MoreHorizontal, Settings, Loader as Loader2, RefreshCw, AlertCircle as AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCommunityProfile } from '@/hooks/useCommunityProfile'
import { useFollow } from '@/hooks/useFollow'
import { communityApiService } from '@/services/communityApiService'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import PostsFeed from '@/components/community/posts/posts-feed'
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

interface ProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { username } = resolvedParams

  const [activeTab, setActiveTab] = useState('posts')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followStats, setFollowStats] = useState({ followersCount: 0, followingCount: 0 })
  const [followActionInProgress, setFollowActionInProgress] = useState(false)
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false)
  const [profileKey, setProfileKey] = useState(0) // Force re-render key
  const [postsKey, setPostsKey] = useState(0) // Force posts refresh

  // Get current user info
  const currentUser = useSelector((state: RootState) => state.userAuth?.user)

  const {
    profile: ownProfile,
    loading: ownProfileLoading,
    viewedProfile,
    viewedProfileLoading,
    fetchCommunityProfileByUsername,
    fetchCommunityProfile,
    updateFollowStatus,
    clearViewedProfileData,
    clearError,
    retry
  } = useCommunityProfile()

  const { followUser, unfollowUser, loading: followLoading } = useFollow()

  // Determine if this is own profile
  const isOwnProfile = currentUser?.username === username
  const displayProfile = isOwnProfile ? ownProfile : viewedProfile
  const isLoading = isOwnProfile ? ownProfileLoading : viewedProfileLoading

  // Update local states when profile data changes
  useEffect(() => {
    if (displayProfile) {
      setIsFollowing(displayProfile.isFollowing || false)
      setFollowStats({
        followersCount: displayProfile.followersCount || 0,
        followingCount: displayProfile.followingCount || 0
      })
    }
  }, [displayProfile, profileKey])

  // Fetch profile data with proper cleanup and refresh logic
  useEffect(() => {
    

    const fetchData = async () => {
      try {
        if (isOwnProfile) {
          // Load own profile if not already loaded or if user changed
          if (!ownProfile || ownProfile.username !== currentUser?.username) {
            
            await fetchCommunityProfile(true) // Force refresh
          }
        } else {
          // Always fetch other user's profile to get fresh data
          
          const profileData = await fetchCommunityProfileByUsername(username, true) // Force refresh
          
          if (profileData) {
            // Get fresh follow status
            try {
              const followStatus = await communityApiService.getFollowStatus(username)
              if (followStatus.isFollowing !== profileData.isFollowing) {
                // Update the profile with correct follow status
                updateFollowStatus(username, followStatus.isFollowing, profileData.followersCount)
                setIsFollowing(followStatus.isFollowing)
              }
            } catch (error) {
              console.error('Failed to get follow status:', error)
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch profile:', err)
        toast.error('Failed to load profile', {
          description: err.message || 'Please try again'
        })
      }
    }

    if (currentUser) {
      fetchData()
    }

    // Cleanup when username changes
    return () => {
      if (!isOwnProfile) {
        clearViewedProfileData()
      }
    }
  }, [username, isOwnProfile, currentUser?.username, currentUser?._id])

  // Force component update when user changes (handles logout/login with different user)
  useEffect(() => {
    setProfileKey(prev => prev + 1)
    setPostsKey(prev => prev + 1)
  }, [currentUser?._id])

  // Format join date
  const formatJoinDate = (dateString: string | Date) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  // Handle follow action with proper state management
  const handleFollowClick = async () => {
    if (!displayProfile || isOwnProfile || followActionInProgress) return

    setFollowActionInProgress(true)
    try {
      const success = await followUser(displayProfile.username)
      if (success) {
        const newFollowersCount = followStats.followersCount + 1
        
        // Update all states
        setIsFollowing(true)
        setFollowStats(prev => ({
          ...prev,
          followersCount: newFollowersCount
        }))
        
        // Update Redux state
        updateFollowStatus(displayProfile.username, true, newFollowersCount)
        
        toast.success(`You are now following @${displayProfile.username}`)
      }
    } catch (error) {
      console.error('Follow error:', error)
      toast.error('Failed to follow user', {
        description: 'Please try again'
      })
    } finally {
      setFollowActionInProgress(false)
    }
  }

  // Handle unfollow confirmation
  const handleUnfollowClick = () => {
    setShowUnfollowDialog(true)
  }

  // Handle actual unfollow with proper state management
  const handleUnfollowConfirm = async () => {
    if (!displayProfile || isOwnProfile || followActionInProgress) return

    setFollowActionInProgress(true)
    try {
      const success = await unfollowUser(displayProfile.username)
      if (success) {
        const newFollowersCount = Math.max(0, followStats.followersCount - 1)
        
        // Update all states
        setIsFollowing(false)
        setFollowStats(prev => ({
          ...prev,
          followersCount: newFollowersCount
        }))
        
        // Update Redux state
        updateFollowStatus(displayProfile.username, false, newFollowersCount)
        
        toast.success(`You unfollowed @${displayProfile.username}`)
        setShowUnfollowDialog(false)
      }
    } catch (error) {
      console.error('Unfollow error:', error)
      toast.error('Failed to unfollow user', {
        description: 'Please try again'
      })
    } finally {
      setFollowActionInProgress(false)
    }
  }

  // Handle settings click
  const handleSettingsClick = () => {
    router.push(`/user/community/${username}/edit`)
  }

  // Navigate to followers page
  const handleFollowersClick = () => {
    router.push(`/user/community/${username}/followers`)
  }

  // Navigate to following page
  const handleFollowingClick = () => {
    router.push(`/user/community/${username}/following`)
  }

  const handleMessageClick = () => {
    if (!displayProfile) return
    router.push(`/user/community/messages/${username}`)
  }

  // Show loading
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
          <div className="max-w-2xl mx-auto h-screen overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto" />
                <p className="text-slate-400">Loading profile...</p>
              </div>
            </div>
          </div>
        </main>
        <RightSidebar />
      </div>
    )
  }

  // No profile data
  if (!displayProfile) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
          <div className="max-w-2xl mx-auto h-screen overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-4">
                <p className="text-slate-400">Profile not found</p>
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
    <div className="flex min-h-screen bg-slate-950" key={profileKey}>
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
                  <h2 className="text-2xl font-bold text-white">{displayProfile.name}</h2>
                  <p className="text-slate-400">{communityApiService.formatStats(displayProfile.postsCount || 0)} posts</p>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Banner */}
            <div className="relative h-48 md:h-64">
              <img
                src={displayProfile.bannerImage || 'https://images.pexels.com/photos/924824/pexels-photo-924824.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300'}
                alt="Profile banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'https://images.pexels.com/photos/924824/pexels-photo-924824.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
            </div>

            {/* Profile Info */}
            <div className="px-4 pb-4">
              <div className="relative -mt-16 md:-mt-20 mb-4">
                <Avatar className="w-32 h-32 md:w-40 md:h-40 ring-4 ring-slate-950 bg-slate-950">
                  <AvatarImage
                    src={displayProfile.profilePic || ''}
                    alt={displayProfile.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                  <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-4xl">
                    {displayProfile.name?.charAt(0)?.toUpperCase() || displayProfile.username?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-white">{displayProfile.name}</h1>
                      {displayProfile.isVerified && (
                        <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-400 mb-2">@{displayProfile.username}</p>
                  </div>

                  {displayProfile.bio && (
                    <p className="text-white text-lg leading-relaxed max-w-2xl">{displayProfile.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-slate-400">
                    {displayProfile.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{displayProfile.location}</span>
                      </div>
                    )}
                    {displayProfile.website && (
                      <div className="flex items-center gap-1">
                        <Link2 className="w-4 h-4" />
                        <a
                          href={communityApiService.cleanWebsiteUrl(displayProfile.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-cyan-400 hover:text-cyan-300"
                        >
                          {displayProfile.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {displayProfile.joinDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Joined {formatJoinDate(displayProfile.joinDate)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-6 text-sm">
                    {displayProfile.settings?.showFollowingCount && (
                      <div 
                        className="hover:underline cursor-pointer"
                        onClick={handleFollowingClick}
                      >
                        <span className="font-semibold text-white">
                          {communityApiService.formatStats(followStats.followingCount)}
                        </span>
                        <span className="text-slate-400 ml-1">Following</span>
                      </div>
                    )}
                    {displayProfile.settings?.showFollowersCount && (
                      <div 
                        className="hover:underline cursor-pointer"
                        onClick={handleFollowersClick}
                      >
                        <span className="font-semibold text-white">
                          {communityApiService.formatStats(followStats.followersCount)}
                        </span>
                        <span className="text-slate-400 ml-1">Followers</span>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-white">
                        {communityApiService.formatStats(displayProfile.likesReceived || 0)}
                      </span>
                      <span className="text-slate-400 ml-1">Likes Received</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {!isOwnProfile ? (
                    <>
                      {displayProfile.settings?.allowDirectMessages && (
                        <Button onClick={handleMessageClick} variant="outline" className="border-slate-600 hover:bg-slate-800">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      )}
                      <Button
                        onClick={isFollowing ? handleUnfollowClick : handleFollowClick}
                        disabled={followActionInProgress}
                        className={`${
                          isFollowing
                            ? 'bg-slate-800 text-white hover:bg-red-600 hover:text-white border border-slate-600'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
                        }`}
                      >
                        {followActionInProgress && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleSettingsClick}
                      className="border-slate-600 hover:bg-slate-800"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              {/* Social Links */}
              {(displayProfile.socialLinks?.twitter || displayProfile.socialLinks?.instagram ||
                displayProfile.socialLinks?.linkedin || displayProfile.socialLinks?.github) && (
                <div className="flex gap-4 mb-6 text-slate-400">
                  {displayProfile.socialLinks.twitter && (
                    <a
                      href={`https://twitter.com/${displayProfile.socialLinks.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 text-sm"
                    >
                      Twitter
                    </a>
                  )}
                  {displayProfile.socialLinks.instagram && (
                    <a
                      href={`https://instagram.com/${displayProfile.socialLinks.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 text-sm"
                    >
                      Instagram
                    </a>
                  )}
                  {displayProfile.socialLinks.linkedin && (
                    <a
                      href={`https://linkedin.com/in/${displayProfile.socialLinks.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 text-sm"
                    >
                      LinkedIn
                    </a>
                  )}
                  {displayProfile.socialLinks.github && (
                    <a
                      href={`https://github.com/${displayProfile.socialLinks.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 text-sm"
                    >
                      GitHub
                    </a>
                  )}
                </div>
              )}

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 border border-slate-700/50">
                  <TabsTrigger value="posts" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                    Posts
                  </TabsTrigger>
                  <TabsTrigger value="replies" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                    Replies
                  </TabsTrigger>
                  <TabsTrigger value="media" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                    Media
                  </TabsTrigger>
                  <TabsTrigger value="likes" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                    Likes
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6 pb-6">
                  <TabsContent value="posts" className="space-y-6">
                    <PostsFeed 
                      key={`posts-${postsKey}`}
                      type="user" 
                      userId={displayProfile._id}
                      onPostClick={(post) => router.push(`/user/community/post/${post._id}`)}
                    />
                  </TabsContent>

                  <TabsContent value="replies" className="space-y-6">
                    <div className="text-center py-12">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                      <p className="text-lg text-slate-400">No replies yet</p>
                      <p className="text-sm text-slate-500">Replies to other posts will appear here</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="space-y-6">
                    <div className="text-center py-12">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                      <p className="text-lg text-slate-400">No media yet</p>
                      <p className="text-sm text-slate-500">Photos and videos will appear here</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="likes" className="space-y-6">
                    <PostsFeed 
                      key={`likes-${postsKey}`}
                      type="liked" 
                      userId={displayProfile._id}
                      onPostClick={(post) => router.push(`/user/community/post/${post._id}`)}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />

      {/* Unfollow Confirmation Dialog */}
      <Dialog open={showUnfollowDialog} onOpenChange={setShowUnfollowDialog}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Unfollow @{displayProfile?.username}?</DialogTitle>
            <DialogDescription className="text-slate-400">
              Their posts will no longer show up in your timeline. You can still view their profile and posts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUnfollowDialog(false)}
              disabled={followActionInProgress}
              className="border-slate-600 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnfollowConfirm}
              disabled={followActionInProgress}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {followActionInProgress && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Unfollow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}