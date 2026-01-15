import { ICommunity } from "../../../../models/community.model";
import { IUser } from "../../../../models/user.models";

export interface IAdminCommunityManagementService {
    getAllCommunities(page: number, limit: number, search: string, status?: string, isVerified?: boolean | string): Promise<{ communities: ICommunity[], total: number, page: number, limit: number }>;
    getCommunityById(id: string): Promise<ICommunity | null>;
    updateCommunityStatus(id: string, status: string): Promise<ICommunity | null>;
    updateVerificationStatus(id: string, isVerified: boolean): Promise<ICommunity | null>;
    deleteCommunity(id: string): Promise<boolean>;
    getCommunityMembers(communityId: string, page: number, limit: number, search: string): Promise<{ members: IUser[], total: number, page: number, limit: number }>;
    updateCommunitySettings(id: string, settings: Partial<ICommunity['settings']>): Promise<ICommunity | null>;
}
