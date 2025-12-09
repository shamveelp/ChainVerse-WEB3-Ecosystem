import { injectable, inject } from "inversify";
import { IUserMyCommunitiesService } from "../../core/interfaces/services/community/IUserMyCommunities.service";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunityRepository";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { 
    MyCommunitiesListResponseDto,
    MyCommunitiesStatsDto,
    MyCommunitiesActivityResponseDto,
    MyCommunityCardDto,
    CommunityActivityDto
} from "../../dtos/community/MyCommunities.dto";
import { Types } from "mongoose";

@injectable()
export class UserMyCommunitiesService implements IUserMyCommunitiesService {
    constructor(
        @inject(TYPES.ICommunityRepository) private _communityRepository: ICommunityRepository
    ) {}

    async getMyCommunities(
        userId: string,
        filter: string = 'all',
        sortBy: string = 'recent',
        cursor?: string,
        limit: number = 20
    ): Promise<MyCommunitiesListResponseDto> {
        try {
            if (!userId) {
                throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
            }

            const validLimit = Math.min(Math.max(limit, 1), 50);
            const result = await this._communityRepository.getUserCommunities(
                userId,
                filter,
                sortBy,
                cursor,
                validLimit
            );

            // Map to DTOs
            const communities: MyCommunityCardDto[] = result.memberships.map(membership => {
                const community = membership.community;
                return {
                    _id: community._id.toString(),
                    communityName: community.communityName,
                    username: community.username,
                    description: community.description,
                    category: community.category,
                    logo: community.logo || "",
                    banner: community.banner || "",
                    isVerified: community.isVerified || false,
                    memberCount: membership.memberCount || 0,
                    memberRole: membership.role,
                    joinedAt: membership.joinedAt,
                    lastActiveAt: membership.lastActiveAt,
                    unreadPosts: membership.unreadPosts || 0,
                    totalPosts: membership.totalPosts || 0,
                    isActive: membership.isActive,
                    settings: {
                        allowChainCast: community.settings?.allowChainCast || false,
                        allowGroupChat: community.settings?.allowGroupChat || true,
                        allowPosts: community.settings?.allowPosts || true,
                        allowQuests: community.settings?.allowQuests || false
                    },
                    notifications: membership.notifications || false,
                    createdAt: community.createdAt
                };
            });

            // Get stats
            const stats = await this.getMyCommunitiesStats(userId);

            return {
                communities,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
                totalCount: result.totalCount,
                stats
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get my communities", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getMyCommunitiesStats(userId: string): Promise<MyCommunitiesStatsDto> {
        try {
            if (!userId) {
                throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
            }

            const stats = await this._communityRepository.getUserCommunityStats(userId);

            return {
                totalCommunities: stats.total,
                adminCommunities: stats.admin,
                moderatorCommunities: stats.moderator,
                memberCommunities: stats.member
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get communities stats", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getMyCommunitiesActivity(userId: string): Promise<MyCommunitiesActivityResponseDto> {
        try {
            if (!userId) {
                throw new CustomError("User ID is required", StatusCode.BAD_REQUEST);
            }

            const activity = await this._communityRepository.getUserCommunitiesActivity(userId);

            const activities: CommunityActivityDto[] = activity.communities.map(item => ({
                communityId: item.community._id.toString(),
                communityName: item.community.communityName,
                username: item.community.username,
                logo: item.community.logo || "",
                lastActiveAt: item.lastActiveAt,
                unreadPosts: item.unreadPosts,
                recentActivity: item.recentActivity
            }));

            return {
                activities,
                totalUnreadPosts: activity.totalUnreadPosts,
                mostActiveToday: activity.mostActiveToday
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get communities activity", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async updateCommunityNotifications(userId: string, communityId: string, enabled: boolean): Promise<boolean> {
        try {
            if (!userId || !communityId) {
                throw new CustomError("User ID and Community ID are required", StatusCode.BAD_REQUEST);
            }

            return await this._communityRepository.updateMemberNotifications(userId, communityId, enabled);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to update notifications", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async leaveCommunity(userId: string, communityId: string): Promise<{ success: boolean; message: string }> {
        try {
            if (!userId || !communityId) {
                throw new CustomError("User ID and Community ID are required", StatusCode.BAD_REQUEST);
            }

            const community = await this._communityRepository.findCommunityById(communityId);
            if (!community) {
                throw new CustomError("Community not found", StatusCode.NOT_FOUND);
            }

            await this._communityRepository.removeCommunityMember(userId, communityId);

            return {
                success: true,
                message: `You left ${community.communityName}`
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to leave community", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }
}