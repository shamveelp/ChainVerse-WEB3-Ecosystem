import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { postsApiService, Post, PostsListResponse, CreatePostData } from '@/services/postsApiService';

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  // Create post
  const createPost = useCallback(async (postData: CreatePostData): Promise<Post | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await postsApiService.createPost(postData);
      const newPost = response.data;

      // Add new post to the beginning of the list
      setPosts(prevPosts => [newPost, ...prevPosts]);

      toast.success('Post created successfully!');
      return newPost;
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message || 'Failed to create post';
      setError(errorMessage);
      toast.error('Failed to create post', {
        description: errorMessage
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update post
  const updatePost = useCallback(async (postId: string, content: string, mediaUrls?: string[]): Promise<Post | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await postsApiService.updatePost(postId, content, mediaUrls);
      const updatedPost = response.data;

      // Update post in the list
      setPosts(prevPosts => prevPosts.map(post =>
        post._id === postId ? updatedPost : post
      ));

      toast.success('Post updated successfully!');
      return updatedPost;
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message || 'Failed to update post';
      setError(errorMessage);
      toast.error('Failed to update post', {
        description: errorMessage
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete post
  const deletePost = useCallback(async (postId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await postsApiService.deletePost(postId);

      // Remove post from the list
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));

      toast.success('Post deleted successfully!');
      return true;
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message || 'Failed to delete post';
      setError(errorMessage);
      toast.error('Failed to delete post', {
        description: errorMessage
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle post like
  const toggleLike = useCallback(async (postId: string): Promise<void> => {
    try {
      // Optimistic update
      setPosts(prevPosts => prevPosts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1
          };
        }
        return post;
      }));

      const response = await postsApiService.togglePostLike(postId);

      // Update with server response
      setPosts(prevPosts => prevPosts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            isLiked: response.isLiked,
            likesCount: response.likesCount
          };
        }
        return post;
      }));
    } catch (err) {
      // Revert optimistic update on error
      setPosts(prevPosts => prevPosts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likesCount: post.isLiked ? post.likesCount + 1 : post.likesCount - 1
          };
        }
        return post;
      }));

      const error = err as Error;
      const errorMessage = error.message || 'Failed to update like';
      toast.error('Failed to update like', {
        description: errorMessage
      });
    }
  }, []);

  // Load posts with pagination
  const loadPosts = useCallback(async (
    type: 'feed' | 'user' | 'liked' | 'trending' | 'search' = 'feed',
    refresh: boolean = false,
    userId?: string,
    query?: string
  ): Promise<void> => {
    try {
      setLoading(true);
      if (refresh) {
        setError(null);
      }

      const cursor = refresh ? undefined : nextCursor;
      let response: PostsListResponse;

      switch (type) {
        case 'feed':
          response = await postsApiService.getFeedPosts(cursor);
          break;
        case 'user':
          if (!userId) throw new Error('User ID is required');
          response = await postsApiService.getUserPosts(userId, cursor);
          break;
        case 'liked':
          if (!userId) throw new Error('User ID is required');
          response = await postsApiService.getLikedPosts(userId, cursor);
          break;
        case 'trending':
          response = await postsApiService.getTrendingPosts(cursor);
          break;
        case 'search':
          if (!query) throw new Error('Search query is required');
          response = await postsApiService.searchPosts(query, cursor);
          break;
        default:
          throw new Error('Invalid post type');
      }

      if (refresh) {
        setPosts(response.posts);
      } else {
        setPosts(prevPosts => [...prevPosts, ...response.posts]);
      }

      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message || 'Failed to load posts';
      setError(errorMessage);
      if (!refresh) {
        toast.error('Failed to load posts', {
          description: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  }, [nextCursor]);

  // Refresh posts
  const refreshPosts = useCallback(async (
    type: 'feed' | 'user' | 'liked' | 'trending' | 'search' = 'feed',
    userId?: string,
    query?: string
  ): Promise<void> => {
    setNextCursor(undefined);
    setHasMore(true);
    await loadPosts(type, true, userId, query);
  }, [loadPosts]);

  // Load more posts
  const loadMorePosts = useCallback(async (
    type: 'feed' | 'user' | 'liked' | 'trending' | 'search' = 'feed',
    userId?: string,
    query?: string
  ): Promise<void> => {
    if (!hasMore || loading) return;
    await loadPosts(type, false, userId, query);
  }, [loadPosts, hasMore, loading]);

  // Clear posts
  const clearPosts = useCallback(() => {
    setPosts([]);
    setHasMore(true);
    setNextCursor(undefined);
    setError(null);
  }, []);

  // Update post in list (for external updates)
  const updatePostInList = useCallback((updatedPost: Post) => {
    setPosts(prevPosts => prevPosts.map(post =>
      post._id === updatedPost._id ? updatedPost : post
    ));
  }, []);

  return {
    posts,
    loading,
    error,
    hasMore,
    nextCursor,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    loadPosts,
    refreshPosts,
    loadMorePosts,
    clearPosts,
    updatePostInList
  };
};

export default usePosts;