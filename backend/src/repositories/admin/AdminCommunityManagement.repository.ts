import { injectable } from "inversify";
import { IAdminCommunityManagementRepository } from "../../core/interfaces/repositories/admin/IAdminCommunityManagement.repository";
import CommunityModel, { ICommunity } from "../../models/community.model";
import CommunityMemberModel, { ICommunityMember } from "../../models/communityMember.model";
import { FilterQuery, PipelineStage, Types } from "mongoose";
import { IUser } from "../../models/user.models";

type PopulatedCommunityMember = Omit<ICommunityMember, 'userId'> & { userId: IUser | null };

@injectable()
export class AdminCommunityManagementRepository implements IAdminCommunityManagementRepository {

    async getAllCommunities(page: number, limit: number, search: string, status?: string, isVerified?: boolean | string): Promise<{ communities: ICommunity[], total: number }> {
        const query: FilterQuery<ICommunity> = {};

        if (search) {
            query.$or = [
                { communityName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        if (isVerified !== undefined && isVerified !== 'all') {
            query.isVerified = isVerified === 'true' || isVerified === true;
        }

        const skip = (page - 1) * limit;

        const communities = await CommunityModel.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await CommunityModel.countDocuments(query);

        return { communities, total };
    }

    async getCommunityById(id: string): Promise<ICommunity | null> {
        return await CommunityModel.findById(id).populate('communityAdmins', 'username email');
    }

    async updateCommunityStatus(id: string, status: string): Promise<ICommunity | null> {
        return await CommunityModel.findByIdAndUpdate(id, { status }, { new: true });
    }

    async updateVerificationStatus(id: string, isVerified: boolean): Promise<ICommunity | null> {
        return await CommunityModel.findByIdAndUpdate(id, { isVerified }, { new: true });
    }

    async deleteCommunity(id: string): Promise<boolean> {
        const result = await CommunityModel.findByIdAndDelete(id);
        return !!result;
    }

    async getCommunityMembers(communityId: string, page: number, limit: number, search: string): Promise<{ members: ICommunityMember[], total: number }> {
        const query: FilterQuery<ICommunityMember> = { communityId };

        // Note: The previous unused aggregation code was removed for cleanliness and type safety.

        const skip = (page - 1) * limit;

        const populateOptions = {
            path: 'userId',
            select: 'username email profileImage',
            match: search ? {
                $or: [
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            } : {}
        };

        let members = await CommunityMemberModel.find(query)
            .populate(populateOptions)
            .sort({ joinedAt: -1 })
            .lean() as unknown as ICommunityMember[];

        // Filter out where userId is null (didn't match search)
        if (search) {
            const populatedMembers = members as unknown as PopulatedCommunityMember[];
            members = populatedMembers.filter((m) => m.userId) as unknown as ICommunityMember[];
        }

        const total = members.length; // Approximate total after search

        // Manual pagination after filtering (if search exists)
        if (search) {
            members = members.slice(skip, skip + limit);
        } else {
            // Database pagination
            members = await CommunityMemberModel.find(query)
                .populate('userId', 'username email profileImage')
                .skip(skip)
                .limit(limit)
                .sort({ joinedAt: -1 })
                .lean();

            return { members: members as unknown as ICommunityMember[], total: await CommunityMemberModel.countDocuments(query) };
        }

        return { members: members as unknown as ICommunityMember[], total };
    }

    async updateCommunitySettings(id: string, settings: ICommunity['settings']): Promise<ICommunity | null> {
        return await CommunityModel.findByIdAndUpdate(id, { settings }, { new: true });
    }
}
