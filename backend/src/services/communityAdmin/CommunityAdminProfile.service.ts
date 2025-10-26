import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { ICommunityAdminProfileService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminProfileService";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunityRepository";
import { IPostRepository } from "../../core/interfaces/repositories/IPostRepository";
import CommunityModel from "../../models/community.model";
import CommunityMemberModel from "../../models/communityMember.model";
import {
    CommunityAdminProfileResponseDto,
    UpdateCommunityAdminProfileDto,
    CommunityStatsDto
} from "../../dtos/communityAdmin/CommunityAdminProfile.dto";

@injectable()
export class CommunityAdminProfileService implements ICommunityAdminProfileService {
    constructor(
        @inject(TYPES.ICommunityAdminRepository) private _adminRepository: ICommunityAdminRepository,
        @inject(TYPES.ICommunityRepository) private _communityRepository: ICommunityRepository,
        @inject(TYPES.IPostRepository) private _postRepository: IPostRepository
    ) {}

    async getProfile(adminId: string): Promise<CommunityAdminProfileResponseDto> {
        try {
            

            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError("Community admin not found", StatusCode.NOT_FOUND);
            }

            let community = null;
            let stats = {
                totalMembers: 0,
                activeMembers: 0,
                totalPosts: 0,
                totalQuests: 0,
                premiumMembers: 0,
                engagementRate: 0
            };

            if (admin.communityId) {
                // Get community details
                community = await CommunityModel.findById(admin.communityId);
                
                if (community) {
                    // Get member statistics
                    const memberStats = await this._getMemberStats(admin.communityId.toString());
                    
                    // Get post statistics
                    const postStats = await this._getPostStats(admin.communityId.toString());
                    
                    stats = {
                        totalMembers: memberStats.totalMembers,
                        activeMembers: memberStats.activeMembers,
                        totalPosts: postStats.totalPosts,
                        totalQuests: 0, // TODO: Implement quests
                        premiumMembers: memberStats.premiumMembers,
                        engagementRate: postStats.engagementRate
                    };
                }
            }

            const profileResponse = new CommunityAdminProfileResponseDto(admin, community, stats);
            
            return profileResponse;
        } catch (error) {
            console.error("CommunityAdminProfileService: Get profile error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch profile", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async updateProfile(adminId: string, data: UpdateCommunityAdminProfileDto): Promise<CommunityAdminProfileResponseDto> {
        try {
            

            const admin = await this._adminRepository.findById(adminId);
            if (!admin) {
                throw new CustomError("Community admin not found", StatusCode.NOT_FOUND);
            }

            // Validate website URL if provided
            if (data.website && data.website.trim() !== "") {
                const websiteRegex = /^https?:\/\/.+/;
                if (!websiteRegex.test(data.website)) {
                    throw new CustomError("Website must be a valid URL starting with http:// or https://", StatusCode.BAD_REQUEST);
                }
            }

            const updateData = {
                ...data,
                website: data.website?.trim() || "",
                bio: data.bio?.trim() || "",
                location: data.location?.trim() || "",
                name: data.name?.trim() || admin.name
            };

            const updatedAdmin = await this._adminRepository.updateCommunityAdmin(adminId, updateData as any);
            if (!updatedAdmin) {
                throw new CustomError("Failed to update profile", StatusCode.INTERNAL_SERVER_ERROR);
            }

            
            return await this.getProfile(adminId);
        } catch (error) {
            console.error("CommunityAdminProfileService: Update profile error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to update profile", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getCommunityStats(adminId: string, period: string = 'week'): Promise<CommunityStatsDto> {
        try {
            

            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
            }

            const communityId = admin.communityId.toString();
            
            // Calculate date range based on period
            const now = new Date();
            let startDate: Date;
            
            switch (period) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            }

            // Get comprehensive stats
            const [memberStats, postStats, topMembers] = await Promise.all([
                this._getMemberStatsWithPeriod(communityId, startDate),
                this._getPostStatsWithPeriod(communityId, startDate),
                this._getTopActiveMembers(communityId)
            ]);

            const statsData = {
                totalMembers: memberStats.totalMembers,
                activeMembers: memberStats.activeMembers,
                newMembersThisWeek: memberStats.newMembers,
                totalPosts: postStats.totalPosts,
                postsThisWeek: postStats.newPosts,
                totalQuests: 0, // TODO: Implement quests
                activeQuests: 0, // TODO: Implement quests
                premiumMembers: memberStats.premiumMembers,
                engagementRate: postStats.engagementRate,
                averagePostsPerMember: memberStats.totalMembers > 0 ? postStats.totalPosts / memberStats.totalMembers : 0,
                topActiveMembers: topMembers
            };

            
            return new CommunityStatsDto(statsData);
        } catch (error) {
            console.error("CommunityAdminProfileService: Get community stats error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch community stats", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    private async _getMemberStats(communityId: string): Promise<any> {
        const totalMembers = await CommunityMemberModel.countDocuments({ communityId, isActive: true });
        const activeMembers = await CommunityMemberModel.countDocuments({
            communityId,
            isActive: true,
            lastActiveAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });
        const premiumMembers = await CommunityMemberModel.countDocuments({
            communityId,
            isActive: true,
            isPremium: true
        });

        return {
            totalMembers,
            activeMembers,
            premiumMembers
        };
    }

    private async _getMemberStatsWithPeriod(communityId: string, startDate: Date): Promise<any> {
        const totalMembers = await CommunityMemberModel.countDocuments({ communityId, isActive: true });
        const activeMembers = await CommunityMemberModel.countDocuments({
            communityId,
            isActive: true,
            lastActiveAt: { $gte: startDate }
        });
        const newMembers = await CommunityMemberModel.countDocuments({
            communityId,
            joinedAt: { $gte: startDate }
        });
        const premiumMembers = await CommunityMemberModel.countDocuments({
            communityId,
            isActive: true,
            isPremium: true
        });

        return {
            totalMembers,
            activeMembers,
            newMembers,
            premiumMembers
        };
    }

    private async _getPostStats(communityId: string): Promise<any> {
        // Get community members
        const members = await CommunityMemberModel.find({ communityId, isActive: true }).select('userId');
        const memberIds = members.map(member => member.userId);

        if (memberIds.length === 0) {
            return { totalPosts: 0, engagementRate: 0 };
        }

        const totalPosts = await this._postRepository.getPostCountByUsers(memberIds.map(id => id.toString()));
        const engagementRate = memberIds.length > 0 ? Math.min((totalPosts / memberIds.length) * 10, 100) : 0;

        return {
            totalPosts,
            engagementRate
        };
    }

    private async _getPostStatsWithPeriod(communityId: string, startDate: Date): Promise<any> {
        // Get community members
        const members = await CommunityMemberModel.find({ communityId, isActive: true }).select('userId');
        const memberIds = members.map(member => member.userId);

        if (memberIds.length === 0) {
            return { totalPosts: 0, newPosts: 0, engagementRate: 0 };
        }

        const [totalPosts, newPosts] = await Promise.all([
            this._postRepository.getPostCountByUsers(memberIds.map(id => id.toString())),
            this._postRepository.getPostCountByUsersAfterDate(memberIds.map(id => id.toString()), startDate)
        ]);

        const engagementRate = memberIds.length > 0 ? Math.min((totalPosts / memberIds.length) * 10, 100) : 0;

        return {
            totalPosts,
            newPosts,
            engagementRate
        };
    }

    private async _getTopActiveMembers(communityId: string): Promise<any[]> {
        const topMembers = await CommunityMemberModel.find({ communityId, isActive: true })
            .populate('userId', 'username name profilePic')
            .sort({ totalPosts: -1, totalLikes: -1 })
            .limit(10)
            .lean();

        return topMembers.map((member: any) => ({
            _id: member.userId._id.toString(),
            username: member.userId.username,
            name: member.userId.name || member.userId.username,
            profilePic: member.userId.profilePic || '',
            totalPosts: member.totalPosts || 0,
            totalLikes: member.totalLikes || 0
        }));
    }
}