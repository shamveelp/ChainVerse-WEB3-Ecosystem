import { IPost } from "../../../models/post.models";
import { ILike } from "../../../models/like.models";
import { IComment } from "../../../models/comment.models";
import { ICommentLike } from "../../../models/commentLikes.model";
import { PostsListResponseDto, PostStatsDto } from "../../../dtos/posts/Post.dto";

export interface IPostRepository {
    // Post CRUD operations
    createPost(authorId: string, content: string, mediaUrls?: string[], mediaType?: 'none' | 'image' | 'video'): Promise<IPost>;
    findPostById(postId: string): Promise<IPost | null>;
    updatePost(postId: string, updateData: Partial<IPost>): Promise<IPost | null>;
    deletePost(postId: string, authorId: string): Promise<boolean>;

    // Post queries with pagination
    getFeedPosts(userId: string, cursor?: string, limit?: number): Promise<{ posts: IPost[], hasMore: boolean, nextCursor?: string }>;
    getUserPosts(userId: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<{ posts: IPost[], hasMore: boolean, nextCursor?: string }>;
    getLikedPosts(userId: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<{ posts: IPost[], hasMore: boolean, nextCursor?: string }>;
    getTrendingPosts(cursor?: string, limit?: number): Promise<{ posts: IPost[], hasMore: boolean, nextCursor?: string }>;
    getPostsByHashtag(hashtag: string, cursor?: string, limit?: number): Promise<{ posts: IPost[], hasMore: boolean, nextCursor?: string }>;
    searchPosts(query: string, cursor?: string, limit?: number): Promise<{ posts: IPost[], hasMore: boolean, nextCursor?: string }>;

    // Like operations
    likePost(userId: string, postId: string): Promise<ILike>;
    unlikePost(userId: string, postId: string): Promise<boolean>;
    checkIfLiked(userId: string, postId: string): Promise<boolean>;
    getPostLikes(postId: string, cursor?: string, limit?: number): Promise<{ likes: ILike[], hasMore: boolean, nextCursor?: string }>;

    // Comment operations
    createComment(authorId: string, postId: string, content: string, parentCommentId?: string): Promise<IComment>;
    findCommentById(commentId: string): Promise<IComment | null>;
    updateComment(commentId: string, content: string): Promise<IComment | null>;
    deleteComment(commentId: string, authorId: string): Promise<boolean>;
    getPostComments(postId: string, cursor?: string, limit?: number, parentCommentId?: string): Promise<{ comments: IComment[], hasMore: boolean, nextCursor?: string }>;
    getCommentReplies(commentId: string, cursor?: string, limit?: number): Promise<{ comments: IComment[], hasMore: boolean, nextCursor?: string }>;

    // Comment like operations
    likeComment(userId: string, commentId: string): Promise<ICommentLike>;
    unlikeComment(userId: string, commentId: string): Promise<boolean>;
    checkIfCommentLiked(userId: string, commentId: string): Promise<boolean>;

    // Count operations
    updatePostCounts(postId: string, field: 'likesCount' | 'commentsCount' | 'sharesCount', increment: number): Promise<void>;
    updateCommentCounts(commentId: string, field: 'likesCount' | 'repliesCount', increment: number): Promise<void>;

    // Analytics and stats
    getPostStats(userId?: string): Promise<PostStatsDto>;
    getPopularHashtags(limit?: number): Promise<string[]>;

    // Admin operations
    findPostsByUser(userId: string, includeDeleted?: boolean): Promise<IPost[]>;
    bulkDeletePosts(postIds: string[]): Promise<boolean>;

    getPostCountByUsersAfterDate(userIds: string[], date: Date): Promise<number>;
    deletePostByAdmin(postId: string, adminId: string, reason?: string): Promise<boolean>;
    getPostsByUserIds(userIds: string[], cursor?: string, limit?: number): Promise<PostsListResponseDto>;
    getPostCountByUsers(userIds: string[]): Promise<number>;
}