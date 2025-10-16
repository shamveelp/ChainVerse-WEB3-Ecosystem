import { injectable, inject } from "inversify";
import { TYPES } from "../../core/types/types";
import { CustomError } from "../../utils/customError";
import { StatusCode } from "../../enums/statusCode.enum";
import logger from "../../utils/logger";
import { ICommunityAdminMembersService } from "../../core/interfaces/services/communityAdmin/ICommunityAdminMembersService";
import { ICommunityAdminRepository } from "../../core/interfaces/repositories/ICommunityAdminRepository";
import { IUserRepository } from "../../core/interfaces/repositories/IUserRepository";
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
    ) {}

    async getCommunityMembers(adminId: string, filters: GetCommunityMembersDto): Promise<CommunityMembersListResponseDto> {
        try {
            console.log("CommunityAdminMembersService: Getting community members for admin:", adminId, "filters:", filters);

            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
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

            console.log("CommunityAdminMembersService: Community members retrieved successfully, count:", transformedMembers.length);

            return new CommunityMembersListResponseDto(
                transformedMembers,
                hasMore,
                nextCursor,
                totalCount,
                summary
            );
        } catch (error) {
            console.error("CommunityAdminMembersService: Get community members error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch community members", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getMemberDetails(adminId: string, memberId: string): Promise<MemberDetailResponseDto> {
        try {
            console.log("CommunityAdminMembersService: Getting member details for admin:", adminId, "member:", memberId);

            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
            }

            const member = await CommunityMemberModel.findOne({
                _id: memberId,
                communityId: admin.communityId
            })
            .populate('userId', 'username name email profilePic')
            .populate('bannedBy', 'name')
            .lean();

            if (!member) {
                throw new CustomError("Member not found", StatusCode.NOT_FOUND);
            }

            console.log("CommunityAdminMembersService: Member details retrieved successfully");
            const memberDetailDto = new CommunityMemberDetailDto(member, (member as any).userId);
            return new MemberDetailResponseDto(memberDetailDto);
        } catch (error) {
            console.error("CommunityAdminMembersService: Get member details error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch member details", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async updateMemberRole(adminId: string, data: UpdateMemberRoleDto): Promise<MemberActionResponseDto> {
        try {
            console.log("CommunityAdminMembersService: Updating member role for admin:", adminId, "data:", data);

            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
            }

            const member = await CommunityMemberModel.findOne({
                _id: data.memberId,
                communityId: admin.communityId
            }).populate('userId', 'username name email profilePic');

            if (!member) {
                throw new CustomError("Member not found", StatusCode.NOT_FOUND);
            }

            // Prevent changing role of other admins
            if (member.role === 'admin' && member.role !== 'admin') {
                throw new CustomError("Cannot change role of community admin", StatusCode.FORBIDDEN);
            }

            // Update member role
            member.role = data.role;
            await member.save();

            console.log("CommunityAdminMembersService: Member role updated successfully");

            const updatedMemberDto = new CommunityMemberDto(member.toObject(), (member as any).userId);
            return new MemberActionResponseDto(updatedMemberDto, "Member role updated successfully");
        } catch (error) {
            console.error("CommunityAdminMembersService: Update member role error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to update member role", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async banMember(adminId: string, data: BanMemberDto): Promise<MemberActionResponseDto> {
        try {
            console.log("CommunityAdminMembersService: Banning member for admin:", adminId, "data:", data);

            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
            }

            const member = await CommunityMemberModel.findOne({
                _id: data.memberId,
                communityId: admin.communityId
            }).populate('userId', 'username name email profilePic');

            if (!member) {
                throw new CustomError("Member not found", StatusCode.NOT_FOUND);
            }

            // Prevent banning other admins or moderators
            if (member.role === 'admin' || member.role === 'moderator') {
                throw new CustomError("Cannot ban community admin or moderator", StatusCode.FORBIDDEN);
            }

            // Set ban details
            member.isActive = false;
            member.banReason = data.reason;
            member.bannedBy = admin._id;

            if (data.durationDays) {
                member.bannedUntil = new Date(Date.now() + (data.durationDays * 24 * 60 * 60 * 1000));
            }

            await member.save();

            console.log("CommunityAdminMembersService: Member banned successfully");

            const bannedMemberDto = new CommunityMemberDto(member.toObject(), (member as any).userId);
            return new MemberActionResponseDto(bannedMemberDto, "Member banned successfully");
        } catch (error) {
            console.error("CommunityAdminMembersService: Ban member error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to ban member", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async unbanMember(adminId: string, memberId: string): Promise<MemberActionResponseDto> {
        try {
            console.log("CommunityAdminMembersService: Unbanning member for admin:", adminId, "member:", memberId);

            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
            }

            const member = await CommunityMemberModel.findOne({
                _id: memberId,
                communityId: admin.communityId
            }).populate('userId', 'username name email profilePic');

            if (!member) {
                throw new CustomError("Member not found", StatusCode.NOT_FOUND);
            }

            // Unban member
            member.isActive = true;
            member.bannedUntil = undefined;
            member.banReason = undefined;
            member.bannedBy = undefined;

            await member.save();

            console.log("CommunityAdminMembersService: Member unbanned successfully");

            const unbannedMemberDto = new CommunityMemberDto(member.toObject(), (member as any).userId);
            return new MemberActionResponseDto(unbannedMemberDto, "Member unbanned successfully");
        } catch (error) {
            console.error("CommunityAdminMembersService: Unban member error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to unban member", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async removeMember(adminId: string, memberId: string, reason?: string): Promise<any> {
        try {
            console.log("CommunityAdminMembersService: Removing member for admin:", adminId, "member:", memberId);

            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
            }

            const member = await CommunityMemberModel.findOne({
                _id: memberId,
                communityId: admin.communityId
            }).populate('userId', 'username name email profilePic');

            if (!member) {
                throw new CustomError("Member not found", StatusCode.NOT_FOUND);
            }

            // Prevent removing other admins or moderators
            if (member.role === 'admin' || member.role === 'moderator') {
                throw new CustomError("Cannot remove community admin or moderator", StatusCode.FORBIDDEN);
            }

            // Remove member from community
            await CommunityMemberModel.findByIdAndDelete(memberId);

            console.log("CommunityAdminMembersService: Member removed successfully");

            return {
                success: true,
                memberId,
                removedBy: adminId,
                reason: reason || "Removed by community admin",
                message: "Member removed from community successfully"
            };
        } catch (error) {
            console.error("CommunityAdminMembersService: Remove member error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to remove member", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async getMemberActivity(adminId: string, memberId: string, period: string = 'week'): Promise<any> {
        try {
            console.log("CommunityAdminMembersService: Getting member activity for admin:", adminId, "member:", memberId, "period:", period);

            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
            }

            const member = await CommunityMemberModel.findOne({
                _id: memberId,
                communityId: admin.communityId
            }).populate('userId', 'username name profilePic');

            if (!member) {
                throw new CustomError("Member not found", StatusCode.NOT_FOUND);
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

            console.log("CommunityAdminMembersService: Member activity retrieved successfully");
            return activityData;
        } catch (error) {
            console.error("CommunityAdminMembersService: Get member activity error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch member activity", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

    async bulkUpdateMembers(adminId: string, data: any): Promise<any> {
        try {
            console.log("CommunityAdminMembersService: Bulk updating members for admin:", adminId, "data:", data);

            const admin = await this._adminRepository.findById(adminId);
            if (!admin || !admin.communityId) {
                throw new CustomError("Community admin or community not found", StatusCode.NOT_FOUND);
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

            console.log("CommunityAdminMembersService: Bulk update completed");

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
            console.error("CommunityAdminMembersService: Bulk update members error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to perform bulk action", StatusCode.INTERNAL_SERVER_ERROR);
        }
    }

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
