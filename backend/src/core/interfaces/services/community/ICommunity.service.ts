import {
    CommunityProfileResponseDto,
    CommunityJoinResponseDto,
    CommunityListResponseDto,
    CommunityMemberListResponseDto,
    CommunitySearchResponseDto
} from "../../../../dtos/community/Community.dto";

export interface ICommunityService {
    getCommunityById(communityId: string, viewerUserId?: string): Promise<CommunityProfileResponseDto | null>;
    getCommunityByUsername(username: string, viewerUserId?: string): Promise<CommunityProfileResponseDto | null>;
    searchCommunities(query: string, type: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<CommunitySearchResponseDto>;
    getPopularCommunities(viewerUserId?: string, cursor?: string, limit?: number, category?: string): Promise<CommunityListResponseDto>;
    joinCommunity(userId: string, communityUsername: string): Promise<CommunityJoinResponseDto>;
    leaveCommunity(userId: string, communityUsername: string): Promise<CommunityJoinResponseDto>;
    getCommunityMembers(communityUsername: string, viewerUserId?: string, cursor?: string, limit?: number): Promise<CommunityMemberListResponseDto>;
    getCommunityMemberStatus(userId: string, communityUsername: string): Promise<{ isMember: boolean; role?: string; joinedAt?: Date }>;
}