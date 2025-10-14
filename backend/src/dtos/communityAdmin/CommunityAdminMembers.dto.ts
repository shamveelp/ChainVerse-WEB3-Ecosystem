import { BaseResponseDto } from '../base/BaseResponse.dto';

export interface CommunityMemberDto {
    _id: string;
    user: {
        _id: string;
        username: string;
        name: string;
        email: string;
        profilePic: string;
        isVerified: boolean;
    };
    joinedAt: Date;
    role: 'member' | 'moderator' | 'vip';
    status: 'active' | 'inactive' | 'banned';
    isPremium: boolean;
    lastActive: Date;
    stats: {
        totalPosts: number;
        totalLikes: number;
        totalComments: number;
        questsCompleted: number;
    };
}

export interface UpdateMemberDto {
    role?: 'member' | 'moderator' | 'vip';
    status?: 'active' | 'inactive' | 'banned';
    isPremium?: boolean;
}

export interface MembersFilterDto {
    role?: 'member' | 'moderator' | 'vip';
    status?: 'active' | 'inactive' | 'banned';
    isPremium?: boolean;
    search?: string;
    sortBy?: 'joinedAt' | 'lastActive' | 'totalPosts' | 'username';
    sortOrder?: 'asc' | 'desc';
}

export class CommunityMembersResponseDto extends BaseResponseDto {
    members: CommunityMemberDto[];
    hasMore: boolean;
    nextCursor?: string;
    totalCount: number;
    filters: {
        totalMembers: number;
        activeMembers: number;
        premiumMembers: number;
        moderators: number;
        vipMembers: number;
    };

    constructor(
        members: CommunityMemberDto[],
        hasMore: boolean,
        totalCount: number,
        filters: any,
        nextCursor?: string,
        message: string = 'Members retrieved successfully'
    ) {
        super(true, message);
        this.members = members;
        this.hasMore = hasMore;
        this.nextCursor = nextCursor;
        this.totalCount = totalCount;
        this.filters = filters;
    }
}

export class UpdateMemberResponseDto extends BaseResponseDto {
    member: CommunityMemberDto;

    constructor(member: CommunityMemberDto, message: string = 'Member updated successfully') {
        super(true, message);
        this.member = member;
    }
}