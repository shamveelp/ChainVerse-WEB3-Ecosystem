import { IPost } from "../../../../models/post.models";
import { IComment } from "../../../../models/comment.models";
import { ILike } from "../../../../models/like.models";
import { PostStatsDto, PostsListResponseDto } from "../../../../dtos/posts/Post.dto";

export interface IPostRepository {
    // Post CRUD operations
    createPost(userId: string, content: string, mediaUrls: string[], mediaType: 'none' | 'image' | 'video'): Promise<IPost>;
    findPostById(postId: string): Promise<IPost | null>;
    updatePost(postId: string, updateData: Partial<IPost>): Promise<IPost | null>;
    deletePost(postId: string, userId: string): Promise<boolean>;
    deletePostByAdmin(postId: string, adminId: string, reason?: string): Promise<boolean>;

    // Post queries
    getFeedPosts(userId: string, cursor?: string, limit?: number): Promise<{ posts: IPost[]; hasMore: boolean; nextCursor?: string }>;
    getCommunityFeedPosts(communityId: string, cursor?: string, limit?: number): Promise<{ posts: IPost[]; hasMore: boolean; nextCursor?: string }>;
    getCommunityMembersPosts(communityId: string, cursor?: string, limit?: number): Promise<{ posts: IPost[]; hasMore: boolean; nextCursor?: string }>;
    getUserPosts(targetUserId: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<{ posts: IPost[]; hasMore: boolean; nextCursor?: string }>;
    getLikedPosts(targetUserId: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<{ posts: IPost[]; hasMore: boolean; nextCursor?: string }>;
    getGlobalPosts(cursor?: string, limit?: number): Promise<{ posts: IPost[]; hasMore: boolean; nextCursor?: string }>;
    getTrendingPosts(cursor?: string, limit?: number): Promise<{ posts: IPost[]; hasMore: boolean; nextCursor?: string }>;
    getPostsByHashtag(hashtag: string, cursor?: string, limit?: number): Promise<{ posts: IPost[]; hasMore: boolean; nextCursor?: string }>;
    searchPosts(query: string, cursor?: string, limit?: number): Promise<{ posts: IPost[]; hasMore: boolean; nextCursor?: string }>;
    getPostsByUserIds(userIds: string[], cursor?: string, limit?: number): Promise<{ posts: IPost[]; hasMore: boolean; nextCursor?: string }>;

    // Like operations
    likePost(userId: string, postId: string): Promise<void>;
    unlikePost(userId: string, postId: string): Promise<void>;
    checkIfLiked(userId: string, postId: string): Promise<boolean>;
    getPostLikes(postId: string, cursor?: string, limit?: number): Promise<{ likes: ILike[]; hasMore: boolean; nextCursor?: string }>;

    // Comment operations
    createComment(userId: string, postId: string, content: string, parentCommentId?: string, postedAsCommunity?: boolean, communityId?: string): Promise<IComment>;
    findCommentById(commentId: string): Promise<IComment | null>;
    updateComment(commentId: string, content: string): Promise<IComment | null>;
    deleteComment(commentId: string, userId: string): Promise<boolean>;
    getPostComments(postId: string, cursor?: string, limit?: number): Promise<{ comments: IComment[]; hasMore: boolean; nextCursor?: string }>;
    getCommentReplies(commentId: string, cursor?: string, limit?: number): Promise<{ comments: IComment[]; hasMore: boolean; nextCursor?: string }>;

    // Comment like operations
    likeComment(userId: string, commentId: string): Promise<void>;
    unlikeComment(userId: string, commentId: string): Promise<void>;
    checkIfCommentLiked(userId: string, commentId: string): Promise<boolean>;

    // Utility methods
    updatePostCounts(postId: string, field: 'likesCount' | 'commentsCount' | 'sharesCount', increment: number): Promise<void>;

    // Analytics
    getPostStats(userId?: string): Promise<PostStatsDto>;
    getPostCountByUsers(userIds: string[]): Promise<number>;
    getPostCountByUsersAfterDate(userIds: string[], date: Date): Promise<number>;
    getPopularHashtags(limit?: number): Promise<string[]>;
}