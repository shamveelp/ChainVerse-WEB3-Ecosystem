
import api from '@/lib/api-client';
import { ADMIN_API_ROUTES } from '../../routes/api.routes';

import {
    AdminPostItem,
    AdminPostsResponse,
    AdminCommentsResponse,
    AdminLikersResponse
} from '@/types/admin/posts.types';


export const adminCommunityPostsApiService = {
    getAllPosts: async (cursor?: string, limit: number = 10, type: 'all' | 'user' | 'admin' = 'all', search?: string) => {
        const response = await api.get<AdminPostsResponse>(ADMIN_API_ROUTES.COMMUNITY_POSTS, {
            params: { cursor, limit, type, search }
        });
        return response.data;
    },

    softDeletePost: async (postId: string, type: 'user' | 'admin') => {
        const response = await api.delete(ADMIN_API_ROUTES.COMMUNITY_POST_BY_ID(postId), {
            data: { type } // Axios DELETE body
        });
        return response.data;
    },

    restorePost: async (postId: string, type: 'user' | 'admin') => {
        const response = await api.patch(ADMIN_API_ROUTES.COMMUNITY_POST_RESTORE(postId), {
            type
        });
        return response.data;
    },

    getPostDetails: async (postId: string, type: 'user' | 'admin') => {
        const response = await api.get(ADMIN_API_ROUTES.COMMUNITY_POST_BY_ID(postId), {
            params: { type }
        });
        return response.data;
    },

    getPostComments: async (postId: string, type: 'user' | 'admin', cursor?: string, limit: number = 10) => {
        const response = await api.get<AdminCommentsResponse>(ADMIN_API_ROUTES.COMMUNITY_POST_COMMENTS(postId), {
            params: { type, cursor, limit }
        });
        return response.data;
    },

    getPostLikers: async (postId: string, type: 'user' | 'admin', cursor?: string, limit: number = 10) => {
        const response = await api.get<AdminLikersResponse>(ADMIN_API_ROUTES.COMMUNITY_POST_LIKERS(postId), {
            params: { type, cursor, limit }
        });
        return response.data;
    }
};
