import { AxiosError } from 'axios';
import api from '@/lib/api-client';
import { ADMIN_API_ROUTES } from '../../routes/api.routes';

import {
    AdminPostItem,
    AdminPostsResponse,
    AdminCommentsResponse,
    AdminLikersResponse
} from '@/types/admin/posts.types';

interface ApiErrorData {
    error?: string;
    message?: string;
}

export const adminCommunityPostsApiService = {
    getAllPosts: async (cursor?: string, limit: number = 10, type: 'all' | 'user' | 'admin' = 'all', search?: string) => {
        try {
            const response = await api.get<AdminPostsResponse>(ADMIN_API_ROUTES.COMMUNITY_POSTS, {
                params: { cursor, limit, type, search }
            });
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorData>;
            console.error("Get all posts error:", axiosError.response?.data || axiosError.message);
            throw axiosError;
        }
    },

    softDeletePost: async (postId: string, type: 'user' | 'admin') => {
        try {
            const response = await api.delete(ADMIN_API_ROUTES.COMMUNITY_POST_BY_ID(postId), {
                data: { type }
            });
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorData>;
            console.error("Soft delete post error:", axiosError.response?.data || axiosError.message);
            throw axiosError;
        }
    },

    restorePost: async (postId: string, type: 'user' | 'admin') => {
        try {
            const response = await api.patch(ADMIN_API_ROUTES.COMMUNITY_POST_RESTORE(postId), {
                type
            });
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorData>;
            console.error("Restore post error:", axiosError.response?.data || axiosError.message);
            throw axiosError;
        }
    },

    getPostDetails: async (postId: string, type: 'user' | 'admin') => {
        try {
            const response = await api.get(ADMIN_API_ROUTES.COMMUNITY_POST_BY_ID(postId), {
                params: { type }
            });
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorData>;
            console.error("Get post details error:", axiosError.response?.data || axiosError.message);
            throw axiosError;
        }
    },

    getPostComments: async (postId: string, type: 'user' | 'admin', cursor?: string, limit: number = 10) => {
        try {
            const response = await api.get<AdminCommentsResponse>(ADMIN_API_ROUTES.COMMUNITY_POST_COMMENTS(postId), {
                params: { type, cursor, limit }
            });
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorData>;
            console.error("Get post comments error:", axiosError.response?.data || axiosError.message);
            throw axiosError;
        }
    },

    getPostLikers: async (postId: string, type: 'user' | 'admin', cursor?: string, limit: number = 10) => {
        try {
            const response = await api.get<AdminLikersResponse>(ADMIN_API_ROUTES.COMMUNITY_POST_LIKERS(postId), {
                params: { type, cursor, limit }
            });
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError<ApiErrorData>;
            console.error("Get post likers error:", axiosError.response?.data || axiosError.message);
            throw axiosError;
        }
    }
};
