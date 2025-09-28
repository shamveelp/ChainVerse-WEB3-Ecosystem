import { CommunityProfileResponseDto, UpdateCommunityProfileDto } from "../../../../dtos/community/CommunityProfile.dto";

export interface ICommunityUserService {
    getCommunityProfile(userId: string, viewerUserId?: string): Promise<CommunityProfileResponseDto | null>;
    getCommunityProfileByUsername(username: string, viewerUserId?: string): Promise<CommunityProfileResponseDto | null>;
    updateCommunityProfile(userId: string, data: UpdateCommunityProfileDto): Promise<CommunityProfileResponseDto | null>;
    uploadBannerImage(userId: string, bannerUrl: string): Promise<CommunityProfileResponseDto | null>;
}