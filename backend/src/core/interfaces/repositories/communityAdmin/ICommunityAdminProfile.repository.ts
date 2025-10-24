import { ICommunityAdmin } from "../../../../models/communityAdmin.model";

export interface ICommunityAdminProfileRepository {
    findById(adminId: string): Promise<ICommunityAdmin | null>;
    updateProfile(adminId: string, updateData: Partial<ICommunityAdmin>): Promise<ICommunityAdmin | null>;
    getCommunityStats(communityId: string): Promise<any>;
    getCommunityDetails(communityId: string): Promise<any>;
    updateCommunitySettings(communityId: string, settings: any): Promise<any>;
}