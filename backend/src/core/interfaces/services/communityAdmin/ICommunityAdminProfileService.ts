import {
    CommunityAdminProfileResponseDto,
    UpdateCommunityAdminProfileDto,
    CommunityStatsDto
} from "../../../../dtos/communityAdmin/CommunityAdminProfile.dto";

export interface ICommunityAdminProfileService {
    getProfile(adminId: string): Promise<CommunityAdminProfileResponseDto>;
    updateProfile(adminId: string, data: UpdateCommunityAdminProfileDto): Promise<CommunityAdminProfileResponseDto>;
    getCommunityStats(adminId: string, period?: string): Promise<CommunityStatsDto>;
}