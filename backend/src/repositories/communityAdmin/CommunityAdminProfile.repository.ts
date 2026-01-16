import { injectable } from "inversify";
import { ICommunityAdminProfileRepository } from "../../core/interfaces/repositories/communityAdmin/ICommunityAdminProfile.repository";
import CommunityAdminModel, { ICommunityAdmin } from "../../models/communityAdmin.model";
import CommunityModel, { ICommunity } from "../../models/community.model";
import CommunityMemberModel from "../../models/communityMember.model";
import { FilterQuery } from "mongoose";

export interface ICommunityStats {
    totalMembers: number;
    activeMembers: number;
    newMembersToday: number;
    newMembersThisWeek: number;
    premiumMembers: number;
    bannedMembers: number;
    engagementRate: number;
}

@injectable()
export class CommunityAdminProfileRepository implements ICommunityAdminProfileRepository {
    async findById(adminId: string): Promise<ICommunityAdmin | null> {
        return await CommunityAdminModel.findById(adminId)
            .populate('communityId')
            .lean();
    }

    async updateProfile(adminId: string, updateData: Partial<ICommunityAdmin>): Promise<ICommunityAdmin | null> {
        return await CommunityAdminModel.findByIdAndUpdate(
            adminId,
            { ...updateData, updatedAt: new Date() },
            { new: true }
        ).populate('communityId');
    }

    async getCommunityStats(communityId: string): Promise<ICommunityStats> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const week = new Date();
        week.setDate(week.getDate() - 7);

        const [
            totalMembers,
            activeMembers,
            newMembersToday,
            newMembersThisWeek,
            premiumMembers,
            bannedMembers
        ] = await Promise.all([
            CommunityMemberModel.countDocuments({ communityId, isActive: true }),
            CommunityMemberModel.countDocuments({
                communityId,
                isActive: true,
                lastActiveAt: { $gte: week }
            }),
            CommunityMemberModel.countDocuments({
                communityId,
                joinedAt: { $gte: today }
            }),
            CommunityMemberModel.countDocuments({
                communityId,
                joinedAt: { $gte: week }
            }),
            CommunityMemberModel.countDocuments({
                communityId,
                isActive: true,
                isPremium: true
            }),
            CommunityMemberModel.countDocuments({
                communityId,
                $or: [
                    { bannedUntil: { $gt: new Date() } },
                    { bannedUntil: { $exists: true } }
                ]
            })
        ]);

        return {
            totalMembers,
            activeMembers,
            newMembersToday,
            newMembersThisWeek,
            premiumMembers,
            bannedMembers,
            engagementRate: totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0
        };
    }

    async getCommunityDetails(communityId: string): Promise<ICommunity | null> {
        return await CommunityModel.findById(communityId).lean();
    }

    async updateCommunitySettings(communityId: string, settings: Partial<ICommunity['settings']>): Promise<ICommunity | null> {
        return await CommunityModel.findByIdAndUpdate(
            communityId,
            { settings, updatedAt: new Date() },
            { new: true }
        );
    }
}