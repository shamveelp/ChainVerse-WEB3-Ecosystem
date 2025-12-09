
export interface IAdminCommunityPostRepository {
    getAllPosts(cursor?: string, limit?: number, type?: 'all' | 'user' | 'admin'): Promise<{
        posts: any[];
        nextCursor?: string;
        hasMore: boolean;
    }>;
    softDeletePost(postId: string, type: 'user' | 'admin'): Promise<boolean>;
    getPostDetails(postId: string, type: 'user' | 'admin'): Promise<any>;
    getPostComments(postId: string, type: 'user' | 'admin', cursor?: string, limit?: number): Promise<{
        comments: any[];
        nextCursor?: string;
        hasMore: boolean;
    }>;
    getPostLikers(postId: string, type: 'user' | 'admin', cursor?: string, limit?: number): Promise<{
        likers: any[];
        nextCursor?: string;
        hasMore: boolean;
    }>;
}
