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
      <div className="flex items-center justify-center min-h-[50vh]">
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
    )
  }

  return (
    <div key={profileKey} className="w-full max-w-2xl mx-auto border-x border-slate-800 min-h-screen bg-slate-950">
      {/* Header */}
      <div className="sticky top-[4.5rem] bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 pt-[29px] z-10 -mx-[1px] -mt-[1px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-white/10 -ml-2">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current text-white"><g><path d="M7.414 13l5.043 5.04-1.414 1.415-7.414-7.414 7.414-7.414 1.414 1.415L7.414 11H21v2H7.414z"></path></g></svg>
            </Button>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">{displayProfile.name}</h2>
              <p className="text-xs text-slate-400">{communityApiService.formatStats(displayProfile.postsCount || 0)} posts</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white rounded-full hover:bg-white/10">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="pb-32">
        {/* Banner */}
        <div className="relative h-32 md:h-48 bg-slate-800">
          <img
            src={displayProfile.bannerImage || 'https://images.pexels.com/photos/924824/pexels-photo-924824.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300'}
            alt="Profile banner"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = 'https://images.pexels.com/photos/924824/pexels-photo-924824.jpeg?auto=compress&cs=tinysrgb&w=1200&h=300'
            }}
          />
        </div>

        {/* Profile Info */}
        <div className="px-4">
          <div className="relative -mt-10 md:-mt-16 mb-4 flex justify-between items-end">
            <Avatar className="w-20 h-20 md:w-32 md:h-32 ring-4 ring-slate-950 bg-slate-950 rounded-full">
              <AvatarImage
                src={displayProfile.profilePic || ''}
                alt={displayProfile.name}
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
              <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-3xl">
                {displayProfile.name?.charAt(0)?.toUpperCase() || displayProfile.username?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex gap-2 mb-2 md:mb-4">
              {!isOwnProfile ? (
                <>
                  <Button variant="secondary" size="icon" className="rounded-full border border-slate-600 bg-black text-white hover:bg-white/10 md:hidden">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  {displayProfile.settings?.allowDirectMessages && (
                    <Button onClick={handleMessageClick} variant="outline" className="rounded-full border-slate-600 hover:bg-slate-800 font-bold hidden md:flex">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  )}
                  {displayProfile.settings?.allowDirectMessages && (
                    <Button onClick={handleMessageClick} variant="outline" size="icon" className="rounded-full border-slate-600 hover:bg-slate-800 md:hidden">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    onClick={isFollowing ? handleUnfollowClick : handleFollowClick}
                    disabled={followActionInProgress}
                    className={`rounded-full px-6 font-bold transition-all ${isFollowing
                      ? 'bg-transparent text-white border border-slate-600 hover:border-red-600 hover:text-red-500 hover:bg-red-900/10'
                      : 'bg-white text-black hover:bg-slate-200'
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
                  className="rounded-full border-slate-600 hover:bg-slate-800 font-bold"
                >
                  Edit profile
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div>
              <div className="flex items-center gap-1">
                <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">{displayProfile.name}</h1>
                {displayProfile.isVerified && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-slate-500">@{displayProfile.username}</p>
            </div>

            {displayProfile.bio && (
              <p className="text-white leading-normal whitespace-pre-wrap">{displayProfile.bio}</p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-slate-500 text-sm">
              {displayProfile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{displayProfile.location}</span>
                </div>
              )}
              {displayProfile.website && (
                <div className="flex items-center gap-1">
                  <Link2 className="w-4 h-4" />
                  <a
                    href={communityApiService.cleanWebsiteUrl(displayProfile.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline truncate max-w-[200px]"
                  >
                    {displayProfile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {displayProfile.joinDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatJoinDate(displayProfile.joinDate)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-5 text-sm">
              {displayProfile.settings?.showFollowingCount && (
                <div
                  className="hover:underline cursor-pointer flex gap-1"
                  onClick={handleFollowingClick}
                >
                  <span className="font-bold text-white">
                    {communityApiService.formatStats(followStats.followingCount)}
                  </span>
                  <span className="text-slate-500">Following</span>
                </div>
              )}
              {displayProfile.settings?.showFollowersCount && (
                <div
                  className="hover:underline cursor-pointer flex gap-1"
                  onClick={handleFollowersClick}
                >
                  <span className="font-bold text-white">
                    {communityApiService.formatStats(followStats.followersCount)}
                  </span>
                  <span className="text-slate-500">Followers</span>
                </div>
              )}
            </div>
          </div>

          {/* Social Links Small */}
          {(displayProfile.socialLinks?.twitter || displayProfile.socialLinks?.instagram ||
            displayProfile.socialLinks?.linkedin || displayProfile.socialLinks?.github) && (
              <div className="flex gap-4 mb-4 text-slate-500 text-xs">
                {displayProfile.socialLinks.twitter && (
                  <a href={`https://twitter.com/${displayProfile.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">Twitter</a>
                )}
                {displayProfile.socialLinks.instagram && (
                  <a href={`https://instagram.com/${displayProfile.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-pink-400">Instagram</a>
                )}
              </div>
            )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-transparent border-b border-slate-800 p-0 h-12 rounded-none">
              {['Posts', 'Replies', 'Media', 'Likes'].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab.toLowerCase()}
                  className="rounded-none h-full border-b-4 border-transparent data-[state=active]:border-cyan-500 data-[state=active]:bg-transparent data-[state=active]:text-white font-bold text-slate-500 hover:bg-white/5 transition-colors"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="min-h-[50vh]">
              <TabsContent value="posts" className="mt-0">
                <PostsFeed
                  key={`posts-${postsKey}`}
                  type="user"
                  userId={displayProfile._id}
                  onPostClick={(post) => router.push(`/user/community/post/${post._id}`)}
                />
              </TabsContent>

              <TabsContent value="replies" className="mt-0">
                <div className="text-center py-12 px-4">
                  <p className="text-lg font-bold text-white mb-2">No replies yet</p>
                  <p className="text-slate-500">Replies to other posts will appear here</p>
                </div>
              </TabsContent>

              <TabsContent value="media" className="mt-0">
                <div className="text-center py-12 px-4">
                  <div className="w-[300px] h-[150px] mx-auto bg-slate-800/50 rounded-xl mb-6 flex items-center justify-center">
                    <img src="https://abs.twimg.com/sticky/illustrations/empty-states/yellow-birds-power-line-800x400.v1.png" alt="No media" className="opacity-50 h-full w-auto p-4" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-2">Lights, camera ... attachment!</p>
                  <p className="text-slate-500">When you send tweets with photos or videos, they will show up here.</p>
                </div>
              </TabsContent>

              <TabsContent value="likes" className="mt-0">
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

      {/* Unfollow Confirmation Dialog */}
      <Dialog open={showUnfollowDialog} onOpenChange={setShowUnfollowDialog}>
        <DialogContent className="sm:max-w-[320px] bg-slate-900 border-slate-700 rounded-2xl p-6">
          <DialogTitle className="text-xl font-bold text-white mb-2">Unfollow @{displayProfile?.username}?</DialogTitle>
          <DialogDescription className="text-slate-500 text-sm mb-6">
            Their posts will no longer show up in your Home timeline. You can still view their profile, unless their Tweets are protected.
          </DialogDescription>
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleUnfollowConfirm}
              disabled={followActionInProgress}
              className="bg-white text-black hover:bg-slate-200 font-bold rounded-full h-11 text-base"
            >
              {followActionInProgress && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              Unfollow
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowUnfollowDialog(false)}
              disabled={followActionInProgress}
              className="border-slate-600 hover:bg-white/10 text-white font-bold rounded-full h-11 text-base bg-transparent"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}