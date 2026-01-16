import API from "@/lib/api-client";
import { USER_API_ROUTES } from "@/routes";
import { AxiosError } from "axios";

// Post interfaces
import {
  SearchUsersResponse,
  Post,
  Comment,
  PostsListResponse,
  CommentsListResponse,
  PostDetailResponse,
  LikeResponse,
  ShareResponse,
  MediaUploadResponse,
  PostStats,
  CreatePostData,
  CreateCommentData
} from "@/types/user/posts.types";

interface ApiErrorData {
  error?: string;
  message?: string;
}

// Helper function to handle API errors
const handleApiError = (error: AxiosError<ApiErrorData>, defaultMessage: string) => {
  console.error("Posts API Error:", {
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    message: error.message,
    url: error.config?.url,
    method: error.config?.method
  });

  if (error.response) {
    if (error.response.status === 401) {
      throw new Error("User not authenticated");
    }

    if (error.response.status === 403) {
      throw new Error("Access forbidden");
    }

    if (error.response.status === 404) {
      throw new Error("Resource not found");
    }

    if (error.response.status === 429) {
      throw new Error("Too many requests. Please try again later");
    }

    if (error.response.status >= 500) {
      throw new Error("Server error. Please try again later");
    }
  }

  const errorMessage = error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    defaultMessage;
  throw new Error(errorMessage);
};

// Helper function to transform post data
const transformPostData = (data: Partial<Post> & Record<string, unknown>): Post => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid post data received');
  }

  return {
    _id: data._id as string || '',
    author: {
      _id: (data.author as any)?._id || '',
      username: (data.author as any)?.username || '',
      name: (data.author as any)?.name || '',
      profilePic: (data.author as any)?.profilePic || '',
      isVerified: Boolean((data.author as any)?.isVerified)
    },
    content: data.content as string || '',
    mediaUrls: Array.isArray(data.mediaUrls) ? data.mediaUrls as string[] : [],
    mediaType: data.mediaType as any || 'none',
    hashtags: Array.isArray(data.hashtags) ? data.hashtags as string[] : [],
    mentions: Array.isArray(data.mentions) ? data.mentions as string[] : [],
    likesCount: Number(data.likesCount) || 0,
    commentsCount: Number(data.commentsCount) || 0,
    sharesCount: Number(data.sharesCount) || 0,
    isLiked: Boolean(data.isLiked),
    isOwnPost: Boolean(data.isOwnPost),
    createdAt: data.createdAt as string || new Date().toISOString(),
    updatedAt: data.updatedAt as string || new Date().toISOString(),
    editedAt: data.editedAt as string
  };
};

// Helper function to transform comment data
const transformCommentData = (data: Partial<Comment> & Record<string, unknown>): Comment => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid comment data received');
  }

  const comment: Comment = {
    _id: data._id as string || '',
    post: data.post as string || '',
    author: {
      _id: (data.author as any)?._id || '',
      username: (data.author as any)?.username || '',
      name: (data.author as any)?.name || '',
      profilePic: (data.author as any)?.profilePic || '',
      isVerified: Boolean((data.author as any)?.isVerified)
    },
    content: data.content as string || '',
    parentComment: data.parentComment as string,
    likesCount: Number(data.likesCount) || 0,
    repliesCount: Number(data.repliesCount) || 0,
    isLiked: Boolean(data.isLiked),
    isOwnComment: Boolean(data.isOwnComment),
    postedAsCommunity: Boolean(data.postedAsCommunity),
    community: data.community ? {
      _id: (data.community as any)._id || '',
      username: (data.community as any).username || '',
      name: (data.community as any).name || '',
      profilePic: (data.community as any).profilePic || ''
    } : undefined,
    createdAt: data.createdAt as string || new Date().toISOString(),
    updatedAt: data.updatedAt as string || new Date().toISOString(),
    editedAt: data.editedAt as string,
    replies: []
  };

  if (data.replies && Array.isArray(data.replies)) {
    comment.replies = data.replies.map((reply: any) => transformCommentData(reply));
  }

  return comment;
};

export const postsApiService = {
  // Create post
  createPost: async (postData: CreatePostData): Promise<{ data: Post }> => {
    try {
      const response = await API.post(USER_API_ROUTES.POSTS_CREATE, postData);

      if (response.data?.success && response.data?.data) {
        const transformedData = transformPostData(response.data.data);
        return { data: transformedData };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to create post");
    } catch (error) {
      console.error('API: Create post failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to create post");
      throw error;
    }
  },

  // Get post by ID
  getPostById: async (postId: string): Promise<{ data: PostDetailResponse }> => {
    try {
      const response = await API.get(USER_API_ROUTES.POST_BY_ID(postId));

      if (response.data?.success && response.data?.data) {
        const transformedPost = transformPostData(response.data.data.post);
        const transformedComments = (response.data.data.comments || []).map((c: any) => transformCommentData(c));

        const result: PostDetailResponse = {
          post: transformedPost,
          comments: transformedComments,
          hasMoreComments: Boolean(response.data.data.hasMoreComments),
          nextCommentsCursor: response.data.data.nextCommentsCursor,
          totalCommentsCount: Number(response.data.data.totalCommentsCount) || 0
        };

        return { data: result };
      }

      throw new Error(response.data?.error || response.data?.message || "Post not found");
    } catch (error) {
      console.error(`API: Get post failed for ${postId}:`, error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch post");
      throw error;
    }
  },

  // Update post
  updatePost: async (postId: string, content: string, mediaUrls?: string[]): Promise<{ data: Post }> => {
    try {
      const response = await API.put(USER_API_ROUTES.POST_BY_ID(postId), {
        content,
        mediaUrls: mediaUrls || []
      });

      if (response.data?.success && response.data?.data) {
        const transformedData = transformPostData(response.data.data);
        return { data: transformedData };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to update post");
    } catch (error) {
      console.error('API: Update post failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to update post");
      throw error;
    }
  },

  // Delete post
  deletePost: async (postId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await API.delete(USER_API_ROUTES.POST_BY_ID(postId));

      if (response.data?.success) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to delete post");
    } catch (error) {
      console.error('API: Delete post failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to delete post");
      throw error;
    }
  },

  // Get feed posts
  getFeedPosts: async (cursor?: string, limit: number = 10): Promise<PostsListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 20).toString());

      const response = await API.get(`${USER_API_ROUTES.POSTS_FEED}?${params.toString()}`);

      if (response.data?.success && response.data?.data) {
        const transformedPosts = (response.data.data.posts || []).map((p: any) => transformPostData(p));
        return {
          posts: transformedPosts,
          hasMore: Boolean(response.data.data.hasMore),
          nextCursor: response.data.data.nextCursor,
          totalCount: Number(response.data.data.totalCount) || 0
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch feed posts");
    } catch (error) {
      console.error('API: Get feed posts failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch feed posts");
      throw error;
    }
  },

  // Get user posts
  getUserPosts: async (userId: string, cursor?: string, limit: number = 10): Promise<PostsListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 20).toString());

      const response = await API.get(`${USER_API_ROUTES.POSTS_USER(userId)}?${params.toString()}`);

      if (response.data?.success && response.data?.data) {
        const transformedPosts = (response.data.data.posts || []).map((p: any) => transformPostData(p));
        return {
          posts: transformedPosts,
          hasMore: Boolean(response.data.data.hasMore),
          nextCursor: response.data.data.nextCursor,
          totalCount: Number(response.data.data.totalCount) || 0
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch user posts");
    } catch (error) {
      console.error('API: Get user posts failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch user posts");
      throw error;
    }
  },

  // Get liked posts
  getLikedPosts: async (userId: string, cursor?: string, limit: number = 10): Promise<PostsListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 20).toString());

      const response = await API.get(`${USER_API_ROUTES.POSTS_LIKED(userId)}?${params.toString()}`);

      if (response.data?.success && response.data?.data) {
        const transformedPosts = (response.data.data.posts || []).map((p: any) => transformPostData(p));
        return {
          posts: transformedPosts,
          hasMore: Boolean(response.data.data.hasMore),
          nextCursor: response.data.data.nextCursor,
          totalCount: Number(response.data.data.totalCount) || 0
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch liked posts");
    } catch (error) {
      console.error('API: Get liked posts failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch liked posts");
      throw error;
    }
  },

  // Get trending posts
  getTrendingPosts: async (cursor?: string, limit: number = 10): Promise<PostsListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 20).toString());

      const response = await API.get(`${USER_API_ROUTES.POSTS_TRENDING}?${params.toString()}`);

      if (response.data?.success && response.data?.data) {
        const transformedPosts = (response.data.data.posts || []).map((p: any) => transformPostData(p));
        return {
          posts: transformedPosts,
          hasMore: Boolean(response.data.data.hasMore),
          nextCursor: response.data.data.nextCursor,
          totalCount: Number(response.data.data.totalCount) || 0
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch trending posts");
    } catch (error) {
      console.error('API: Get trending posts failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch trending posts");
      throw error;
    }
  },

  // Search posts
  searchPosts: async (query: string, cursor?: string, limit: number = 10): Promise<PostsListResponse> => {
    try {
      const params = new URLSearchParams();
      params.append('q', query.trim());
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 20).toString());

      const response = await API.get(`${USER_API_ROUTES.POSTS_SEARCH}?${params.toString()}`);

      if (response.data?.success && response.data?.data) {
        const transformedPosts = (response.data.data.posts || []).map((p: any) => transformPostData(p));
        return {
          posts: transformedPosts,
          hasMore: Boolean(response.data.data.hasMore),
          nextCursor: response.data.data.nextCursor,
          totalCount: Number(response.data.data.totalCount) || 0
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to search posts");
    } catch (error) {
      console.error('API: Search posts failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to search posts");
      throw error;
    }
  },

  // Toggle post like
  togglePostLike: async (postId: string): Promise<LikeResponse> => {
    try {
      const response = await API.post(USER_API_ROUTES.POST_LIKE(postId));

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to toggle post like");
    } catch (error) {
      console.error('API: Toggle post like failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to toggle post like");
      throw error;
    }
  },

  // Create comment
  createComment: async (commentData: CreateCommentData): Promise<{ data: Comment }> => {
    try {
      const response = await API.post(USER_API_ROUTES.POST_COMMENTS_CREATE, commentData);

      if (response.data?.success && response.data?.data) {
        const transformedData = transformCommentData(response.data.data);
        return { data: transformedData };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to create comment");
    } catch (error) {
      console.error('API: Create comment failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to create comment");
      throw error;
    }
  },

  // Update comment
  updateComment: async (commentId: string, content: string): Promise<{ data: Comment }> => {
    try {
      const response = await API.put(USER_API_ROUTES.POST_COMMENT_UPDATE(commentId), { content });

      if (response.data?.success && response.data?.data) {
        const transformedData = transformCommentData(response.data.data);
        return { data: transformedData };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to update comment");
    } catch (error) {
      console.error('API: Update comment failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to update comment");
      throw error;
    }
  },

  // Delete comment
  deleteComment: async (commentId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await API.delete(USER_API_ROUTES.POST_COMMENT_DELETE(commentId));

      if (response.data?.success) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to delete comment");
    } catch (error) {
      console.error('API: Delete comment failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to delete comment");
      throw error;
    }
  },

  // Get post comments
  getPostComments: async (postId: string, cursor?: string, limit: number = 10): Promise<CommentsListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());

      const response = await API.get(`${USER_API_ROUTES.POST_COMMENTS(postId)}?${params.toString()}`);

      if (response.data?.success && response.data?.data) {
        const transformedComments = (response.data.data.comments || []).map((c: any) => transformCommentData(c));
        return {
          comments: transformedComments,
          hasMore: Boolean(response.data.data.hasMore),
          nextCursor: response.data.data.nextCursor,
          totalCount: Number(response.data.data.totalCount) || 0
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch post comments");
    } catch (error) {
      console.error('API: Get post comments failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch post comments");
      throw error;
    }
  },

  // Get comment replies
  getCommentReplies: async (commentId: string, cursor?: string, limit: number = 10): Promise<CommentsListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());

      const response = await API.get(`${USER_API_ROUTES.POST_COMMENT_REPLIES(commentId)}?${params.toString()}`);

      if (response.data?.success && response.data?.data) {
        const transformedComments = (response.data.data.comments || []).map((c: any) => transformCommentData(c));
        return {
          comments: transformedComments,
          hasMore: Boolean(response.data.data.hasMore),
          nextCursor: response.data.data.nextCursor,
          totalCount: Number(response.data.data.totalCount) || 0
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch comment replies");
    } catch (error) {
      console.error('API: Get comment replies failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch comment replies");
      throw error;
    }
  },

  // Toggle comment like
  toggleCommentLike: async (commentId: string): Promise<LikeResponse> => {
    try {
      const response = await API.post(USER_API_ROUTES.POST_COMMENT_LIKE(commentId));

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to toggle comment like");
    } catch (error) {
      console.error('API: Toggle comment like failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to toggle comment like");
      throw error;
    }
  },

  // Upload media
  uploadMedia: async (file: File): Promise<MediaUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('media', file);

      const response = await API.post(USER_API_ROUTES.POST_UPLOAD_MEDIA, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to upload media");
    } catch (error) {
      console.error('API: Upload media failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to upload media");
      throw error;
    }
  },

  // Share post
  sharePost: async (postId: string, shareText?: string): Promise<ShareResponse> => {
    try {
      const response = await API.post(USER_API_ROUTES.POST_SHARE, { postId, shareText });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to share post");
    } catch (error) {
      console.error('API: Share post failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to share post");
      throw error;
    }
  },

  // Get post stats
  getPostStats: async (userId?: string): Promise<PostStats> => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);

      const response = await API.get(`${USER_API_ROUTES.POST_STATS}?${params.toString()}`);

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch post stats");
    } catch (error) {
      console.error('API: Get post stats failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch post stats");
      throw error;
    }
  },

  // Get popular hashtags
  getPopularHashtags: async (limit: number = 10): Promise<string[]> => {
    try {
      const params = new URLSearchParams();
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());

      const response = await API.get(`${USER_API_ROUTES.POST_HASHTAGS_POPULAR}?${params.toString()}`);

      if (response.data?.success && response.data?.data) {
        return response.data.data.hashtags || [];
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch popular hashtags");
    } catch (error) {
      console.error('API: Get popular hashtags failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to fetch popular hashtags");
      throw error;
    }
  },

  // Utility functions
  formatTimeAgo: (date: Date | string): string => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = (now.getTime() - postDate.getTime()) / 1000;

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d`;
    } else {
      return postDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: postDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  },

  formatStats: (count: number): string => {
    if (typeof count !== 'number' || count < 0) return '0';

    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
  },

  extractHashtags: (content: string): string[] => {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const hashtags = content.match(hashtagRegex);
    return hashtags ? hashtags.map(tag => tag.slice(1).toLowerCase()) : [];
  },

  extractMentions: (content: string): string[] => {
    const mentionRegex = /@[a-zA-Z0-9_]+/g;
    const mentions = content.match(mentionRegex);
    return mentions ? mentions.map(mention => mention.slice(1).toLowerCase()) : [];
  },

  searchUsers: async (query: string, limit: number = 10): Promise<SearchUsersResponse> => {
    try {
      const params = new URLSearchParams();
      params.append('q', query.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());

      const response = await API.get(`${USER_API_ROUTES.COMMUNITY_SEARCH_USERS}?${params.toString()}`);

      if (response.data?.success) {
        return {
          success: true,
          users: response.data.users || []
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to search users");
    } catch (error) {
      console.error('API: Search users failed:', error);
      handleApiError(error as AxiosError<ApiErrorData>, "Failed to search users");
      throw error;
    }
  }
};
