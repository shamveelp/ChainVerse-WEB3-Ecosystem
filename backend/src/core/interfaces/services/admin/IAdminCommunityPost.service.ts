
import {
    AdminCommunityPostListResponseDto,
    AdminPostItemDto,
    AdminPostCommentDto,
    AdminPostLikerDto
} from "../../../../dtos/admin/AdminCommunityPost.dto";

export interface IAdminCommunityPostService {
    getAllPosts(cursor?: string, limit?: number, type?: 'all' | 'user' | 'admin', search?: string): Promise<AdminCommunityPostListResponseDto>;
    softDeletePost(postId: string, type: 'user' | 'admin'): Promise<boolean>;
    restorePost(postId: string, type: 'user' | 'admin'): Promise<boolean>;
    getPostDetails(postId: string, type: 'user' | 'admin'): Promise<AdminPostItemDto>;
    getPostComments(postId: string, type: 'user' | 'admin', cursor?: string, limit?: number): Promise<{
        comments: AdminPostCommentDto[];
        nextCursor?: string;
        hasMore: boolean;
    }>;
    getPostLikers(postId: string, type: 'user' | 'admin', cursor?: string, limit?: number): Promise<{
        likers: AdminPostLikerDto[];
        nextCursor?: string;
        hasMore: boolean;
    }>;
}
