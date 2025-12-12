import { injectable, inject } from "inversify";
import { IAdminCommunityManagementService } from "../../core/interfaces/services/admin/IAdminCommunityManagement.service";
import { IAdminCommunityManagementRepository } from "../../core/interfaces/repositories/admin/IAdminCommunityManagement.repository";
import { TYPES } from "../../core/types/types";
import { ICommunity } from "../../models/community.model";

@injectable()
export class AdminCommunityManagementService implements IAdminCommunityManagementService {
    constructor(
        @inject(TYPES.IAdminCommunityManagementRepository) private _repository: IAdminCommunityManagementRepository
    ) { }

    async getAllCommunities(page: number, limit: number, search: string, status?: string, isVerified?: boolean | string): Promise<{ communities: ICommunity[], total: number, page: number, limit: number }> {
        const { communities, total } = await this._repository.getAllCommunities(page, limit, search, status, isVerified);
        return { communities, total, page, limit };
    }

    async getCommunityById(id: string): Promise<ICommunity | null> {
        return await this._repository.getCommunityById(id);
    }

    async updateCommunityStatus(id: string, status: string): Promise<ICommunity | null> {
        return await this._repository.updateCommunityStatus(id, status);
    }

    async updateVerificationStatus(id: string, isVerified: boolean): Promise<ICommunity | null> {
        return await this._repository.updateVerificationStatus(id, isVerified);
    }

    async deleteCommunity(id: string): Promise<boolean> {
        return await this._repository.deleteCommunity(id);
    }

    async getCommunityMembers(communityId: string, page: number, limit: number, search: string): Promise<{ members: any[], total: number, page: number, limit: number }> {
        const { members, total } = await this._repository.getCommunityMembers(communityId, page, limit, search);
        return { members, total, page, limit };
    }

    async updateCommunitySettings(id: string, settings: any): Promise<ICommunity | null> {
        return await this._repository.updateCommunitySettings(id, settings);
    }
}
