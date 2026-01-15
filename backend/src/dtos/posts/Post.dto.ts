import { IsString, IsArray, IsOptional, IsEnum, MaxLength, MinLength, IsMongoId, IsNumber, Min } from 'class-validator';

// Create Post DTO
export class CreatePostDto {
    @IsString()
    @MinLength(1)
    @MaxLength(2000)
    content: string | undefined;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    mediaUrls?: string[] = [];

    @IsOptional()
    @IsEnum(['none', 'image', 'video'])
    mediaType?: 'none' | 'image' | 'video' = 'none';
}

// Update Post DTO
export class UpdatePostDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(2000)
    content?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    mediaUrls?: string[];
}

// Get Posts Query DTO
export class GetPostsQueryDto {
    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @IsEnum(['feed', 'user', 'likes', 'trending', 'hashtag'])
    type?: 'feed' | 'user' | 'likes' | 'trending' | 'hashtag' = 'feed';

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsString()
    hashtag?: string;
}

// Create Comment DTO
export class CreateCommentDto {
    @IsMongoId()
    postId: string | undefined;

    @IsString()
    @MinLength(1)
    @MaxLength(1000)
    content: string | undefined;

    @IsOptional()
    @IsMongoId()
    parentCommentId?: string;
}

// Update Comment DTO
export class UpdateCommentDto {
    @IsString()
    @MinLength(1)
    @MaxLength(1000)
    content: string | undefined;
}

// Get Comments Query DTO
export class GetCommentsQueryDto {
    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @IsMongoId()
    parentCommentId?: string;
}

// Like Action DTO
export class LikeActionDto {
    @IsMongoId()
    targetId: string | undefined; // Post ID or Comment ID

    @IsEnum(['post', 'comment'])
    targetType: 'post' | 'comment' | undefined;
}

// Share Post DTO
export class SharePostDto {
    @IsMongoId()
    postId: string | undefined;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    shareText?: string;
}

// Media Upload Response DTO
export class MediaUploadResponseDto {
    success: boolean | undefined;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    message?: string;
    error?: string;
}

// Author Info DTO
export class PostAuthorDto {
    _id: string | undefined;
    username: string | undefined;
    name: string | undefined;
    profilePic: string | undefined;
    isVerified: boolean | undefined;
}

// Post Response DTO
export class PostResponseDto {
    _id: string | undefined;
    author: PostAuthorDto | undefined;
    content: string | undefined;
    mediaUrls: string[] | undefined;
    mediaType: 'none' | 'image' | 'video' | undefined;
    hashtags: string[] | undefined;
    mentions: string[] | undefined;
    likesCount: number | undefined;
    commentsCount: number | undefined;
    sharesCount: number | undefined;
    isLiked: boolean | undefined;
    isOwnPost: boolean | undefined;
    createdAt: Date | undefined;
    updatedAt: Date | undefined;
    editedAt?: Date;
}

// Comment Response DTO
export class CommentResponseDto {
    _id: string | undefined;
    post: string | undefined;
    author: PostAuthorDto | undefined;
    content: string | undefined;
    parentComment?: string;
    likesCount: number | undefined;
    repliesCount: number | undefined;
    isLiked: boolean | undefined;
    isOwnComment: boolean | undefined;
    createdAt: Date | undefined;
    updatedAt: Date | undefined;
    editedAt?: Date;
    replies?: CommentResponseDto[];
    postedAsCommunity?: boolean;
    community?: {
        _id: string;
        username: string;
        name: string;
        profilePic: string;
    };
}

// Posts List Response DTO
export class PostsListResponseDto {
    posts!: PostResponseDto[];
    hasMore!: boolean;
    nextCursor?: string;
    totalCount?: number;
}

// Comments List Response DTO
export class CommentsListResponseDto {
    comments: CommentResponseDto[] | undefined;
    hasMore: boolean | undefined;
    nextCursor?: string;
    totalCount?: number;
}

// Like Response DTO
export class LikeResponseDto {
    success: boolean | undefined;
    isLiked: boolean | undefined;
    likesCount: number | undefined;
    message: string | undefined;
}

// Post Detail Response DTO
export class PostDetailResponseDto {
    post: PostResponseDto | undefined;
    comments: CommentResponseDto[] | undefined;
    hasMoreComments: boolean | undefined;
    nextCommentsCursor?: string;
    totalCommentsCount?: number;
}

// Share Response DTO
export class ShareResponseDto {
    success: boolean | undefined;
    shareUrl: string | undefined;
    sharesCount: number | undefined;
    message: string | undefined;
}

// Post Stats DTO
export class PostStatsDto {
    totalPosts: number | undefined;
    totalLikes: number | undefined;
    totalComments: number | undefined;
    totalShares: number | undefined;
    todayPosts: number | undefined;
    weekPosts: number | undefined;
}

// Post Liker DTO
export class PostLikerDto {
    _id: string | undefined;
    username: string | undefined;
    name: string | undefined;
    profilePic: string | undefined;
    isVerified: boolean | undefined;
    likedAt: Date | undefined;
}

// Likers List Response DTO
export class LikersListResponseDto {
    users: PostLikerDto[] | undefined;
    hasMore: boolean | undefined;
    nextCursor?: string;
    totalCount?: number;
}