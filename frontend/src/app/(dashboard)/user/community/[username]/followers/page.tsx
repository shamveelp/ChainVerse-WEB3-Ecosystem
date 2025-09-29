"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Loader2, RefreshCw, Users } from 'lucide-react'
import { useFollow } from '@/hooks/useFollow'
import { useCommunityProfile } from '@/hooks/useCommunityProfile'
import { communityApiService } from '@/services/communityApiService'
import Sidebar from "@/components/community/sidebar"
import RightSidebar from "@/components/community/right-sidebar"

interface FollowersPageProps {
  params: {
    username: string
  }
}

export default function FollowersPage({ params }: FollowersPageProps) {
  const router = useRouter()
  const { username } = params
  const [profileName, setProfileName] = useState('')

  const {
    followersData,
    loadingFollowers,
    loadingMore,
    getUserFollowers,
    loadMoreFollowers,
    followUser,
    unfollowUser,
    updateUserFollowStatus,
    clearFollowersData,
    loading: followActionLoading
  } = useFollow()

  const { fetchCommunityProfileByUsername } = useCommunityProfile()

  // Fetch profile info and followers
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get profile info for the name
        const profileResult = await fetchCommunityProfileByUsername(username)
        if (profileResult) {
          setProfileName(profileResult.name || username)
        }

        // Get followers
        await getUserFollowers(username)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }

    fetchData()

    return () => {
      clearFollowersData()
    }
  }, [username])

  const handleFollowToggle = async (userToFollow: any) => {
    try {
      if (userToFollow.isFollowing) {
        const success = await unfollowUser(userToFollow.username)
        if (success) {
          updateUserFollowStatus(userToFollow._id, false)
        }
      } else {
        const success = await followUser(userToFollow.username)
        if (success) {
          updateUserFollowStatus(userToFollow._id, true)
        }
      }
    } catch (error) {
      console.error('Follow toggle error:', error)
    }
  }

  const handleLoadMore = () => {
    loadMoreFollowers(username)
  }

  const handleBackClick = () => {
    router.push(`/user/community/${username}`)
  }

  const handleProfileClick = (clickedUsername: string) => {
    router.push(`/user/community/${clickedUsername}`)
  }

  if (loadingFollowers && !followersData) {
    return (
      <div className="flex min-h-screen bg-slate-950">
        <Sidebar />
        <main className="flex-1 lg:ml-80 xl:mr-80 min-h-screen">
          <div className="max-w-2xl mx-auto h-screen overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto" />
                <p className="text-slate-400">Loading followers...</p>
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
                <h2 className="text-2xl font-bold text-white">Followers</h2>
                <p className="text-slate-400">
                  {profileName && `@${username}`}
                  {followersData && (
                    <span className="ml-2">• {communityApiService.formatStats(followersData.totalCount)} followers</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="pb-6">
            {followersData && followersData.users.length > 0 ? (
              <div className="space-y-0">
                {followersData.users.map((follower) => (
                  <div
                    key={follower._id}
                    className="flex items-center justify-between p-4 border-b border-slate-700/50 hover:bg-slate-900/30 transition-colors"
                  >
                    <div 
                      className="flex items-center space-x-3 flex-1 cursor-pointer"
                      onClick={() => handleProfileClick(follower.username)}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage
                          src={follower.profilePic}
                          alt={follower.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
                          {follower.name.charAt(0)?.toUpperCase() || follower.username.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-semibold truncate">
                            {follower.name}
                          </p>
                          {follower.isVerified && (
                            <div className="w-5 h-5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm truncate">@{follower.username}</p>
                        {follower.bio && (
                          <p className="text-slate-300 text-sm mt-1 line-clamp-2">{follower.bio}</p>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFollowToggle(follower)
                      }}
                      disabled={followActionLoading}
                      size="sm"
                      className={`ml-3 ${
                        follower.isFollowing
                          ? 'bg-slate-800 text-white hover:bg-red-600 hover:text-white border border-slate-600'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
                      }`}
                    >
                      {followActionLoading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      {follower.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  </div>
                ))}

                {/* Load More Button */}
                {followersData.hasMore && (
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
                <p className="text-lg text-slate-400">No followers yet</p>
                <p className="text-sm text-slate-500 mt-2">
                  When people follow @{username}, they'll appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  )
}