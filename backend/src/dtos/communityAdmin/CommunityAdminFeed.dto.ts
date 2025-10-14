import { PostResponseDto } from '../posts/Post.dto';
import { BaseResponseDto } from '../base/BaseResponse.dto';

export interface CommunityFeedPostDto extends PostResponseDto {
    isCommunityPost: boolean;
    communityEngagement: {
        communityLikes: number;
        communityComments: number;
        communityShares: number;
    };
}

export interface CreateCommunityPostDto {
    content: string;
    mediaUrls?: string[];
    mediaType?: 'none' | 'image' | 'video';
    isPinned?: boolean;
    isAnnouncement?: boolean;
    targetAudience?: 'all' | 'premium' | 'moderators';
}

export interface UpdateCommunityPostDto {
    content?: string;
    mediaUrls?: string[];
    isPinned?: boolean;
    isAnnouncement?: boolean;
    targetAudience?: 'all' | 'premium' | 'moderators';
}

export class CommunityFeedResponseDto extends BaseResponseDto {
    posts: CommunityFeedPostDto[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;

    constructor(
        posts: CommunityFeedPostDto[],
        hasMore: boolean,
        totalCount: number,
        nextCursor?: string,
        message: string = 'Community feed retrieved successfully'
    ) {
        super(true, message);
        this.posts = posts;
        this.hasMore = hasMore;
        this.nextCursor = nextCursor;
        this.totalCount = totalCount;
    }
}

export class CreateCommunityPostResponseDto extends BaseResponseDto {
    post: CommunityFeedPostDto;

    constructor(post: CommunityFeedPostDto, message: string = 'Community post created successfully') {
        super(true, message);
        this.post = post;
    }
}