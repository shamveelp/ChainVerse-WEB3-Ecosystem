import { IsString, IsOptional, IsNumber, Min, IsBoolean, IsEnum } from 'class-validator';

export class GetMyCommunitiesDto {
    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number = 20;

    @IsOptional()
    @IsString()
    @IsEnum(['all', 'recent', 'active', 'admin', 'moderator'])
    filter?: string = 'all';

    @IsOptional()
    @IsString()
    sortBy?: string = 'recent'; // recent, name, members
}

export class MyCommunitiesStatsDto {
    totalCommunities: number | undefined;
    adminCommunities: number    | undefined;
    moderatorCommunities: number    | undefined;
    memberCommunities: number   | undefined;
}

export class MyCommunityCardDto {
    _id: string | undefined;
    communityName: string   | undefined;
    username: string    | undefined;
    description: string | undefined;
    category: string    | undefined;
    logo: string    | undefined;
    banner?: string  | undefined;
    isVerified: boolean | undefined;
    memberCount: number | undefined;
    memberRole: string  | undefined; // admin, moderator, member
    joinedAt: Date   | undefined;
    lastActiveAt?: Date | undefined;
    unreadPosts: number | undefined;
    totalPosts: number  | undefined;
    isActive: boolean   | undefined;
    settings?: {
        allowChainCast: boolean;
        allowGroupChat: boolean;
        allowPosts: boolean;
        allowQuests: boolean;
    };
    notifications: boolean  | undefined;
    createdAt: Date  | undefined;
}

export class MyCommunitiesListResponseDto {
    communities: MyCommunityCardDto[]   | undefined;
    hasMore: boolean    | undefined;
    nextCursor?: string | undefined;
    totalCount: number  | undefined;
    stats: MyCommunitiesStatsDto    | undefined;
}

export class CommunityActivityDto {
    communityId: string | undefined;
    communityName: string   | undefined;
    username: string    | undefined;
    logo: string    | undefined;
    lastActiveAt: Date  | undefined;
    unreadPosts: number | undefined;
    recentActivity: string  | undefined; // description of recent activity
}

export class MyCommunitiesActivityResponseDto {
    activities: CommunityActivityDto[]  | undefined;
    totalUnreadPosts: number    | undefined;
    mostActiveToday: string[]   | undefined; // list of community names
}