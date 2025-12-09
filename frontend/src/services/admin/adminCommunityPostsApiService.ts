
import api from '@/lib/api-client';

export interface AdminPostItem {
    _id: string;
    content: string;
    author: {
        _id: string;
        username: string;
        email: string;
        profileImage?: string;
    };
    mediaUrls: string[];
    mediaType: string;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    isDeleted: boolean;
    postType: 'user' | 'admin';
}

export interface AdminPostsResponse {
    success: boolean;
    data: {
        posts: AdminPostItem[];
        nextCursor?: string;
        hasMore: boolean;
    };
}

export const adminCommunityPostsApiService = {
    getAllPosts: async (cursor?: string, limit: number = 10, type: 'all' | 'user' | 'admin' = 'all') => {
        const response = await api.get<AdminPostsResponse>(`/api/admin/community-posts`, {
            params: { cursor, limit, type }
        });
        return response.data;
    },

    softDeletePost: async (postId: string, type: 'user' | 'admin') => {
        const response = await api.delete(`/api/admin/community-posts/${postId}`, {
            data: { type } // Axios DELETE body
        });
        return response.data;
    },

    getPostDetails: async (postId: string, type: 'user' | 'admin') => {
        const response = await api.get(`/api/admin/community-posts/${postId}`, {
            params: { type }
        });
        return response.data;
    }
};
