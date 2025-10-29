import { IsString, IsArray, IsOptional, IsEnum, MaxLength, MinLength, IsMongoId, IsNumber, Min, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BaseResponseDto } from '../base/BaseResponse.dto';

// Create Community Admin Post DTO
export class CreateCommunityAdminPostDto {
    @IsString()
    @MinLength(1, { message: 'Content must not be empty' })
    @MaxLength(2000, { message: 'Content must not exceed 2000 characters' })
    @Transform(({ value }) => value?.trim())
    content!: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    mediaUrls?: string[] = [];

    @IsOptional()
    @IsEnum(['none', 'image', 'video'])
    mediaType?: 'none' | 'image' | 'video' = 'none';
}

// Update Community Admin Post DTO
export class UpdateCommunityAdminPostDto {
    @IsString()
    @MinLength(1, { message: 'Content must not be empty' })
    @MaxLength(2000, { message: 'Content must not exceed 2000 characters' })
    @Transform(({ value }) => value?.trim())
    content?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    mediaUrls?: string[];
}

// Get Community Admin Posts Query DTO
export class GetCommunityAdminPostsQueryDto {
    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1, { message: 'Limit must be at least 1' })
    limit?: number = 10;

    @IsOptional()
    @IsEnum(['all', 'media', 'likes'])
    type?: 'all' | 'media' | 'likes' = 'all';
}

// Community Admin Post Author DTO
export class CommunityAdminPostAuthorDto {
    _id: string;
    name: string;
    email: string;
    profilePic?: string;
    communityName?: string;
    communityLogo?: string;
    isVerified: boolean;

    constructor(admin: any, community?: any) {
        this._id = admin._id.toString();
        this.name = admin.name;
        this.email = admin.email;
        this.profilePic = admin.profilePic || '';
        this.communityName = community?.communityName || '';
        this.communityLogo = community?.logo || '';
        this.isVerified = community?.isVerified || false;
    }
}

// Community Admin Post Response DTO
export class CommunityAdminPostResponseDto {
    _id: string;
    author: CommunityAdminPostAuthorDto;
    content: string;
    mediaUrls: string[];
    mediaType: 'none' | 'image' | 'video';
    hashtags: string[];
    mentions: string[];
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    isLiked: boolean;
    isOwnPost: boolean;
    canEdit: boolean;
    canDelete: boolean;
    createdAt: Date;
    updatedAt: Date;
    editedAt?: Date;

    constructor(post: any, currentAdminId: string, isLiked: boolean = false) {
        this._id = post._id.toString();
        this.author = new CommunityAdminPostAuthorDto(post.author, post.community);
        this.content = post.content;
        this.mediaUrls = post.mediaUrls || [];
        this.mediaType = post.mediaType || 'none';
        this.hashtags = post.hashtags || [];
        this.mentions = post.mentions || [];
        this.likesCount = post.likesCount || 0;
        this.commentsCount = post.commentsCount || 0;
        this.sharesCount = post.sharesCount || 0;
        this.isLiked = isLiked;
        this.isOwnPost = post.author._id.toString() === currentAdminId;
        this.canEdit = this.isOwnPost;
        this.canDelete = this.isOwnPost;
        this.createdAt = post.createdAt;
        this.updatedAt = post.updatedAt;
        this.editedAt = post.editedAt;
    }
}

// Community Admin Posts List Response DTO
export class CommunityAdminPostsListResponseDto extends BaseResponseDto {
    posts: CommunityAdminPostResponseDto[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;

    constructor(posts: CommunityAdminPostResponseDto[], hasMore: boolean, nextCursor?: string, totalCount: number = 0) {
        super(true, 'Posts retrieved successfully');
        this.posts = posts;
        this.hasMore = hasMore;
        this.nextCursor = nextCursor;
        this.totalCount = totalCount;
    }
}

// Community Admin Comment DTO
export class CommunityAdminCommentDto {
    @IsMongoId()
    postId!: string;

    @IsString()
    @MinLength(1, { message: 'Comment content must not be empty' })
    @MaxLength(1000, { message: 'Comment must not exceed 1000 characters' })
    @Transform(({ value }) => value?.trim())
    content!: string;

    @IsOptional()
    @IsMongoId()
    parentCommentId?: string;
}

// Community Admin Comment Response DTO
export class CommunityAdminCommentResponseDto {
    _id: string;
    post: string;
    author: CommunityAdminPostAuthorDto;
    content: string;
    parentComment?: string;
    likesCount: number;
    repliesCount: number;
    isLiked: boolean;
    isOwnComment: boolean;
    canEdit: boolean;
    canDelete: boolean;
    createdAt: Date;
    updatedAt: Date;
    editedAt?: Date;
    replies?: CommunityAdminCommentResponseDto[];

    constructor(comment: any, currentAdminId: string, isLiked: boolean = false) {
        this._id = comment._id.toString();
        this.post = comment.post.toString();
        this.author = new CommunityAdminPostAuthorDto(comment.author, comment.community);
        this.content = comment.content;
        this.parentComment = comment.parentComment?.toString();
        this.likesCount = comment.likesCount || 0;
        this.repliesCount = comment.repliesCount || 0;
        this.isLiked = isLiked;
        this.isOwnComment = comment.author._id.toString() === currentAdminId;
        this.canEdit = this.isOwnComment;
        this.canDelete = this.isOwnComment;
        this.createdAt = comment.createdAt;
        this.updatedAt = comment.updatedAt;
        this.editedAt = comment.editedAt;
        this.replies = comment.replies?.map((reply: any) => 
            new CommunityAdminCommentResponseDto(reply, currentAdminId, isLiked)
        ) || [];
    }
}