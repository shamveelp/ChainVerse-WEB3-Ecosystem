
import { AdminCommunityPostListResponseDto } from "../../../../dtos/admin/AdminCommunityPost.dto";

export interface IAdminCommunityPostService {
    getAllPosts(cursor?: string, limit?: number, type?: 'all' | 'user' | 'admin'): Promise<AdminCommunityPostListResponseDto>;
    softDeletePost(postId: string, type: 'user' | 'admin'): Promise<boolean>;
    getPostDetails(postId: string, type: 'user' | 'admin'): Promise<any>;
}
