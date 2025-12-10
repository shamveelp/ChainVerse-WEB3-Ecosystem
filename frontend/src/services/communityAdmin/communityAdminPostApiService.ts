import api from "@/lib/api-client";
import { COMMUNITY_ADMIN_API_ROUTES } from "@/routes";

// Types
interface PostAuthor {
    _id: string;
    name: string;
    email: string;
    profilePic?: string;
    communityName?: string;
    communityLogo?: string;
    isVerified: boolean;
}

interface CommunityAdminPost {
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
    canEdit: boolean;
    canDelete: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    editedAt?: Date | string;
}

interface CommunityAdminComment {
    _id: string;
    post: string;
    author: PostAuthor;
    content: string;
    parentComment?: string;
    likesCount: number;
    repliesCount: number;
    isLiked: boolean;
    isOwnComment: boolean;
    canEdit: boolean;
    canDelete: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    editedAt?: Date | string;
    replies?: CommunityAdminComment[];
}

interface PostsResponse {
    posts: CommunityAdminPost[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
}

interface CommentsResponse {
    comments: CommunityAdminComment[];
    hasMore: boolean;
    nextCursor?: string;
}

interface CreatePostData {
    content: string;
    mediaUrls?: string[];
    mediaType?: 'none' | 'image' | 'video';
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

interface MediaUploadResponse {
    success: boolean;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    message?: string;
    error?: string;
}

interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    error?: string;
    data?: T;
}

class CommunityAdminPostApiService {
    // private readonly baseUrl = '/api/community-admin';

    // Post CRUD operations
    async createPost(postData: CreatePostData): Promise<ApiResponse<CommunityAdminPost>> {
        try {
            const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.POSTS_CREATE, postData);
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error: any) {
            console.error("Create community admin post error:", error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error ||
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to create post",
            };
        }
    }

    async getPostById(postId: string): Promise<ApiResponse<CommunityAdminPost>> {
        try {
            const response = await api.get(COMMUNITY_ADMIN_API_ROUTES.POST_BY_ID(postId));
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error: any) {
            console.error("Get community admin post error:", error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error ||
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to get post",
            };
        }
    }

    async updatePost(postId: string, postData: { content: string; mediaUrls?: string[] }): Promise<ApiResponse<CommunityAdminPost>> {
        try {
            const response = await api.put(COMMUNITY_ADMIN_API_ROUTES.POST_BY_ID(postId), postData);
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error: any) {
            console.error("Update community admin post error:", error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error ||
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to update post",
            };
        }
    }

    async deletePost(postId: string): Promise<ApiResponse> {
        try {
            const response = await api.delete(COMMUNITY_ADMIN_API_ROUTES.POST_BY_ID(postId));
            return {
                success: true,
                message: response.data.message
            };
        } catch (error: any) {
            console.error("Delete community admin post error:", error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error ||
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to delete post",
            };
        }
    }

    async getAdminPosts(cursor?: string, limit: number = 10, type: string = 'all'): Promise<ApiResponse<PostsResponse>> {
        try {
            const params = new URLSearchParams();
            if (cursor) params.append('cursor', cursor);
            params.append('limit', limit.toString());
            params.append('type', type);

            const response = await api.get(`${COMMUNITY_ADMIN_API_ROUTES.POSTS}?${params.toString()}`);
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error: any) {
            console.error("Get community admin posts error:", error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error ||
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to get posts",
            };
        }
    }

    // Like operations
    async togglePostLike(postId: string): Promise<ApiResponse<LikeResponse>> {
        try {
            const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.POST_LIKE(postId));
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error: any) {
            console.error("Toggle community admin post like error:", error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error ||
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to toggle post like",
            };
        }
    }

    // Comment operations
    async createComment(commentData: CreateCommentData): Promise<ApiResponse<CommunityAdminComment>> {
        try {
            const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.POST_COMMENTS_CREATE, commentData);
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error: any) {
            console.error("Create community admin comment error:", error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error ||
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to create comment",
            };
        }
    }

    async getPostComments(postId: string, cursor?: string, limit: number = 10): Promise<ApiResponse<CommentsResponse>> {
        try {
            const params = new URLSearchParams();
            if (cursor) params.append('cursor', cursor);
            params.append('limit', limit.toString());

            const response = await api.get(`${COMMUNITY_ADMIN_API_ROUTES.POST_COMMENTS(postId)}?${params.toString()}`);
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error: any) {
            console.error("Get community admin post comments error:", error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error ||
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to get comments",
            };
        }
    }

    async toggleCommentLike(commentId: string): Promise<ApiResponse<LikeResponse>> {
        try {
            const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.POST_COMMENT_LIKE(commentId));
            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error: any) {
            console.error("Toggle community admin comment like error:", error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error ||
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to toggle comment like",
            };
        }
    }

    // Media upload
    async uploadPostMedia(file: File): Promise<MediaUploadResponse> {
        try {
            const formData = new FormData();
            formData.append('media', file);

            const response = await api.post(COMMUNITY_ADMIN_API_ROUTES.POST_UPLOAD_MEDIA, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            return response.data.data;
        } catch (error: any) {
            console.error("Upload community admin post media error:", error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error ||
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to upload media",
            };
        }
    }

    // Community members feed
    async getCommunityMembersFeed(cursor?: string, limit: number = 10): Promise<ApiResponse<any>> {
        try {
            const params = new URLSearchParams();
            if (cursor) params.append('cursor', cursor);
            params.append('limit', limit.toString());

            const response = await api.get(`${COMMUNITY_ADMIN_API_ROUTES.FEED_MEMBERS}?${params.toString()}`);
            return {
                success: true,
                data: response.data.data,
            };
        } catch (error: any) {
            console.error("Get community members feed error:", error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error ||
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to get community members feed",
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

export const communityAdminPostApiService = new CommunityAdminPostApiService();
export default communityAdminPostApiService;
export type { CommunityAdminPost, CommunityAdminComment, PostsResponse, CommentsResponse, CreatePostData, CreateCommentData };