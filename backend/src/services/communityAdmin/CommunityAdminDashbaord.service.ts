import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { ErrorMessages, SuccessMessages, LoggerMessages } from "../../enums/messages.enum";
import { ICommunityAdminDashboardService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminDashboard.service";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunity.repository";
import { IPostRepository } from "../../core/interfaces/repositories/IPost.repository";
import CommunityMemberModel from "../../models/communityMember.model";
import {
    CommunityAdminDashboardResponseDto,
    CommunityOverviewDto,
    CommunityStatsDto,
    RecentActivityDto,
    TopMemberDto
} from "../../dtos/communityAdmin/CommunityAdminDashboard.dto";
import { ICommunityRequestRepository } from "../../core/interfaces/repositories/ICommunityRequest.repository";

@injectable()
export class CommunityAdminDashboardService implements ICommunityAdminDashboardService {
    constructor(
        @inject(TYPES.ICommunityAdminRepository) private _adminRepository: ICommunityAdminRepository,
        @inject(TYPES.ICommunityRepository) private _communityRepository: ICommunityRepository,
        @inject(TYPES.IPostRepository) private _postRepository: IPostRepository,
        @inject(TYPES.ICommunityRequestRepository) private _communityRequestRepository: ICommunityRequestRepository
    ) { }

    /**
     * Retrieves dashboard data (stats, overview, activity).
     * @param {string} adminId - Admin ID.
     * @param {string} [period='week'] - Period for stats.
     * @returns {Promise<CommunityAdminDashboardResponseDto>} Dashboard DTO.
     */
    async getDashboardData(adminId: string, period: string = 'week'): Promise<CommunityAdminDashboardResponseDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const [communityOverview, stats, recentActivity, topMembers] = await Promise.all([
                this.getCommunityOverview(adminId),
                this.getCommunityStats(adminId, period),
                this._getRecentActivity(admin.communityId.toString()),
                this._getTopMembers(admin.communityId.toString())
            ]);

            return new CommunityAdminDashboardResponseDto(communityOverview, stats, recentActivity, topMembers);
        } catch (error) {
            logger.error(LoggerMessages.GET_COMMUNITY_DASHBOARD_DATA_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_GET_DASHBOARD_DATA, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves overview information about the community.
     * @param {string} adminId - Admin ID.
     * @returns {Promise<CommunityOverviewDto>} Community overview.
     */
    async getCommunityOverview(adminId: string): Promise<CommunityOverviewDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const community = await this._communityRequestRepository.findCommunityById(admin.communityId.toString());
            if (!community) {
                throw new CustomError(ErrorMessages.COMMUNITY_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Get member counts
            const [totalMembers, activeMembers] = await Promise.all([
                CommunityMemberModel.countDocuments({ communityId: admin.communityId, isActive: true }),
                CommunityMemberModel.countDocuments({
                    communityId: admin.communityId,
                    isActive: true,
                    lastActiveAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                })
            ]);

            // Transform social links
            const socialLinks = community.socialLinks?.map((link: any) => ({
                platform: Object.keys(link)[0] as string,
                url: String(Object.values(link)[0])  // Force string conversion
            })) || [];

            const overview: CommunityOverviewDto = {
                _id: community._id.toString(),
                name: community.communityName,
                username: community.username,
                description: community.description,
                category: community.category,
                logo: community.logo,
                banner: community.banner,
                memberCount: totalMembers,
                activeMembers,
                isVerified: community.isVerified,
                settings: community.settings,
                socialLinks
            };

            return overview;
        } catch (error) {
            logger.error(LoggerMessages.GET_COMMUNITY_OVERVIEW_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_GET_COMMUNITY_OVERVIEW, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves statistics for the community.
     * @param {string} adminId - Admin ID.
     * @param {string} [period='week'] - Period.
     * @returns {Promise<CommunityStatsDto>} Community stats.
     */
    async getCommunityStats(adminId: string, period: string = 'week'): Promise<CommunityStatsDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const communityId = admin.communityId.toString();
            const now = new Date();
            let startDate: Date;
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            switch (period) {
                case 'today':
                    startDate = todayStart;
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

            // Get member stats
            const [totalMembers, activeMembers, newMembersToday, newMembersThisWeek] = await Promise.all([
                CommunityMemberModel.countDocuments({ communityId, isActive: true }),
                CommunityMemberModel.countDocuments({
                    communityId,
                    isActive: true,
                    lastActiveAt: { $gte: startDate }
                }),
                CommunityMemberModel.countDocuments({
                    communityId,
                    joinedAt: { $gte: todayStart }
                }),
                CommunityMemberModel.countDocuments({
                    communityId,
                    joinedAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
                })
            ]);

            // Get post stats
            const members = await CommunityMemberModel.find({ communityId, isActive: true }).select('userId');
            const memberUserIds = members.map(member => member.userId.toString());

            const [totalPosts, postsToday, totalLikes, totalComments] = await Promise.all([
                memberUserIds.length > 0 ? this._postRepository.getPostCountByUsers(memberUserIds) : 0,
                memberUserIds.length > 0 ? this._postRepository.getPostCountByUsersAfterDate(memberUserIds, todayStart) : 0,
                this._getTotalLikes(memberUserIds),
                this._getTotalComments(memberUserIds)
            ]);

            // Calculate growth rate (compared to previous period)
            const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
            const previousMembers = await CommunityMemberModel.countDocuments({
                communityId,
                joinedAt: { $gte: previousPeriodStart, $lt: startDate }
            });

            const growthRate = previousMembers > 0
                ? ((newMembersThisWeek - previousMembers) / previousMembers) * 100
                : newMembersThisWeek > 0 ? 100 : 0;

            // Calculate engagement rate
            const engagementRate = totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;

            const stats: CommunityStatsDto = {
                totalMembers,
                activeMembers,
                newMembersToday,
                newMembersThisWeek,
                totalPosts,
                postsToday,
                totalLikes,
                totalComments,
                engagementRate,
                growthRate
            };

            return stats;
        } catch (error) {
            logger.error(LoggerMessages.GET_COMMUNITY_STATS_ERROR, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(ErrorMessages.FAILED_GET_COMMUNITY_STATS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves recent activity in the community.
     * @param {string} communityId - Community ID.
     * @returns {Promise<RecentActivityDto[]>} Recent activity.
     */
    private async _getRecentActivity(communityId: string): Promise<RecentActivityDto[]> {
        try {
            // Get recent member joins (last 50)
            const recentMembers = await CommunityMemberModel.find({
                communityId,
                joinedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            })
                .populate('userId', 'username name profilePic')
                .sort({ joinedAt: -1 })
                .limit(20)
                .lean();

            const activities: RecentActivityDto[] = recentMembers.map(member => ({
                id: member._id.toString(),
                type: 'join' as const,
                user: {
                    _id: (member as any).userId._id.toString(),
                    username: (member as any).userId.username,
                    name: (member as any).userId.name || (member as any).userId.username,
                    profilePic: (member as any).userId.profilePic || '',
                    isVerified: false
                },
                action: 'joined the community',
                timestamp: member.joinedAt
            }));

            return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch (error) {
            return [];
        }
    }

    /**
     * Retrieves top members in the community.
     * @param {string} communityId - Community ID.
     * @returns {Promise<TopMemberDto[]>} Top members.
     */
    private async _getTopMembers(communityId: string): Promise<TopMemberDto[]> {
        try {
            const topMembers = await CommunityMemberModel.find({ communityId, isActive: true })
                .populate('userId', 'username name profilePic')
                .sort({ totalPosts: -1, totalLikes: -1 })
                .limit(10)
                .lean();

            return topMembers.map(member => ({
                _id: (member as any).userId._id.toString(),
                username: (member as any).userId.username,
                name: (member as any).userId.name || (member as any).userId.username,
                profilePic: (member as any).userId.profilePic || '',
                isVerified: false,
                totalPosts: member.totalPosts || 0,
                totalLikes: member.totalLikes || 0,
                totalComments: member.totalComments || 0,
                questsCompleted: member.questsCompleted || 0,
                joinedAt: member.joinedAt,
                role: member.role,
                isPremium: member.isPremium || false
            }));
        } catch (error) {
            return [];
        }
    }

    /**
     * Calculates total likes for a list of users.
     * @param {string[]} userIds - List of User IDs.
     * @returns {Promise<number>} Total likes.
     */
    private async _getTotalLikes(userIds: string[]): Promise<number> {
        // This would need to be implemented based on your likes model
        // For now, return 0 as placeholder
        return 0;
    }

    /**
     * Calculates total comments for a list of users.
     * @param {string[]} userIds - List of User IDs.
     * @returns {Promise<number>} Total comments.
     */
    private async _getTotalComments(userIds: string[]): Promise<number> {
        // This would need to be implemented based on your comments model
        // For now, return 0 as placeholder
        return 0;
    }
}
