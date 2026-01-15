import {
    CreatePostDto,
    UpdatePostDto,
    CreateCommentDto,
    SharePostDto,
    PostResponseDto,
    PostsListResponseDto,
    CommentResponseDto,
    CommentsListResponseDto,
    LikeResponseDto,
    PostDetailResponseDto,
    ShareResponseDto,
    PostStatsDto,
    MediaUploadResponseDto,
    LikersListResponseDto
} from "../../../../dtos/posts/Post.dto";

export interface IPostService {
    // Post operations
    createPost(userId: string, data: CreatePostDto): Promise<PostResponseDto>;
    getPostById(postId: string, viewerUserId?: string): Promise<PostDetailResponseDto>;
    updatePost(postId: string, userId: string, data: UpdatePostDto): Promise<PostResponseDto>;
    deletePost(postId: string, userId: string): Promise<{ success: boolean; message: string }>;

    // Post queries
    getFeedPosts(userId: string, cursor?: string, limit?: number): Promise<PostsListResponseDto>;
    getUserPosts(targetUserId: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<PostsListResponseDto>;
    getLikedPosts(targetUserId: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<PostsListResponseDto>;
    getTrendingPosts(cursor?: string, limit?: number): Promise<PostsListResponseDto>;
    getPostsByHashtag(hashtag: string, cursor?: string, limit?: number): Promise<PostsListResponseDto>;
    searchPosts(query: string, cursor?: string, limit?: number): Promise<PostsListResponseDto>;

    // Like operations
    togglePostLike(userId: string, postId: string): Promise<LikeResponseDto>;
    toggleCommentLike(userId: string, commentId: string): Promise<LikeResponseDto>;
    getPostLikers(postId: string, cursor?: string, limit?: number): Promise<LikersListResponseDto>;

    // Comment operations
    createComment(userId: string, data: CreateCommentDto): Promise<CommentResponseDto>;
    updateComment(commentId: string, userId: string, content: string): Promise<CommentResponseDto>;
    deleteComment(commentId: string, userId: string): Promise<{ success: boolean; message: string }>;
    getPostComments(postId: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<CommentsListResponseDto>;
    getCommentReplies(commentId: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<CommentsListResponseDto>;

    // Media operations
    uploadPostMedia(file: Express.Multer.File): Promise<MediaUploadResponseDto>;

    // Share operations
    sharePost(userId: string, data: SharePostDto): Promise<ShareResponseDto>;

    // Analytics
    getPostStats(userId?: string): Promise<PostStatsDto>;
    getPopularHashtags(limit?: number): Promise<string[]>;
}