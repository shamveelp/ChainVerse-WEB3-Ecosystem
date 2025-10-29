
import { ICommunityAdminPost } from "../../../../models/communityAdminPost.model";
import { ICommunityAdminComment } from "../../../../models/communityAdminComment.model";

export interface ICommunityAdminPostRepository {
    // Post CRUD operations
    createPost(adminId: string, content: string, mediaUrls?: string[], mediaType?: 'none' | 'image' | 'video'): Promise<ICommunityAdminPost>;
    findPostById(postId: string): Promise<ICommunityAdminPost | null>;
    updatePost(postId: string, adminId: string, updateData: Partial<ICommunityAdminPost>): Promise<ICommunityAdminPost | null>;
    deletePost(postId: string, adminId: string): Promise<boolean>;
    
    // Post queries
    getAdminPosts(adminId: string, cursor?: string, limit?: number, type?: string): Promise<{
        posts: ICommunityAdminPost[];
        hasMore: boolean;
        nextCursor?: string;
    }>;
    
    // Like operations
    likePost(adminId: string, postId: string): Promise<void>;
    unlikePost(adminId: string, postId: string): Promise<boolean>;
    checkIfLiked(adminId: string, postId: string): Promise<boolean>;
    
    // Comment operations
    createComment(adminId: string, postId: string, content: string, parentCommentId?: string): Promise<ICommunityAdminComment>;
    findCommentById(commentId: string): Promise<ICommunityAdminComment | null>;
    getPostComments(postId: string, cursor?: string, limit?: number): Promise<{
        comments: ICommunityAdminComment[];
        hasMore: boolean;
        nextCursor?: string;
    }>;
    
    // Comment like operations
    likeComment(adminId: string, commentId: string): Promise<void>;
    unlikeComment(adminId: string, commentId: string): Promise<boolean>;
    checkIfCommentLiked(adminId: string, commentId: string): Promise<boolean>;
}