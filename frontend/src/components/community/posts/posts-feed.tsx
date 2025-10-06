"use client"

import { useEffect, useCallback, useRef } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { Button } from "@/components/ui/button"
import PostCard from './post-card'
import { usePosts } from '@/hooks/usePosts'
import { Post } from '@/services/postsApiService'
import { cn } from '@/lib/utils'

interface PostsFeedProps {
  type?: 'feed' | 'user' | 'liked' | 'trending' | 'search';
  userId?: string;
  query?: string;
  className?: string;
  onPostClick?: (post: Post) => void;
}

export default function PostsFeed({ 
  type = 'feed', 
  userId, 
  query, 
  className,
  onPostClick 
}: PostsFeedProps) {
  const {
    posts,
    loading,
    error,
    hasMore,
    loadPosts,
    refreshPosts,
    loadMorePosts,
    toggleLike,
    updatePostInList,
    clearPosts
  } = usePosts()

  const observerRef = useRef<IntersectionObserver>(null)
  const lastPostElementRef = useRef<HTMLDivElement>(null)

  // Set up intersection observer for infinite scroll
  const lastPostRef = useCallback((node: HTMLDivElement) => {
    if (loading) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts(type, userId, query)
      }
    })
    
    if (node) observerRef.current.observe(node)
  }, [loading, hasMore, loadMorePosts, type, userId, query])

  // Load initial posts
  useEffect(() => {
    clearPosts()
    loadPosts(type, true, userId, query)
  }, [type, userId, query])

  const handleRefresh = async () => {
    await refreshPosts(type, userId, query)
  }

  const handlePostUpdate = (updatedPost: Post) => {
    updatePostInList(updatedPost)
  }

  const handlePostDelete = (postId: string) => {
    // Remove post from list
    // This will be handled by the usePosts hook
  }

  const handleLikeToggle = (postId: string, isLiked: boolean, likesCount: number) => {
    // Update post in list with new like status
    const updatedPost = posts.find(p => p._id === postId)
    if (updatedPost) {
      updatePostInList({
        ...updatedPost,
        isLiked,
        likesCount
      })
    }
  }

  if (error && posts.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 space-y-4", className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Something went wrong</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-slate-600 hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (loading && posts.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto" />
          <p className="text-slate-400">Loading posts...</p>
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12 space-y-4", className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-2">No posts yet</h3>
          <p className="text-slate-400 mb-4">
            {type === 'feed' && "Follow some users to see their posts in your feed"}
            {type === 'user' && "This user hasn't posted anything yet"}
            {type === 'liked' && "No liked posts yet"}
            {type === 'trending' && "No trending posts at the moment"}
            {type === 'search' && "No posts found for your search"}
          </p>
          {type === 'feed' && (
            <Button
              onClick={() => loadPosts('trending', true)}
              variant="outline"
              className="border-slate-600 hover:bg-slate-800"
            >
              Explore Trending Posts
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Refresh button */}
      <div className="flex justify-center">
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-white hover:bg-slate-800"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Posts list */}
      {posts.map((post, index) => (
        <div
          key={post._id}
          ref={index === posts.length - 1 ? lastPostRef : undefined}
        >
          <PostCard
            post={post}
            onLikeToggle={handleLikeToggle}
            onCommentClick={onPostClick}
            onPostUpdate={handlePostUpdate}
            onPostDelete={handlePostDelete}
          />
        </div>
      ))}

      {/* Loading more indicator */}
      {loading && posts.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-500 mx-auto" />
            <p className="text-slate-400 text-sm">Loading more posts...</p>
          </div>
        </div>
      )}

      {/* End of posts indicator */}
      {!hasMore && posts.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <p className="text-slate-500 text-sm">You've reached the end</p>
        </div>
      )}

      {/* Error loading more */}
      {error && posts.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <p className="text-red-400 text-sm">{error}</p>
            <Button
              onClick={() => loadMorePosts(type, userId, query)}
              variant="outline"
              size="sm"
              className="border-slate-600 hover:bg-slate-800"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}