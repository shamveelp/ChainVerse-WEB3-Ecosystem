"use client"

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Loader2, Users } from 'lucide-react'
import { useFollow } from '@/hooks/useFollow'
import { useCommunityProfile } from '@/hooks/useCommunityProfile'
import { communityApiService, type UserFollowInfo } from '@/services/communityApiService'
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

interface FollowingPageProps {
  params: Promise<{
    username: string
  }>
}

export default function FollowingPage({ params }: FollowingPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { username } = resolvedParams

  const [profileName, setProfileName] = useState('')
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false)
  const [userToUnfollow, setUserToUnfollow] = useState<UserFollowInfo | null>(null)

  const {
    followingData,
    loadingFollowing,
    loadingMore,
    getUserFollowing,
    loadMoreFollowing,
    followUser,
    unfollowUser,
    updateUserFollowStatus,
    clearFollowingData,
    loading: followActionLoading
  } = useFollow()

  const { fetchCommunityProfileByUsername } = useCommunityProfile()

  // Fetch profile info and following
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get profile info for the name
        const profileResult = await fetchCommunityProfileByUsername(username)
        if (profileResult) {
          setProfileName(profileResult.name || username)
        }

        // Get following
        await getUserFollowing(username)
      } catch (error: unknown) {
        console.error('Failed to fetch data:', error)
        const errorMessage = error instanceof Error ? error.message : 'Please try again'
        toast.error('Failed to load following', {
          description: errorMessage
        })
      }
    }

    fetchData()

    return () => {
      clearFollowingData()
    }
  }, [username])

  const handleFollowClick = async (userToFollow: UserFollowInfo) => {
    try {
      const success = await followUser(userToFollow.username)
      if (success) {
        updateUserFollowStatus(userToFollow._id, true)
        toast.success(`You are now following @${userToFollow.username}`)
      }
    } catch (error: unknown) {
      console.error('Follow error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Please try again'
      toast.error('Failed to follow user', {
        description: errorMessage
      })
    }
  }

  const handleUnfollowClick = (userToFollow: UserFollowInfo) => {
    setUserToUnfollow(userToFollow)
    setShowUnfollowDialog(true)
  }

  const handleUnfollowConfirm = async () => {
    if (!userToUnfollow) return

    try {
      const success = await unfollowUser(userToUnfollow.username)
      if (success) {
        updateUserFollowStatus(userToUnfollow._id, false)
        toast.success(`You unfollowed @${userToUnfollow.username}`)
        setShowUnfollowDialog(false)
        setUserToUnfollow(null)
      }
    } catch (error: unknown) {
      console.error('Unfollow error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Please try again'
      toast.error('Failed to unfollow user', {
        description: errorMessage
      })
    }
  }

  const handleFollowToggle = async (userToFollow: UserFollowInfo) => {
    if (userToFollow.isFollowing) {
      handleUnfollowClick(userToFollow)
    } else {
      handleFollowClick(userToFollow)
    }
  }

  const handleLoadMore = () => {
    if (followingData?.hasMore && !loadingMore) {
      loadMoreFollowing(username)
    }
  }

  const handleBackClick = () => {
    router.push(`/user/community/${username}`)
  }

  const handleProfileClick = (clickedUsername: string) => {
    router.push(`/user/community/${clickedUsername}`)
  }

  if (loadingFollowing && !followingData) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
          <div className="max-w-2xl mx-auto h-screen overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto" />
                <p className="text-slate-400">Loading following...</p>
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
          {/* Header */}
          <div className="sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-slate-700/50 p-4 z-10">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackClick}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-white">Following</h2>
                <p className="text-slate-400">
                  {profileName && `@${username}`}
                  {followingData && (
                    <span className="ml-2">• {communityApiService.formatStats(followingData.totalCount)} following</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="pb-6">
            {followingData && followingData.users.length > 0 ? (
              <div className="space-y-0">
                {followingData.users.map((following) => (
                  <div
                    key={following._id}
                    className="flex items-center justify-between p-4 border-b border-slate-700/50 hover:bg-slate-900/30 transition-colors"
                  >
                    <div
                      className="flex items-center space-x-3 flex-1 cursor-pointer"
                      onClick={() => handleProfileClick(following.username)}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage
                          src={following.profilePic}
                          alt={following.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
                          {following.name.charAt(0)?.toUpperCase() || following.username.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-semibold truncate">
                            {following.name}
                          </p>
                          {following.isVerified && (
                            <div className="w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm truncate">@{following.username}</p>
                        {following.bio && (
                          <p className="text-slate-300 text-sm mt-1 line-clamp-2">{following.bio}</p>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFollowToggle(following)
                      }}
                      disabled={followActionLoading}
                      size="sm"
                      className={`ml-3 ${following.isFollowing
                          ? 'bg-slate-800 text-white hover:bg-red-600 hover:text-white border border-slate-600'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
                        }`}
                    >
                      {followActionLoading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      {following.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  </div>
                ))}

                {/* Load More Button */}
                {followingData.hasMore && (
                  <div className="flex justify-center p-6">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      variant="outline"
                      className="border-slate-600 hover:bg-slate-800"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-24">
                <Users className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <p className="text-lg text-slate-400">Not following anyone yet</p>
                <p className="text-sm text-slate-500 mt-2">
                  When @{username} follows people, they'll appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />

      {/* Unfollow Confirmation Dialog */}
      <Dialog open={showUnfollowDialog} onOpenChange={setShowUnfollowDialog}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Unfollow @{userToUnfollow?.username}?
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Their posts will no longer show up in your timeline. You can still view their profile and posts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowUnfollowDialog(false)
                setUserToUnfollow(null)
              }}
              disabled={followActionLoading}
              className="border-slate-600 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnfollowConfirm}
              disabled={followActionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {followActionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Unfollow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}