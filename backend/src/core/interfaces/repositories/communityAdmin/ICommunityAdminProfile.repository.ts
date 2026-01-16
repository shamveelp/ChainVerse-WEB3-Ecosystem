import { ICommunityAdmin } from "../../../../models/communityAdmin.model";
import { ICommunity } from "../../../../models/community.model";

export interface ICommunityStats {
    totalMembers: number;
    activeMembers: number;
    newMembersToday: number;
    newMembersThisWeek: number;
    premiumMembers: number;
    bannedMembers: number;
    engagementRate: number;
}

export interface ICommunityAdminProfileRepository {
    findById(adminId: string): Promise<ICommunityAdmin | null>;
    updateProfile(adminId: string, updateData: Partial<ICommunityAdmin>): Promise<ICommunityAdmin | null>;
    getCommunityStats(communityId: string): Promise<ICommunityStats>;
    getCommunityDetails(communityId: string): Promise<ICommunity | null>;
    updateCommunitySettings(communityId: string, settings: Partial<ICommunity['settings']>): Promise<ICommunity | null>;
}