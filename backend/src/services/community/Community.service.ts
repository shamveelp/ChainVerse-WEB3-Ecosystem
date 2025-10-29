import { injectable, inject } from "inversify";
import { ICommunityService } from "../../core/interfaces/services/community/ICommunityService";
import { ICommunityRepository } from "../../core/interfaces/repositories/ICommunityRepository";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import { 
    CommunityProfileResponseDto, 
    CommunityMemberResponseDto, 
    CommunityJoinResponseDto,
    CommunityListResponseDto,
    CommunityMemberListResponseDto,
    CommunitySearchResponseDto,
    CommunityCardDto,
    UserSearchResultDto
} from "../../dtos/community/Community.dto";
import { Types } from "mongoose";

@injectable()
export class CommunityService implements ICommunityService {
    constructor(
        @inject(TYPES.ICommunityRepository) private _communityRepository: ICommunityRepository
    ) {}

    async getCommunityById(communityId: string, viewerUserId?: string): Promise<CommunityProfileResponseDto | null> {
        try {
            if (!communityId) {
                throw new CustomError("Community ID is required", StatusCode.BAD_REQUEST);
            }

            const community = await this._communityRepository.findCommunityById(communityId);
            if (!community) {
                throw new CustomError("Community not found", StatusCode.NOT_FOUND);
            }

            if (community.status !== 'approved') {
                throw new CustomError("Community not available", StatusCode.NOT_FOUND);
            }

            // Check if viewer is a member (if authenticated)
            let isMember = false;
            let memberRole: string | undefined;
            let memberCount = 0;

            if (viewerUserId) {
                const memberStatus = await this._communityRepository.checkCommunityMembership(viewerUserId, community._id.toString());
                isMember = memberStatus.isMember;
                memberRole = memberStatus.role;
            }

            // Get member count
            memberCount = await this._communityRepository.getCommunityMemberCount(community._id.toString());

            // Map to DTO
            const profileData: CommunityProfileResponseDto = {
                _id: community._id.toString(),
                communityName: community.communityName,
                username: community.username,
                description: community.description,
                category: community.category,
                logo: community.logo || "",
                banner: community.banner || "",
                isVerified: community.isVerified || false,
                memberCount: memberCount,
                rules: community.rules || [],
                socialLinks: community.socialLinks || [],
                settings: {
                    allowChainCast: community.settings?.allowChainCast || false,
                    allowGroupChat: community.settings?.allowGroupChat || true,
                    allowPosts: community.settings?.allowPosts || true,
                    allowQuests: community.settings?.allowQuests || false
                },
                createdAt: community.createdAt,
                isMember,
                memberRole,
                isAdmin: community.communityAdmins.some(adminId => adminId.toString() === viewerUserId)
            };

            return profileData;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch community", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getCommunityByUsername(username: string, viewerUserId?: string): Promise<CommunityProfileResponseDto | null> {
        try {
            if (!username) {
                throw new CustomError("Community username is required", StatusCode.BAD_REQUEST);
            }

            const community = await this._communityRepository.findCommunityByUsername(username);
            if (!community) {
                throw new CustomError("Community not found", StatusCode.NOT_FOUND);
            }

            return await this.getCommunityById(community._id.toString(), viewerUserId);
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch community", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async searchCommunities(query: string, type: string = 'all', viewerUserId?: string, cursor?: string, limit: number = 20): Promise<CommunitySearchResponseDto> {
        try {
            if (!query) {
                throw new CustomError("Search query is required", StatusCode.BAD_REQUEST);
            }

            const validLimit = Math.min(Math.max(limit, 1), 50);
            const communities: CommunityCardDto[] = [];
            const users: UserSearchResultDto[] = [];

            if (type === 'communities' || type === 'all') {
                const communityResult = await this._communityRepository.searchCommunities(query, cursor, validLimit);

                // Map communities to DTOs
                for (const community of communityResult.communities) {
                    let isMember = false;
                    let memberCount = 0;

                    if (viewerUserId) {
                        const memberStatus = await this._communityRepository.checkCommunityMembership(viewerUserId, community._id.toString());
                        isMember = memberStatus.isMember;
                    }

                    memberCount = await this._communityRepository.getCommunityMemberCount(community._id.toString());

                    communities.push({
                        _id: community._id.toString(),
                        communityName: community.communityName,
                        username: community.username,
                        description: community.description,
                        category: community.category,
                        logo: community.logo || "",
                        isVerified: community.isVerified || false,
                        memberCount,
                        isMember,
                        createdAt: community.createdAt
                    });
                }
            }

            if (type === 'users' || type === 'all') {
                // Search users functionality
                const userResult = await this._communityRepository.searchUsers(query, cursor, validLimit);

                // Map users to DTOs
                for (const user of userResult.users) {
                    let isFollowing = false;
                    
                    if (viewerUserId && viewerUserId !== user._id.toString()) {
                        isFollowing = await this._communityRepository.checkIfFollowing(viewerUserId, user._id.toString());
                    }

                    users.push({
                        _id: user._id.toString(),
                        username: user.username,
                        name: user.name || "",
                        profilePic: user.profilePic || "",
                        bio: user.community?.bio || "",
                        isVerified: user.community?.isVerified || false,
                        followersCount: user.followersCount || 0,
                        isFollowing
                    });
                }
            }

            // Determine pagination based on the type
            let hasMore = false;
            let nextCursor: string | undefined;
            let totalCount = 0;

            if (type === 'communities') {
                const result = await this._communityRepository.searchCommunities(query, cursor, validLimit);
                hasMore = result.hasMore;
                nextCursor = result.nextCursor;
                totalCount = result.totalCount;
            } else if (type === 'users') {
                const result = await this._communityRepository.searchUsers(query, cursor, validLimit);
                hasMore = result.hasMore;
                nextCursor = result.nextCursor;
                totalCount = result.totalCount;
            } else {
                // For 'all', we need to combine the results
                const [communityResult, userResult] = await Promise.all([
                    this._communityRepository.searchCommunities(query, cursor, validLimit),
                    this._communityRepository.searchUsers(query, cursor, validLimit)
                ]);
                hasMore = communityResult.hasMore || userResult.hasMore;
                nextCursor = communityResult.nextCursor || userResult.nextCursor;
                totalCount = communityResult.totalCount + userResult.totalCount;
            }

            return {
                communities,
                users,
                hasMore,
                nextCursor,
                totalCount,
                searchType: type
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to search", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getPopularCommunities(viewerUserId?: string, cursor?: string, limit: number = 20, category?: string): Promise<CommunityListResponseDto> {      
        try {
            const validLimit = Math.min(Math.max(limit, 1), 50);
            const result = await this._communityRepository.getPopularCommunities(cursor, validLimit, category);

            // Map to DTOs
            const communities: CommunityCardDto[] = [];
            for (const community of result.communities) {
                let isMember = false;
                let memberCount = 0;

                if (viewerUserId) {
                    const memberStatus = await this._communityRepository.checkCommunityMembership(viewerUserId, community._id.toString());
                    isMember = memberStatus.isMember;
                }

                memberCount = await this._communityRepository.getCommunityMemberCount(community._id.toString());

                communities.push({
                    _id: community._id.toString(),
                    communityName: community.communityName,
                    username: community.username,
                    description: community.description,
                    category: community.category,
                    logo: community.logo || "",
                    isVerified: community.isVerified || false,
                    memberCount,
                    isMember,
                    createdAt: community.createdAt
                });
            }

            return {
                communities,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
                totalCount: result.totalCount
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get popular communities", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async joinCommunity(userId: string, communityUsername: string): Promise<CommunityJoinResponseDto> {
        try {
            if (!userId || !communityUsername) {
                throw new CustomError("User ID and community username are required", StatusCode.BAD_REQUEST);
            }

            // Get community
            const community = await this._communityRepository.findCommunityByUsername(communityUsername);
            if (!community) {
                throw new CustomError("Community not found", StatusCode.NOT_FOUND);
            }

            if (community.status !== 'approved') {
                throw new CustomError("Community not available for joining", StatusCode.BAD_REQUEST);
            }

            // Check if already a member
            const memberStatus = await this._communityRepository.checkCommunityMembership(userId, community._id.toString());
            if (memberStatus.isMember) {
                throw new CustomError("You are already a member of this community", StatusCode.BAD_REQUEST);
            }

            // Join community
            await this._communityRepository.addCommunityMember(userId, community._id.toString());

            // Get updated member count
            const memberCount = await this._communityRepository.getCommunityMemberCount(community._id.toString());

            return {
                success: true,
                message: `You joined ${community.communityName}`,
                isMember: true,
                memberCount,
                joinedAt: new Date()
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to join community", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async leaveCommunity(userId: string, communityUsername: string): Promise<CommunityJoinResponseDto> {
        try {
            if (!userId || !communityUsername) {
                throw new CustomError("User ID and community username are required", StatusCode.BAD_REQUEST);
            }

            // Get community
            const community = await this._communityRepository.findCommunityByUsername(communityUsername);
            if (!community) {
                throw new CustomError("Community not found", StatusCode.NOT_FOUND);
            }

            // Check if member
            const memberStatus = await this._communityRepository.checkCommunityMembership(userId, community._id.toString());
            if (!memberStatus.isMember) {
                throw new CustomError("You are not a member of this community", StatusCode.BAD_REQUEST);
            }

            // Leave community
            await this._communityRepository.removeCommunityMember(userId, community._id.toString());

            // Get updated member count
            const memberCount = await this._communityRepository.getCommunityMemberCount(community._id.toString());

            return {
                success: true,
                message: `You left ${community.communityName}`,
                isMember: false,
                memberCount,
                leftAt: new Date()
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to leave community", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getCommunityMembers(communityUsername: string, viewerUserId?: string, cursor?: string, limit: number = 20): Promise<CommunityMemberListResponseDto> {
        try {
            if (!communityUsername) {
                throw new CustomError("Community username is required", StatusCode.BAD_REQUEST);
            }

            const community = await this._communityRepository.findCommunityByUsername(communityUsername);
            if (!community) {
                throw new CustomError("Community not found", StatusCode.NOT_FOUND);
            }

            const validLimit = Math.min(Math.max(limit, 1), 50);
            const result = await this._communityRepository.getCommunityMembers(community._id.toString(), cursor, validLimit);

            // Map to DTOs
            const members: CommunityMemberResponseDto[] = result.members.map(member => {
                // Type assertion to inform TypeScript that userId is populated with user data
                const user = member.userId as unknown as {
                    _id: Types.ObjectId;
                    username: string;
                    name: string;
                    profilePic: string;
                    community?: { isVerified: boolean };
                };

                return {
                    _id: member._id.toString(),
                    user: {
                        _id: user._id.toString(),
                        username: user.username || "",
                        name: user.name || "",
                        profilePic: user.profilePic || "",
                        isVerified: user.community?.isVerified || false
                    },
                    role: member.role,
                    joinedAt: member.joinedAt,
                    isActive: member.isActive,
                    totalPosts: member.totalPosts,
                    totalLikes: member.totalLikes,
                    totalComments: member.totalComments
                };
            });

            return {
                members,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
                totalCount: result.totalCount
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get community members", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getCommunityMemberStatus(userId: string, communityUsername: string): Promise<{ isMember: boolean; role?: string; joinedAt?: Date }> {
        try {
            if (!userId || !communityUsername) {
                throw new CustomError("User ID and community username are required", StatusCode.BAD_REQUEST);
            }

            const community = await this._communityRepository.findCommunityByUsername(communityUsername);
            if (!community) {
                throw new CustomError("Community not found", StatusCode.NOT_FOUND);
            }

            const memberStatus = await this._communityRepository.checkCommunityMembership(userId, community._id.toString());
            return memberStatus;
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to get member status", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }
}
