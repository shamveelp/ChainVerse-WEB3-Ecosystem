import {
    CommunityAdminDashboardResponseDto,
    CommunityOverviewDto,
    CommunityStatsDto
} from "../../../../dtos/communityAdmin/CommunityAdminDashboard.dto";

export interface ICommunityAdminDashboardService {
    getDashboardData(adminId: string, period?: string): Promise<CommunityAdminDashboardResponseDto>;
    getCommunityOverview(adminId: string): Promise<CommunityOverviewDto>;
    getCommunityStats(adminId: string, period?: string): Promise<CommunityStatsDto>;
}
