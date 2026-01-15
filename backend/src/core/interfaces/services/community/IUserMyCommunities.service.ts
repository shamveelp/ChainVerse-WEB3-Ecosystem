import {
    MyCommunitiesListResponseDto,
    MyCommunitiesStatsDto,
    MyCommunitiesActivityResponseDto
} from "../../../../dtos/community/MyCommunities.dto";

export interface IUserMyCommunitiesService {
    getMyCommunities(userId: string, filter: string, sortBy: string, cursor?: string, limit?: number): Promise<MyCommunitiesListResponseDto>;
    getMyCommunitiesStats(userId: string): Promise<MyCommunitiesStatsDto>;
    getMyCommunitiesActivity(userId: string): Promise<MyCommunitiesActivityResponseDto>;
    updateCommunityNotifications(userId: string, communityId: string, enabled: boolean): Promise<boolean>;
    leaveCommunity(userId: string, communityId: string): Promise<{ success: boolean; message: string }>;
}