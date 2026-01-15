import { IsString, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';

// Search DTOs
export class SearchCommunitiesDto {
    @IsString()
    query: string | undefined;

    @IsOptional()
    @IsString()
    @IsEnum(['all', 'communities', 'users'])
    type?: string = 'all';

    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number = 20;
}

export class JoinCommunityDto {
    @IsString()
    communityUsername: string | undefined;
}

export class LeaveCommunityDto {
    @IsString()
    communityUsername: string | undefined;
}

export class GetCommunityMembersDto {
    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number = 20;
}

// Response DTOs
export class CommunityCardDto {
    _id: string | undefined;
    communityName: string | undefined;
    username: string | undefined;
    description: string | undefined;
    category: string | undefined;
    logo: string | undefined;
    isVerified: boolean | undefined;
    memberCount: number | undefined;
    isMember: boolean | undefined;
    createdAt: Date | undefined;
}

export class CommunityProfileResponseDto {
    _id: string | undefined;
    communityName: string | undefined;
    username: string | undefined;
    description: string | undefined;
    category: string | undefined;
    logo: string | undefined;
    banner: string | undefined;
    isVerified: boolean | undefined;
    memberCount: number | undefined;
    rules: string[] | undefined;
    socialLinks: any[] | undefined;
    settings?: {
        allowChainCast: boolean;
        allowGroupChat: boolean;
        allowPosts: boolean;
        allowQuests: boolean;
    };
    createdAt: Date | undefined;
    isMember: boolean | undefined;
    memberRole?: string;
    isAdmin: boolean | undefined;
}

export class CommunityMemberResponseDto {
    _id: string | undefined;
    user?: {
        _id: string;
        username: string;
        name: string;
        profilePic: string;
        isVerified: boolean;
    };
    role: string | undefined;
    joinedAt: Date | undefined;
    isActive: boolean | undefined;
    totalPosts: number | undefined;
    totalLikes: number | undefined;
    totalComments: number | undefined;
}

export class CommunityJoinResponseDto {
    success: boolean | undefined;
    message: string | undefined;
    isMember: boolean | undefined;
    memberCount: number | undefined;
    joinedAt?: Date;
    leftAt?: Date;
}

export class CommunityListResponseDto {
    communities: CommunityCardDto[] | undefined;
    hasMore: boolean | undefined;
    nextCursor?: string;
    totalCount: number | undefined;
}

export class CommunityMemberListResponseDto {
    members: CommunityMemberResponseDto[] | undefined;
    hasMore: boolean | undefined;
    nextCursor?: string;
    totalCount: number | undefined;
}

export class CommunitySearchResponseDto {
    communities: CommunityCardDto[] | undefined;
    users: any[] | undefined; // Will be populated with user search results
    hasMore: boolean | undefined;
    nextCursor?: string;
    totalCount: number | undefined;
    searchType: string | undefined;
}

export class UserSearchResultDto {
    _id: string | undefined;
    username: string | undefined;
    name: string | undefined;
    profilePic: string | undefined;
    bio: string | undefined;
    isVerified: boolean | undefined;
    followersCount: number | undefined;
    isFollowing?: boolean;
}