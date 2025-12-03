import API from "@/lib/api-client";

// Post interfaces
export interface PostAuthor {
  _id: string;
  username: string;
  name: string;
  profilePic: string;
  isVerified: boolean;
}

interface SearchUsersResponse {
  success: boolean;
  users: Array<{
    _id: string;
    username: string;
    name: string;
    profilePic: string;
    isVerified: boolean;
  }>;
}

export interface Post {
  _id: string;
  author: PostAuthor;
  content: string;
  mediaUrls: string[];
  mediaType: 'none' | 'image' | 'video';
  hashtags: string[];
  mentions: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked: boolean;
  isOwnPost: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  editedAt?: Date | string;
}

export interface Comment {
  _id: string;
  post: string;
  author: PostAuthor;
  content: string;
  parentComment?: string;
  likesCount: number;
  repliesCount: number;
  isLiked: boolean;
  isOwnComment: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  editedAt?: Date | string;
  replies?: Comment[];
}

export interface PostsListResponse {
  posts: Post[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount?: number;
}

export interface CommentsListResponse {
  comments: Comment[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount?: number;
}

export interface PostDetailResponse {
  post: Post;
  comments: Comment[];
  hasMoreComments: boolean;
  nextCommentsCursor?: string;
  totalCommentsCount?: number;
}

export interface LikeResponse {
  success: boolean;
  isLiked: boolean;
  likesCount: number;
  message: string;
}

export interface ShareResponse {
  success: boolean;
  shareUrl: string;
  sharesCount: number;
  message: string;
}

export interface MediaUploadResponse {
  success: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  message?: string;
  error?: string;
}

export interface PostStats {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  todayPosts: number;
  weekPosts: number;
}

export interface CreatePostData {
  content: string;
  mediaUrls?: string[];
  mediaType?: 'none' | 'image' | 'video';
}

export interface CreateCommentData {
  postId: string;
  content: string;
  parentCommentId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper function to handle API errors
const handleApiError = (error: any, defaultMessage: string) => {
  console.error("Posts API Error:", {
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    message: error.message,
    url: error.config?.url,
    method: error.config?.method
  });

  if (error.response?.status === 401) {
    throw new Error("User not authenticated");
  }

  if (error.response?.status === 403) {
    throw new Error("Access forbidden");
  }

  if (error.response?.status === 404) {
    throw new Error("Resource not found");
  }

  if (error.response?.status === 429) {
    throw new Error("Too many requests. Please try again later");
  }

  if (error.response?.status >= 500) {
    throw new Error("Server error. Please try again later");
  }

  const errorMessage = error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    defaultMessage;
  throw new Error(errorMessage);
};

// Helper function to transform post data
const transformPostData = (data: any): Post => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid post data received');
  }

  return {
    _id: data._id || '',
    author: {
      _id: data.author?._id || '',
      username: data.author?.username || '',
      name: data.author?.name || '',
      profilePic: data.author?.profilePic || '',
      isVerified: Boolean(data.author?.isVerified)
    },
    content: data.content || '',
    mediaUrls: Array.isArray(data.mediaUrls) ? data.mediaUrls : [],
    mediaType: data.mediaType || 'none',
    hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
    mentions: Array.isArray(data.mentions) ? data.mentions : [],
    likesCount: Number(data.likesCount) || 0,
    commentsCount: Number(data.commentsCount) || 0,
    sharesCount: Number(data.sharesCount) || 0,
    isLiked: Boolean(data.isLiked),
    isOwnPost: Boolean(data.isOwnPost),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    editedAt: data.editedAt
  };
};

// Helper function to transform comment data
const transformCommentData = (data: any): Comment => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid comment data received');
  }

  return {
    _id: data._id || '',
    post: data.post || '',
    author: {
      _id: data.author?._id || '',
      username: data.author?.username || '',
      name: data.author?.name || '',
      profilePic: data.author?.profilePic || '',
      isVerified: Boolean(data.author?.isVerified)
    },
    content: data.content || '',
    parentComment: data.parentComment,
    likesCount: Number(data.likesCount) || 0,
    repliesCount: Number(data.repliesCount) || 0,
    isLiked: Boolean(data.isLiked),
    isOwnComment: Boolean(data.isOwnComment),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    editedAt: data.editedAt,
    replies: data.replies ? data.replies.map(transformCommentData) : []
  };
};

export const postsApiService = {
  // Create post
  createPost: async (postData: CreatePostData): Promise<{ data: Post }> => {
    try {
      
      const response = await API.post("/api/user/posts/create", postData);
      

      if (response.data?.success && response.data?.data) {
        const transformedData = transformPostData(response.data.data);
        return { data: transformedData };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to create post");
    } catch (error: any) {
      console.error('API: Create post failed:', error);
      handleApiError(error, "Failed to create post");
      throw error;
    }
  },

  // Get post by ID
  getPostById: async (postId: string): Promise<{ data: PostDetailResponse }> => {
    try {
      
      const response = await API.get(`/api/user/posts/${postId}`);
      

      if (response.data?.success && response.data?.data) {
        const transformedPost = transformPostData(response.data.data.post);
        const transformedComments = response.data.data.comments.map(transformCommentData);

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
    } catch (error: any) {
      console.error(`API: Get post failed for ${postId}:`, error);
      handleApiError(error, "Failed to fetch post");
      throw error;
    }
  },

  // Update post
  updatePost: async (postId: string, content: string, mediaUrls?: string[]): Promise<{ data: Post }> => {
    try {
      
      const response = await API.put(`/api/user/posts/${postId}`, {
        content,
        mediaUrls: mediaUrls || []
      });
      

      if (response.data?.success && response.data?.data) {
        const transformedData = transformPostData(response.data.data);
        return { data: transformedData };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to update post");
    } catch (error: any) {
      console.error('API: Update post failed:', error);
      handleApiError(error, "Failed to update post");
      throw error;
    }
  },

  // Delete post
  deletePost: async (postId: string): Promise<{ success: boolean; message: string }> => {
    try {
      
      const response = await API.delete(`/api/user/posts/${postId}`);
      

      if (response.data?.success) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to delete post");
    } catch (error: any) {
      console.error('API: Delete post failed:', error);
      handleApiError(error, "Failed to delete post");
      throw error;
    }
  },

  // Get feed posts
  getFeedPosts: async (cursor?: string, limit: number = 10): Promise<PostsListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 20).toString());

      
      const response = await API.get(`/api/user/posts/feed/all?${params.toString()}`);
      

      if (response.data?.success && response.data?.data) {
        const transformedPosts = response.data.data.posts.map(transformPostData);
        return {
          posts: transformedPosts,
          hasMore: Boolean(response.data.data.hasMore),
          nextCursor: response.data.data.nextCursor,
          totalCount: Number(response.data.data.totalCount) || 0
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch feed posts");
    } catch (error: any) {
      console.error('API: Get feed posts failed:', error);
      handleApiError(error, "Failed to fetch feed posts");
      throw error;
    }
  },

  // Get user posts
  getUserPosts: async (userId: string, cursor?: string, limit: number = 10): Promise<PostsListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 20).toString());

      
      const response = await API.get(`/api/user/posts/user/${userId}/all?${params.toString()}`);
      

      if (response.data?.success && response.data?.data) {
        const transformedPosts = response.data.data.posts.map(transformPostData);
        return {
          posts: transformedPosts,
          hasMore: Boolean(response.data.data.hasMore),
          nextCursor: response.data.data.nextCursor,
          totalCount: Number(response.data.data.totalCount) || 0
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch user posts");
    } catch (error: any) {
      console.error('API: Get user posts failed:', error);
      handleApiError(error, "Failed to fetch user posts");
      throw error;
    }
  },

  // Get liked posts
  getLikedPosts: async (userId: string, cursor?: string, limit: number = 10): Promise<PostsListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 20).toString());

      
      const response = await API.get(`/api/user/posts/user/${userId}/liked?${params.toString()}`);
      

      if (response.data?.success && response.data?.data) {
        const transformedPosts = response.data.data.posts.map(transformPostData);
        return {
          posts: transformedPosts,
          hasMore: Boolean(response.data.data.hasMore),
          nextCursor: response.data.data.nextCursor,
          totalCount: Number(response.data.data.totalCount) || 0
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch liked posts");
    } catch (error: any) {
      console.error('API: Get liked posts failed:', error);
      handleApiError(error, "Failed to fetch liked posts");
      throw error;
    }
  },

  // Get trending posts
  getTrendingPosts: async (cursor?: string, limit: number = 10): Promise<PostsListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 20).toString());

      
      const response = await API.get(`/api/user/posts/trending/all?${params.toString()}`);
      

      if (response.data?.success && response.data?.data) {
        const transformedPosts = response.data.data.posts.map(transformPostData);
        return {
          posts: transformedPosts,
          hasMore: Boolean(response.data.data.hasMore),
          nextCursor: response.data.data.nextCursor,
          totalCount: Number(response.data.data.totalCount) || 0
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch trending posts");
    } catch (error: any) {
      console.error('API: Get trending posts failed:', error);
      handleApiError(error, "Failed to fetch trending posts");
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

      
      const response = await API.get(`/api/user/posts/search/all?${params.toString()}`);
      

      if (response.data?.success && response.data?.data) {
        const transformedPosts = response.data.data.posts.map(transformPostData);
        return {
          posts: transformedPosts,
          hasMore: Boolean(response.data.data.hasMore),
          nextCursor: response.data.data.nextCursor,
          totalCount: Number(response.data.data.totalCount) || 0
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to search posts");
    } catch (error: any) {
      console.error('API: Search posts failed:', error);
      handleApiError(error, "Failed to search posts");
      throw error;
    }
  },

  // Toggle post like
  togglePostLike: async (postId: string): Promise<LikeResponse> => {
    try {
      
      const response = await API.post(`/api/user/posts/${postId}/like`);
      

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to toggle post like");
    } catch (error: any) {
      console.error('API: Toggle post like failed:', error);
      handleApiError(error, "Failed to toggle post like");
      throw error;
    }
  },

  // Create comment
  createComment: async (commentData: CreateCommentData): Promise<{ data: Comment }> => {
    try {
      
      const response = await API.post("/api/user/posts/comments/create", commentData);
      

      if (response.data?.success && response.data?.data) {
        const transformedData = transformCommentData(response.data.data);
        return { data: transformedData };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to create comment");
    } catch (error: any) {
      console.error('API: Create comment failed:', error);
      handleApiError(error, "Failed to create comment");
      throw error;
    }
  },

  // Update comment
  updateComment: async (commentId: string, content: string): Promise<{ data: Comment }> => {
    try {
      
      const response = await API.put(`/api/user/posts/comments/${commentId}`, { content });
      

      if (response.data?.success && response.data?.data) {
        const transformedData = transformCommentData(response.data.data);
        return { data: transformedData };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to update comment");
    } catch (error: any) {
      console.error('API: Update comment failed:', error);
      handleApiError(error, "Failed to update comment");
      throw error;
    }
  },

  // Delete comment
  deleteComment: async (commentId: string): Promise<{ success: boolean; message: string }> => {
    try {
      
      const response = await API.delete(`/api/user/posts/comments/${commentId}`);
      

      if (response.data?.success) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to delete comment");
    } catch (error: any) {
      console.error('API: Delete comment failed:', error);
      handleApiError(error, "Failed to delete comment");
      throw error;
    }
  },

  // Get post comments
  getPostComments: async (postId: string, cursor?: string, limit: number = 10): Promise<CommentsListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());

      
      const response = await API.get(`/api/user/posts/${postId}/comments?${params.toString()}`);
      

      if (response.data?.success && response.data?.data) {
        const transformedComments = response.data.data.comments.map(transformCommentData);
        return {
          comments: transformedComments,
          hasMore: Boolean(response.data.data.hasMore),
          nextCursor: response.data.data.nextCursor,
          totalCount: Number(response.data.data.totalCount) || 0
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch post comments");
    } catch (error: any) {
      console.error('API: Get post comments failed:', error);
      handleApiError(error, "Failed to fetch post comments");
      throw error;
    }
  },

  // Get comment replies
  getCommentReplies: async (commentId: string, cursor?: string, limit: number = 10): Promise<CommentsListResponse> => {
    try {
      const params = new URLSearchParams();
      if (cursor && cursor.trim()) params.append('cursor', cursor.trim());
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());

    
      const response = await API.get(`/api/user/posts/comments/${commentId}/replies?${params.toString()}`);
      

      if (response.data?.success && response.data?.data) {
        const transformedComments = response.data.data.comments.map(transformCommentData);
        return {
          comments: transformedComments,
          hasMore: Boolean(response.data.data.hasMore),
          nextCursor: response.data.data.nextCursor,
          totalCount: Number(response.data.data.totalCount) || 0
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch comment replies");
    } catch (error: any) {
      console.error('API: Get comment replies failed:', error);
      handleApiError(error, "Failed to fetch comment replies");
      throw error;
    }
  },

  // Toggle comment like
  toggleCommentLike: async (commentId: string): Promise<LikeResponse> => {
    try {
      
      const response = await API.post(`/api/user/posts/comments/${commentId}/like`);
      

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to toggle comment like");
    } catch (error: any) {
      console.error('API: Toggle comment like failed:', error);
      handleApiError(error, "Failed to toggle comment like");
      throw error;
    }
  },

  // Upload media
  uploadMedia: async (file: File): Promise<MediaUploadResponse> => {
    try {
      
      const formData = new FormData();
      formData.append('media', file);

      const response = await API.post("/api/user/posts/upload-media", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to upload media");
    } catch (error: any) {
      console.error('API: Upload media failed:', error);
      handleApiError(error, "Failed to upload media");
      throw error;
    }
  },

  // Share post
  sharePost: async (postId: string, shareText?: string): Promise<ShareResponse> => {
    try {
      
      const response = await API.post("/api/user/posts/share", { postId, shareText });
      

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to share post");
    } catch (error: any) {
      console.error('API: Share post failed:', error);
      handleApiError(error, "Failed to share post");
      throw error;
    }
  },

  // Get post stats
  getPostStats: async (userId?: string): Promise<PostStats> => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);

      
      const response = await API.get(`/api/user/posts/stats/analytics?${params.toString()}`);
      

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch post stats");
    } catch (error: any) {
      console.error('API: Get post stats failed:', error);
      handleApiError(error, "Failed to fetch post stats");
      throw error;
    }
  },

  // Get popular hashtags
  getPopularHashtags: async (limit: number = 10): Promise<string[]> => {
    try {
      const params = new URLSearchParams();
      params.append('limit', Math.min(Math.max(limit, 1), 50).toString());

    
      const response = await API.get(`/api/user/posts/hashtags/popular?${params.toString()}`);
      

      if (response.data?.success && response.data?.data) {
        return response.data.data.hashtags || [];
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to fetch popular hashtags");
    } catch (error: any) {
      console.error('API: Get popular hashtags failed:', error);
      handleApiError(error, "Failed to fetch popular hashtags");
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

      const response = await API.get(`/api/user/community/search-users?${params.toString()}`);

      if (response.data?.success) {
        return {
          success: true,
          users: response.data.users || []
        };
      }

      throw new Error(response.data?.error || response.data?.message || "Failed to search users");
    } catch (error: any) {
      console.error('API: Search users failed:', error);
      handleApiError(error, "Failed to search users");
      throw error;
    }
  }
};