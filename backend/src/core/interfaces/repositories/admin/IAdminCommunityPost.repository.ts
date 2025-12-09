
export interface IAdminCommunityPostRepository {
    getAllPosts(cursor?: string, limit?: number, type?: 'all' | 'user' | 'admin'): Promise<{
        posts: any[];
        nextCursor?: string;
        hasMore: boolean;
    }>;
    softDeletePost(postId: string, type: 'user' | 'admin'): Promise<boolean>;
    getPostDetails(postId: string, type: 'user' | 'admin'): Promise<any>;
}
