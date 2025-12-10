import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { ErrorMessages, SuccessMessages, CommunityAdminMembersMessages } from "../../enums/messages.enum";
import { ICommunityAdminMembersService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminMembers.service";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { IUserRepository } from "../../core/interfaces/repositories/IUser.repository";
import CommunityMemberModel from "../../models/communityMember.model";
import { Types } from "mongoose";
import {
    GetCommunityMembersDto,
    UpdateMemberRoleDto,
    BanMemberDto,
    CommunityMemberDto,
    CommunityMemberDetailDto,
    CommunityMembersListResponseDto,
    MemberActionResponseDto,
    MemberDetailResponseDto
} from "../../dtos/communityAdmin/CommunityAdminMembers.dto";

@injectable()
export class CommunityAdminMembersService implements ICommunityAdminMembersService {
    constructor(
        @inject(TYPES.ICommunityAdminRepository) private _adminRepository: ICommunityAdminRepository,
        @inject(TYPES.IUserRepository) private _userRepository: IUserRepository
    ) { }

    /**
     * Retrieves a paginated list of community members based on filters.
     * @param {string} adminId - The ID of the admin requesting the members.
     * @param {GetCommunityMembersDto} filters - Filters to apply (role, status, search, sort).
     * @returns {Promise<CommunityMembersListResponseDto>} List of members with metadata.
     */
    async getCommunityMembers(adminId: string, filters: GetCommunityMembersDto): Promise<CommunityMembersListResponseDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const communityId = admin.communityId.toString();
            const query: any = { communityId };

            // Apply filters
            if (filters.role) {
                query.role = filters.role;
            }

            if (filters.status) {
                switch (filters.status) {
                    case 'active':
                        query.isActive = true;
                        query.bannedUntil = { $exists: false };
                        break;
                    case 'inactive':
                        query.isActive = false;
                        break;
                    case 'banned':
                        query.$or = [
                            { bannedUntil: { $gt: new Date() } },
                            { bannedUntil: { $exists: true } }
                        ];
                        break;
                }
            }

            // Apply cursor-based pagination
            if (filters.cursor && Types.ObjectId.isValid(filters.cursor)) {
                query._id = { $lt: new Types.ObjectId(filters.cursor) };
            }

            // Build sort
            let sort: any = { _id: -1 };
            switch (filters.sortBy) {
                case 'oldest':
                    sort = { joinedAt: 1 };
                    break;
                case 'most_active':
                    sort = { lastActiveAt: -1 };
                    break;
                case 'most_posts':
                    sort = { totalPosts: -1 };
                    break;
                case 'recent':
                default:
                    sort = { joinedAt: -1 };
                    break;
            }

            // Execute query
            const members = await CommunityMemberModel.find(query)
                .populate('userId', 'username name email profilePic')
                .sort(sort)
                .limit(filters.limit! + 1)
                .lean();

            const hasMore = members.length > filters.limit!;
            const membersList = members.slice(0, filters.limit!);

            // Apply search filter if provided (post-query filtering)
            let filteredMembers = membersList;
            if (filters.search && filters.search.trim()) {
                const searchTerm = filters.search.trim().toLowerCase();
                filteredMembers = membersList.filter((member: any) => {
                    const user = member.userId;
                    return user.username.toLowerCase().includes(searchTerm) ||
                        user.name?.toLowerCase().includes(searchTerm) ||
                        user.email.toLowerCase().includes(searchTerm);
                });
            }

            // Transform to DTOs
            const transformedMembers = filteredMembers.map((member: any) =>
                new CommunityMemberDto(member, member.userId)
            );

            // Get summary stats
            const summary = await this._getMembersSummary(communityId);

            const totalCount = await CommunityMemberModel.countDocuments(query);
            const nextCursor = hasMore && membersList.length > 0
                ? membersList[membersList.length - 1]._id.toString()
                : undefined;

            return new CommunityMembersListResponseDto(
                transformedMembers,
                hasMore,
                nextCursor,
                totalCount,
                summary
            );
        } catch (error) {
            logger.error(CommunityAdminMembersMessages.LOG_GET_MEMBERS, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(CommunityAdminMembersMessages.FAILED_FETCH_MEMBERS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves detailed information about a specific member.
     * @param {string} adminId - The ID of the admin requesting the details.
     * @param {string} memberId - The ID of the member to retrieve.
     * @returns {Promise<MemberDetailResponseDto>} Detailed member information.
     */
    async getMemberDetails(adminId: string, memberId: string): Promise<MemberDetailResponseDto> {
        try {


            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const member = await CommunityMemberModel.findOne({
                _id: memberId,
                communityId: admin.communityId
            })
                .populate('userId', 'username name email profilePic')
                .populate('bannedBy', 'name')
                .lean();

            if (!member) {
                throw new CustomError(ErrorMessages.MEMBER_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const memberDetailDto = new CommunityMemberDetailDto(member, (member as any).userId);
            return new MemberDetailResponseDto(memberDetailDto);
        } catch (error) {
            logger.error(CommunityAdminMembersMessages.LOG_GET_MEMBER_DETAILS, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(CommunityAdminMembersMessages.FAILED_FETCH_MEMBER_DETAILS, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Updates the role of a community member.
     * @param {string} adminId - The ID of the admin performing the update.
     * @param {UpdateMemberRoleDto} data - Data containing member ID and new role.
     * @returns {Promise<MemberActionResponseDto>} Result of the update action.
     */
    async updateMemberRole(adminId: string, data: UpdateMemberRoleDto): Promise<MemberActionResponseDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const member = await CommunityMemberModel.findOne({
                _id: data.memberId,
                communityId: admin.communityId
            }).populate('userId', 'username name email profilePic');

            if (!member) {
                throw new CustomError(ErrorMessages.MEMBER_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Prevent changing role of other admins
            if (member.role === 'admin' && member.role !== 'admin') {
                throw new CustomError(ErrorMessages.CANNOT_CHANGE_ADMIN_ROLE, StatusCode.FORBIDDEN);
            }

            // Update member role
            member.role = data.role;
            await member.save();

            const updatedMemberDto = new CommunityMemberDto(member.toObject(), (member as any).userId);
            return new MemberActionResponseDto(updatedMemberDto, SuccessMessages.MEMBER_ROLE_UPDATED);
        } catch (error) {
            logger.error(CommunityAdminMembersMessages.LOG_UPDATE_ROLE, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(CommunityAdminMembersMessages.FAILED_UPDATE_ROLE, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Bans a member from the community.
     * @param {string} adminId - The ID of the admin performing the ban.
     * @param {BanMemberDto} data - Data containing member ID, reason, and duration.
     * @returns {Promise<MemberActionResponseDto>} Result of the ban action.
     */
    async banMember(adminId: string, data: BanMemberDto): Promise<MemberActionResponseDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const member = await CommunityMemberModel.findOne({
                _id: data.memberId,
                communityId: admin.communityId
            }).populate('userId', 'username name email profilePic');

            if (!member) {
                throw new CustomError(ErrorMessages.MEMBER_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Prevent banning other admins or moderators
            if (member.role === 'admin' || member.role === 'moderator') {
                throw new CustomError(ErrorMessages.CANNOT_BAN_ADMIN_OR_MOD, StatusCode.FORBIDDEN);
            }

            // Set ban details
            member.isActive = false;
            member.banReason = data.reason;
            member.bannedBy = admin._id;

            if (data.durationDays) {
                member.bannedUntil = new Date(Date.now() + (data.durationDays * 24 * 60 * 60 * 1000));
            }

            await member.save();

            const bannedMemberDto = new CommunityMemberDto(member.toObject(), (member as any).userId);
            return new MemberActionResponseDto(bannedMemberDto, SuccessMessages.MEMBER_BANNED);
        } catch (error) {
            logger.error(CommunityAdminMembersMessages.LOG_BAN_MEMBER, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(CommunityAdminMembersMessages.FAILED_BAN_MEMBER, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Unbans a member from the community.
     * @param {string} adminId - The ID of the admin performing the unban.
     * @param {string} memberId - The ID of the member to unban.
     * @returns {Promise<MemberActionResponseDto>} Result of the unban action.
     */
    async unbanMember(adminId: string, memberId: string): Promise<MemberActionResponseDto> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const member = await CommunityMemberModel.findOne({
                _id: memberId,
                communityId: admin.communityId
            }).populate('userId', 'username name email profilePic');

            if (!member) {
                throw new CustomError(ErrorMessages.MEMBER_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Unban member
            member.isActive = true;
            member.bannedUntil = undefined;
            member.banReason = undefined;
            member.bannedBy = undefined;

            await member.save();

            const unbannedMemberDto = new CommunityMemberDto(member.toObject(), (member as any).userId);
            return new MemberActionResponseDto(unbannedMemberDto, SuccessMessages.MEMBER_UNBANNED);
        } catch (error) {
            logger.error(CommunityAdminMembersMessages.LOG_UNBAN_MEMBER, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(CommunityAdminMembersMessages.FAILED_UNBAN_MEMBER, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Removes a member from the community.
     * @param {string} adminId - The ID of the admin performing the removal.
     * @param {string} memberId - The ID of the member to remove.
     * @param {string} [reason] - Reason for removal.
     * @returns {Promise<any>} Result of the removal action.
     */
    async removeMember(adminId: string, memberId: string, reason?: string): Promise<any> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const member = await CommunityMemberModel.findOne({
                _id: memberId,
                communityId: admin.communityId
            }).populate('userId', 'username name email profilePic');

            if (!member) {
                throw new CustomError(ErrorMessages.MEMBER_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Prevent removing other admins or moderators
            if (member.role === 'admin' || member.role === 'moderator') {
                throw new CustomError(ErrorMessages.CANNOT_REMOVE_ADMIN_OR_MOD, StatusCode.FORBIDDEN);
            }

            // Remove member from community
            await CommunityMemberModel.findByIdAndDelete(memberId);

            return {
                success: true,
                memberId,
                removedBy: adminId,
                reason: reason || "Removed by community admin",
                message: CommunityAdminMembersMessages.MEMBER_REMOVED_SUCCESS
            };
        } catch (error) {
            logger.error(CommunityAdminMembersMessages.LOG_REMOVE_MEMBER, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(CommunityAdminMembersMessages.FAILED_REMOVE_MEMBER, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves activity statistics for a member.
     * @param {string} adminId - The ID of the admin requesting the activity.
     * @param {string} memberId - The ID of the member.
     * @param {string} [period='week'] - Time period for activity stats (today, week, month).
     * @returns {Promise<any>} Activity data.
     */
    async getMemberActivity(adminId: string, memberId: string, period: string = 'week'): Promise<any> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const member = await CommunityMemberModel.findOne({
                _id: memberId,
                communityId: admin.communityId
            }).populate('userId', 'username name profilePic');

            if (!member) {
                throw new CustomError(ErrorMessages.MEMBER_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            // Calculate date range
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

            // Create detailed member DTO
            const memberDetailDto = new CommunityMemberDetailDto(member.toObject(), (member as any).userId);

            const activityData = {
                member: memberDetailDto,
                period,
                activity: {
                    posts: member.totalPosts || 0,
                    likes: member.totalLikes || 0,
                    comments: member.totalComments || 0,
                    questsCompleted: member.questsCompleted || 0,
                    lastActive: member.lastActiveAt,
                    joinDate: member.joinedAt
                },
                timeline: [] // TODO: Implement activity timeline
            };

            return activityData;
        } catch (error) {
            logger.error(CommunityAdminMembersMessages.LOG_MEMBER_ACTIVITY, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(CommunityAdminMembersMessages.FAILED_FETCH_ACTIVITY, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Performs bulk actions on multiple members.
     * @param {string} adminId - The ID of the admin performing the actions.
     * @param {any} data - Data containing member IDs, action type, and reason.
     * @returns {Promise<any>} Summary of the bulk operation.
     */
    async bulkUpdateMembers(adminId: string, data: any): Promise<any> {
        try {
            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError(ErrorMessages.COMMUNITY_ADMIN_NOT_FOUND, StatusCode.NOT_FOUND);
            }

            const { memberIds, action, reason } = data;
            const results = [];
            const errors = [];

            for (const memberId of memberIds) {
                try {
                    let result;
                    switch (action) {
                        case 'ban':
                            result = await this.banMember(adminId, {
                                memberId,
                                reason: reason || 'Bulk ban action'
                            });
                            break;
                        case 'unban':
                            result = await this.unbanMember(adminId, memberId);
                            break;
                        case 'remove':
                            result = await this.removeMember(adminId, memberId, reason);
                            break;
                        case 'promote_to_moderator':
                            result = await this.updateMemberRole(adminId, {
                                memberId,
                                role: 'moderator',
                                reason: reason || 'Bulk promotion'
                            });
                            break;
                        case 'demote_to_member':
                            result = await this.updateMemberRole(adminId, {
                                memberId,
                                role: 'member',
                                reason: reason || 'Bulk demotion'
                            });
                            break;
                        default:
                            throw new Error(`Invalid action: ${action}`);
                    }
                    results.push({ memberId, status: 'success', result });
                } catch (error: any) {
                    errors.push({ memberId, status: 'error', error: error.message });
                }
            }

            return {
                success: true,
                totalProcessed: memberIds.length,
                successCount: results.length,
                errorCount: errors.length,
                results,
                errors,
                message: `Bulk ${action} completed. ${results.length} successful, ${errors.length} failed.`
            };
        } catch (error) {
            logger.error(CommunityAdminMembersMessages.LOG_BULK_UPDATE, error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(CommunityAdminMembersMessages.FAILED_BULK_UPDATE, StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Retrieves a summary of member statistics for the community.
     * @param {string} communityId - The ID of the community.
     * @returns {Promise<any>} Summary statistics.
     */
    private async _getMembersSummary(communityId: string): Promise<any> {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [totalMembers, activeMembers, moderators, premiumMembers, bannedMembers, newMembersThisWeek] = await Promise.all([
            CommunityMemberModel.countDocuments({ communityId }),
            CommunityMemberModel.countDocuments({ communityId, isActive: true }),
            CommunityMemberModel.countDocuments({ communityId, role: 'moderator' }),
            CommunityMemberModel.countDocuments({ communityId, isPremium: true }),
            CommunityMemberModel.countDocuments({
                communityId,
                $or: [
                    { bannedUntil: { $gt: new Date() } },
                    { bannedUntil: { $exists: true } }
                ]
            }),
            CommunityMemberModel.countDocuments({
                communityId,
                joinedAt: { $gte: oneWeekAgo }
            })
        ]);

        return {
            totalMembers,
            activeMembers,
            moderators,
            premiumMembers,
            bannedMembers,
            newMembersThisWeek
        };
    }
}
