import api from "@/lib/api-client";

// Types
interface PostAuthor {
  _id: string;
  username: string;
  name: string;
  profilePic: string;
  isVerified: boolean;
  isCommunityMember: boolean;
}

interface CommunityPost {
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
  canModerate: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  editedAt?: Date | string;
}

interface CommunityFeedResponse {
  posts: CommunityPost[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount: number;
  communityStats: {
    totalMembers: number;
    activeMembersToday: number;
    postsToday: number;
    engagementRate: number;
  };
}

interface CreateCommentData {
  postId: string;
  content: string;
  parentCommentId?: string;
}

interface LikeResponse {
  success: boolean;
  isLiked: boolean;
  likesCount: number;
  message: string;
}

interface EngagementStats {
  period: 'today' | 'week' | 'month';
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  activeMembers: number;
  engagementRate: number;
  topHashtags: string[];
  memberActivity: Array<{
    date: string;
    posts: number;
    likes: number;
    comments: number;
    newMembers: number;
  }>;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

class CommunityAdminFeedApiService {
  private readonly baseUrl = '/api/community-admin';

  // Get community feed
  async getCommunityFeed(
    cursor?: string, 
    limit: number = 10, 
    type: 'all' | 'trending' | 'recent' = 'all'
  ): Promise<ApiResponse<CommunityFeedResponse>> {
    try {
      const params = new URLSearchParams();
      if (cursor) params.append('cursor', cursor);
      params.append('limit', limit.toString());
      params.append('type', type);

      const response = await api.get(`${this.baseUrl}/feed?${params.toString()}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error("Get community feed error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || 
               error.response?.data?.message || 
               error.message || 
               "Failed to get community feed",
      };
    }
  }

  // Toggle post like
  async togglePostLike(postId: string): Promise<ApiResponse<LikeResponse>> {
    try {
      const response = await api.post(`${this.baseUrl}/feed/posts/${postId}/like`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error("Toggle post like error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || 
               error.response?.data?.message || 
               error.message || 
               "Failed to toggle post like",
      };
    }
  }

  // Create comment
  async createComment(commentData: CreateCommentData): Promise<ApiResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/feed/comments`, commentData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error("Create comment error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || 
               error.response?.data?.message || 
               error.message || 
               "Failed to create comment",
      };
    }
  }

  // Pin post
  async pinPost(postId: string): Promise<ApiResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/feed/posts/${postId}/pin`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error("Pin post error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || 
               error.response?.data?.message || 
               error.message || 
               "Failed to pin post",
      };
    }
  }

  // Delete post
  async deletePost(postId: string, reason?: string): Promise<ApiResponse> {
    try {
      const response = await api.delete(`${this.baseUrl}/feed/posts/${postId}`, {
        data: { reason }
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: any) {
      console.error("Delete post error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || 
               error.response?.data?.message || 
               error.message || 
               "Failed to delete post",
      };
    }
  }

  // Get engagement stats
  async getEngagementStats(period: 'today' | 'week' | 'month' = 'week'): Promise<ApiResponse<EngagementStats>> {
    try {
      const response = await api.get(`${this.baseUrl}/engagement-stats?period=${period}`);
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error("Get engagement stats error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || 
               error.response?.data?.message || 
               error.message || 
               "Failed to get engagement stats",
      };
    }
  }

  // Helper functions
  formatTimeAgo(date: Date | string): string {
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
  }

  formatStats(count: number): string {
    if (typeof count !== 'number' || count < 0) return '0';

    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
  }
}

export const communityAdminFeedApiService = new CommunityAdminFeedApiService();
export default communityAdminFeedApiService;