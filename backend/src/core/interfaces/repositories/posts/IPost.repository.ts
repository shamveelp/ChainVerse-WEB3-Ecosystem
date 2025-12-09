import { IPost } from "../../../../models/post.models";
import { IComment } from "../../../../models/comment.models";

export interface IPostRepository {
    // Post CRUD operations
    createPost(userId: string, content: string, mediaUrls: string[], mediaType: 'none' | 'image' | 'video'): Promise<IPost>;
    findPostById(postId: string): Promise<IPost | null>;
    updatePost(postId: string, updateData: any): Promise<IPost | null>;
    deletePost(postId: string, userId: string): Promise<boolean>;
    deletePostByAdmin(postId: string, adminId: string, reason?: string): Promise<boolean>;

    // Post queries
    getFeedPosts(userId: string, cursor?: string, limit?: number): Promise<any>;
    getCommunityFeedPosts(communityId: string, cursor?: string, limit?: number): Promise<any>;
    getCommunityMembersPosts(communityId: string, cursor?: string, limit?: number): Promise<any>;
    getUserPosts(targetUserId: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<any>;
    getLikedPosts(targetUserId: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<any>;
    getTrendingPosts(cursor?: string, limit?: number): Promise<any>;
    getPostsByHashtag(hashtag: string, cursor?: string, limit?: number): Promise<any>;
    searchPosts(query: string, cursor?: string, limit?: number): Promise<any>;
    getPostsByUserIds(userIds: string[], cursor?: string, limit?: number): Promise<any>;

    // Like operations
    likePost(userId: string, postId: string): Promise<void>;
    unlikePost(userId: string, postId: string): Promise<void>;
    checkIfLiked(userId: string, postId: string): Promise<boolean>;
    getPostLikes(postId: string, cursor?: string, limit?: number): Promise<any>;

    // Comment operations
    createComment(userId: string, postId: string, content: string, parentCommentId?: string): Promise<IComment>;
    findCommentById(commentId: string): Promise<IComment | null>;
    updateComment(commentId: string, content: string): Promise<IComment | null>;
    deleteComment(commentId: string, userId: string): Promise<boolean>;
    getPostComments(postId: string, cursor?: string, limit?: number): Promise<any>;
    getCommentReplies(commentId: string, cursor?: string, limit?: number): Promise<any>;

    // Comment like operations
    likeComment(userId: string, commentId: string): Promise<void>;
    unlikeComment(userId: string, commentId: string): Promise<void>;
    checkIfCommentLiked(userId: string, commentId: string): Promise<boolean>;

    // Utility methods
    updatePostCounts(postId: string, field: 'likesCount' | 'commentsCount' | 'sharesCount', increment: number): Promise<void>;

    // Analytics
    getPostStats(userId?: string): Promise<any>;
    getPostCountByUsers(userIds: string[]): Promise<number>;
    getPostCountByUsersAfterDate(userIds: string[], date: Date): Promise<number>;
    getPopularHashtags(limit?: number): Promise<string[]>;
}