import { ICommunity } from "../../../../models/community.model";
import { ICommunityMember } from "../../../../models/communityMember.model";

export interface IAdminCommunityManagementRepository {
    getAllCommunities(page: number, limit: number, search: string, status?: string, isVerified?: boolean | string): Promise<{ communities: ICommunity[], total: number }>;
    getCommunityById(id: string): Promise<ICommunity | null>;
    updateCommunityStatus(id: string, status: string): Promise<ICommunity | null>;
    updateVerificationStatus(id: string, isVerified: boolean): Promise<ICommunity | null>;
    deleteCommunity(id: string): Promise<boolean>;
    getCommunityMembers(communityId: string, page: number, limit: number, search: string): Promise<{ members: ICommunityMember[], total: number }>;
    updateCommunitySettings(id: string, settings: ICommunity['settings']): Promise<ICommunity | null>;
}
